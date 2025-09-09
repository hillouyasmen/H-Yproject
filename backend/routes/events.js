// backend/routes/events.js
import express from "express";

const router = express.Router();

const clients = new Set();

export function emitEvent(type, payload = {}) {
  const data = JSON.stringify({
    id: Date.now() + Math.random(),
    type,
    payload,
    ts: Date.now(),
  });
  for (const res of clients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {}
  }
}

/** GET /api/events — SSE */
router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  res.write(`: connected ${new Date().toISOString()}\n\n`);

  clients.add(res);

  const ping = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      // تجاهل
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    clients.delete(res);
    try {
      res.end();
    } catch {}
  });
});

export default router;
