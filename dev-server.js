/* =====================================================================
   dev-server.js — tiny local test server (no dependencies)
   Run:  node dev-server.js
   Open: http://localhost:8123/admin.html   (admin panel, demo mode)
         http://localhost:8123/?code=demo-… (guest invitation link)
   ===================================================================== */
const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT  = 8123;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".md": "text/plain",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
};

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/admin") p = "/admin.html";
  if (p === "/") p = "/index.html";
  const file = path.join(__dirname, path.normalize(p));
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  ✦ Wedding site running:\n
    guest invite (demo):  http://localhost:${PORT}/
    admin panel:          http://localhost:${PORT}/admin\n`);
});
