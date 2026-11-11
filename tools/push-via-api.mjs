/**
 * Push this folder to GitHub through the REST API (no git binary, no clone).
 *
 * Why: `git push` over HTTPS fails in this environment (schannel/TLS), while api.github.com
 * works. This script uploads every file as a blob, builds one tree on top of the current
 * branch head, commits it, and fast-forwards the branch.
 *
 * Usage (PowerShell):
 *   $env:GITHUB_TOKEN = "github_pat_..."       # fine-grained: 1 repo, Contents: Read and write
 *   node tools/push-via-api.mjs . --list       # list files, no network, no token
 *   node tools/push-via-api.mjs . --dry-run    # authenticate + show what would change
 *   node tools/push-via-api.mjs .              # push
 *
 * The token is read from the environment only — never written to disk or to git config.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { appendFileSync } from "node:fs";
const LOG = process.env.PUSH_LOG ?? "push.log";
const log = (...a) => { const line = a.map(String).join(" "); try { appendFileSync(LOG, line + "\n"); } catch {} console.log(line); };


const ROOT = process.argv[2] ?? ".";
const LIST = process.argv.includes("--list");
const DRY = process.argv.includes("--dry-run");
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO ?? "yxq1337/hexcolorpro";
const BRANCH = process.env.BRANCH ?? "main";
const MAX = Number(process.env.MAX_FILES || 0);
const MESSAGE =
  process.env.COMMIT_MESSAGE ??
  "Add AEO layer, 148 CSS color pages, embed widget, ad CLS fix, brand-contrast study";

const SKIP_DIRS = new Set([".git", "node_modules"]);
const SKIP_FILES = new Set([".DS_Store", "Thumbs.db"]);
const SKIP_EXT = new Set([".zip", ".patch", ".log"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else if (!SKIP_EXT.has(extname(name).toLowerCase())) out.push(relative(ROOT, abs).split("\\").join("/"));
  }
  return out;
}

const allFiles = walk(ROOT).sort();
const files = MAX > 0 ? allFiles.slice(0, MAX) : allFiles;
log(`local files: ${files.length}`);

if (LIST) {
  for (const f of files) log("  " + f);
  process.exit(0);
}

if (!TOKEN) {
  console.error("\nMissing GITHUB_TOKEN.");
  console.error('  $env:GITHUB_TOKEN = "github_pat_..."');
  console.error("Create one at https://github.com/settings/personal-access-tokens/new");
  console.error("  Repository access: only yxq1337/hexcolorpro");
  console.error("  Permissions: Contents = Read and write (nothing else needed)");
  console.error("  Expiration: 1 day — revoke it right after the push.");
  process.exit(2);
}

const API = "https://api.github.com";
const headers = {
  authorization: `Bearer ${TOKEN}`,
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28",
  "user-agent": "hexcolorpro-deploy",
};

async function api(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg = body && body.message ? body.message : String(text).slice(0, 300);
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${msg}`);
  }
  return body;
}

// Electron's node exits when the event loop drains, dropping in-flight requests.
// This timer keeps the process alive until the push is finished.
const keepAlive = setInterval(() => {}, 2000);
function finish(code) {
  clearInterval(keepAlive);
  process.exitCode = code;
}

try {
  const ref = await api(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
  const headSha = ref.object.sha;
  const headCommit = await api(`/repos/${REPO}/git/commits/${headSha}`);
  log(`head ${headSha.slice(0, 7)} on ${REPO}@${BRANCH}`);
  log(`uploading ${files.length} blobs on top of tree ${headCommit.tree.sha.slice(0, 7)}`);

  if (DRY) {
    log("\ndry run: token OK, nothing pushed");
    finish(0);
  }

  const entries = [];
  const LIMIT = 6;
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < files.length) {
      const path = files[cursor++];
      log("upload start: " + path);
      const content = readFileSync(join(ROOT, path)).toString("base64");
      const blob = await api(`/repos/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      entries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      log("upload ok: " + path + " " + blob.sha.slice(0,7));
      done++;
      if (done % 20 === 0) log(`  ${done}/${files.length}`);
    }
  }
  await Promise.all(Array.from({ length: LIMIT }, worker));
  log(`uploaded ${entries.length} blobs`);

  const tree = await api(`/repos/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }),
  });
  const commit = await api(`/repos/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: MESSAGE, tree: tree.sha, parents: [headSha] }),
  });
  const updated = await api(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  log(`\ntree    ${tree.sha.slice(0, 7)}`);
  log(`commit  ${commit.sha.slice(0, 7)}`);
  log(`ref     heads/${BRANCH} → ${updated.object.sha.slice(0, 7)}`);
  log(`\nPushed: https://github.com/${REPO}/commit/${commit.sha}`);
  log("Cloudflare Pages builds automatically if the project is connected to this repo.");
  finish(0);
} catch (e) {
  console.error("\nFAILED: " + e.message);
  if (/\b401\b/.test(e.message)) console.error("The token is invalid or expired.");
  if (/\b403\b/.test(e.message)) console.error("Token lacks Contents: Read and write, or repo outside scope.");
  if (/\b404\b/.test(e.message)) console.error("Repo/branch not found for this token — check REPO and BRANCH.");
  finish(1);
}
