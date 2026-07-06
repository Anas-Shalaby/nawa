const { createServer } = require("http");
const { parse } = require("url");
const { createReadStream, existsSync, statSync } = require("fs");
const { join, extname, normalize } = require("path");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const publicDir = join(__dirname, "public");

const MIME_TYPES = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".js": "application/javascript",
  ".wav": "audio/wav",
};

function servePublicFile(pathname, res) {
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    return false;
  }

  if (!existsSync(filePath)) {
    return false;
  }

  const stats = statSync(filePath);
  if (!stats.isFile()) {
    return false;
  }

  const contentType = MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400, immutable",
  });
  createReadStream(filePath).pipe(res);
  return true;
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname || "/";

    if (pathname === "/") {
      res.writeHead(308, { Location: "/ar" });
      res.end();
      return;
    }

    if (servePublicFile(pathname, res)) {
      return;
    }

    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 6000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:" + (process.env.PORT || 6000));
  });
});
