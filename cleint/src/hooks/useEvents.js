// src/hooks/useEvents.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notify } from "../components/Notifications.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function useEvents(options = {}) {
  const {
    enabled = true,
    max = 100,
    toast = true,
    include = null,
  } = typeof options === "boolean" ? { enabled: options } : options;

  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  const srcRef = useRef(null);
  const retryRef = useRef(null);
  const backoffRef = useRef(1000);

  const url = useMemo(() => {
    const u = new URL(`${API_BASE}/events`);
    try {
      const saved = JSON.parse(localStorage.getItem("auth") || "null");
      if (saved?.token) u.searchParams.set("token", saved.token);
    } catch {}
    return u.toString();
  }, []);

  const shouldKeep = useCallback(
    (ev) => {
      if (!ev || !ev.type) return false;
      if (include && Array.isArray(include) && !include.includes(ev.type)) {
        return false;
      }
      return true;
    },
    [include]
  );

  const push = useCallback(
    (e) => {
      setEvents((prev) => {
        if (!e?.id) return prev;
        if (prev.some((x) => x.id === e.id)) return prev;
        const next = [e, ...prev];
        if (next.length > max) next.length = max;
        return next;
      });

      if (!toast) return;

      if (e.type === "user.created") {
        notify.success(`New user: ${e?.payload?.username || "user"}`);
      } else if (e.type === "order.created") {
        notify.success(`New order #${e?.payload?.order_id}`);
      } else if (e.type === "order.paid") {
        notify.success(`Order #${e?.payload?.order_id} paid`);
      } else if (e.type === "stock.low") {
        const p = e.payload || {};
        notify.error(
          `Low stock: #${p.product_id} ${p.color}/${p.size} (${p.quantity})`
        );
      } else if (e.type === "stock.delta") {
        const p = e.payload || {};
        const dir = Number(p.delta) > 0 ? "increased" : "decreased";
        notify.info(
          `Stock ${dir}: #${p.product_id} ${p.color}/${p.size} → ${p.quantity}`
        );
      } else if (e.type === "contact.new" || e.type === "contact.created") {
        notify.success(`New contact: ${e?.payload?.subject || "Message"}`);
      }
    },
    [max, toast]
  );

  const connect = useCallback(() => {
    if (srcRef.current) return;
    const src = new EventSource(url, { withCredentials: false });
    srcRef.current = src;

    src.onopen = () => {
      setConnected(true);
      backoffRef.current = 1000;
    };
    src.onmessage = (ev) => {
      if (!ev?.data) return;
      try {
        const parsed = JSON.parse(ev.data);
        if (shouldKeep(parsed)) push(parsed);
      } catch {}
    };
    src.onerror = () => {
      setConnected(false);
      try {
        src.close();
      } catch {}
      srcRef.current = null;
      clearTimeout(retryRef.current);
      const wait = Math.min(backoffRef.current, 15000);
      retryRef.current = setTimeout(connect, wait);
      backoffRef.current *= 2;
    };
  }, [push, shouldKeep, url]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      setConnected(false);
      try {
        srcRef.current?.close();
      } catch {}
      srcRef.current = null;
      clearTimeout(retryRef.current);
    };
  }, [enabled, connect]);

  return {
    events,
    last: events[0] || null,
    count: events.length,
    connected,
    clear: () => setEvents([]),
  };
}
