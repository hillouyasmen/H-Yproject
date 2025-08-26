// backend/routes/events.js
import express from "express";

const router = express.Router();

// نخزّن كل العملاء المفتوحين (SSE connections)
const clients = new Set();

/** دالة بثّ عامة يمكن استدعاؤها من أي Route */
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
    } catch {
      // قد يكون الاتصال أُغلق
    }
  }
}

/** GET /api/events — قناة SSE */
router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // تعليق ترحيبي
  res.write(`: connected ${new Date().toISOString()}\n\n`);

  clients.add(res);

  // ping للحفاظ على الاتصال
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
