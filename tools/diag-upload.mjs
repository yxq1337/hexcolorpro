// Minimal diagnostic: can this runtime POST blobs to the GitHub API?
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO ?? "yxq1337/hexcolorpro";
const API = "https://api.github.com";
console.log("token present:", Boolean(TOKEN));
console.log("fetch:", typeof fetch);

const body = JSON.stringify({ content: Buffer.from("diagnostic\n").toString("base64"), encoding: "base64" });
console.log("body bytes:", body.length);
const res = await fetch(`${API}/repos/${REPO}/git/blobs`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${TOKEN}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "user-agent": "diag",
  },
  body,
});
const text = await res.text();
console.log("status:", res.status);
console.log("response:", text.slice(0, 160));
