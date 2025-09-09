// src/hooks/useAdminAlerts.js
import { useEffect, useRef } from "react";
import { notify } from "../components/Notifications.jsx";

function titleFor(ev) {
  switch (ev.type) {
    case "user.created":
      return "New user";
    case "order.created":
      return "New order";
    case "order.paid":
      return "Order paid";
    case "order.shipped":
      return "Order shipped";
    case "order.cancelled":
      return "Order cancelled";
    case "stock.low":
      return "Low stock";
    case "stock.delta":
      return "Stock updated";
    case "contact.created":
      return "New contact message";
    default:
      return ev.type || "Alert";
  }
}
function bodyFor(ev) {
  const p = ev?.payload || {};
  switch (ev.type) {
    case "user.created":
      return `${p.username || "user"} — ${p.email || ""}`.trim();
    case "order.created":
    case "order.paid":
      return `#${p.order_id} — $${Number(p.total_amount || 0).toFixed(2)}`;
    case "order.shipped":
    case "order.cancelled":
      return `#${p.order_id}`;
    case "stock.low":
      return `#${p.product_id} ${p.color}/${p.size} — qty ${p.quantity}`;
    case "stock.delta":
      return `#${p.product_id} ${p.color}/${p.size} → ${p.quantity} (Δ ${p.delta})`;
    case "contact.created":
      return `${p.subject || "Message"} — ${p.name || ""}`;
    default:
      return "";
  }
}

export default function useAdminAlerts({ enabled, events, playSound = true }) {
  const seen = useRef(new Set());
  const audio = useRef(null);

  useEffect(() => {
    if (!playSound) return;
    audio.current = new Audio("/sounds/notify.mp3"); // ضع الملف في public/sounds/notify.mp3
  }, [playSound]);

  useEffect(() => {
    if (!enabled) return;
    if ("Notification" in window && Notification.permission === "default") {
      try {
        Notification.requestPermission();
      } catch {}
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !Array.isArray(events)) return;

    for (const ev of [...events].reverse()) {
      if (!ev?.id || seen.current.has(ev.id)) continue;
      seen.current.add(ev.id);

      const t = titleFor(ev),
        b = bodyFor(ev);
      b ? notify.info(`${t} — ${b}`) : notify.info(t);

      try {
        if ("Notification" in window && Notification.permission === "granted") {
          const n = new Notification(t, {
            body: b,
            icon: "/icons/icon-192.png",
            tag: ev.id,
          });
          setTimeout(() => n.close(), 6000);
        }
      } catch {}

      if (playSound && audio.current) {
        audio.current.currentTime = 0;
        audio.current.play().catch(() => {});
      } else if (navigator.vibrate) {
        navigator.vibrate(120);
      }
    }
  }, [enabled, events, playSound]);
}
