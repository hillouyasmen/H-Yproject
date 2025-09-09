// src/components/EventsClient.jsx
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNotif } from "../contexts/NotifCenter.jsx";
import useEvents from "../hooks/useEvents.js";
import { notify } from "./Notifications.jsx";

export default function EventsClient() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { add } = useNotif();

  // اشترك فقط إذا المستخدم أدمن
  const { last, connected } = useEvents({
    enabled: !!isAdmin,
    include: [
      "user.created",
      "order.created",
      "order.paid",
      "stock.low",
      "stock.delta",
      "contact.new",
      "contact.created",
    ],
    toast: false, // التوست من هون
  });

  // Map الحدث -> إشعار + Toast
  useEffect(() => {
    if (!isAdmin || !last) return;
    const e = last;

    const push = (title, text) => {
      add({ id: e.id, type: e.type, title, text, ts: e.ts });
    };

    if (e.type === "user.created") {
      const u = e.payload || {};
      push("New user", `${u.username || "user"} (${u.email || ""})`);
      notify.success(`New user: ${u.username || "user"}`);
    } else if (e.type === "order.created") {
      const p = e.payload || {};
      push("New order", `#${p.order_id} • total ${p.total_amount ?? ""}`);
      notify.success(`New order #${p.order_id}`);
    } else if (e.type === "order.paid") {
      const p = e.payload || {};
      push("Order paid", `#${p.order_id}`);
      notify.success(`Order #${p.order_id} paid`);
    } else if (e.type === "stock.low") {
      const p = e.payload || {};
      push(
        "Low stock",
        `#${p.product_id} ${p.color}/${p.size} (${p.quantity})`
      );
      notify.error(
        `Low stock: #${p.product_id} ${p.color}/${p.size} (${p.quantity})`
      );
    } else if (e.type === "stock.delta") {
      const p = e.payload || {};
      const dir = Number(p.delta) > 0 ? "increased" : "decreased";
      push(
        "Stock " + dir,
        `#${p.product_id} ${p.color}/${p.size} → ${p.quantity}`
      );
      notify.info(
        `Stock ${dir}: #${p.product_id} ${p.color}/${p.size} → ${p.quantity}`
      );
    } else if (e.type === "contact.new" || e.type === "contact.created") {
      const p = e.payload || {};
      push("New contact", p.subject || "Message");
      notify.success(`New contact: ${p.subject || "Message"}`);
    }
  }, [isAdmin, last, add]);

  // لوج مفيد
  useEffect(() => {
    if (!isAdmin) return;
    console.debug(`[SSE] ${connected ? "connected" : "disconnected"}`);
  }, [isAdmin, connected]);

  return null;
}
