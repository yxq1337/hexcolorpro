// Diagnostic 2: parallel blob uploads with an explicit keep-alive timer.
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO ?? "yxq1337/hexcolorpro";
const API = "https://api.github.com";

const keepAlive = setInterval(() => {}, 2000);
const done = [];

async function up(i) {
  const body = JSON.stringify({ content: Buffer.from(`diag ${i}\n`).toString("base64"), encoding: "base64" });
  const res = await fetch(`${API}/repos/${REPO}/git/blobs`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      "user-agent": "diag2",
    },
    body,
  });
  const j = await res.json();
  done.push([i, res.status, (j.sha || j.message || "").slice(0, 20)]);
  console.log("done", i, res.status);
}

console.log("start");
await Promise.all([0, 1, 2, 3, 4].map(up));
console.log("all:", JSON.stringify(done));
clearInterval(keepAlive);
