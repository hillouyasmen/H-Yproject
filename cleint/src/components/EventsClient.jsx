// src/components/EventsClient.jsx
import { useEffect } from "react";
import { notify } from "./Notifications.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function EventsClient() {
  const { user } = useAuth();
  const isAdmin = !!user && user.role === "admin"; // إشعارات للأدمن فقط

  useEffect(() => {
    if (!isAdmin) return;

    const base = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
    const url = base.replace(/\/api\/?$/, "") + "/api/events";

    const es = new EventSource(url, { withCredentials: false });

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data); // {id, type, payload, ts}
        switch (msg.type) {
          case "contact.new": {
            const { name, subject } = msg.payload || {};
            notify.info(`New message: ${subject} — from ${name}`);
            break;
          }
          case "user.created": {
            notify.success(`New user joined: ${msg.payload?.username}`);
            break;
          }
          case "order.paid": {
            const { order_id, amount, currency } = msg.payload || {};
            const amt = Number(amount ?? 0).toFixed(2);
            notify.success(
              `Order #${order_id} paid (${currency || "USD"} ${amt})`
            );
            break;
          }
          default:
            // console.log("SSE:", msg);
            break;
        }
      } catch {}
    };

    es.onerror = () => {
      // المتصفح سيعيد المحاولة تلقائياً
    };

    return () => es.close();
  }, [isAdmin]);

  return null;
}
