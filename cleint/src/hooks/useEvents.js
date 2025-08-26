// src/hooks/useEvents.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notify } from "../components/Notifications.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

/**
 * useEvents
 * الاشتراك في قناة SSE (/api/events) واستلام أحداث حية.
 *
 * @param {object|boolean} options
 *  - enabled  : boolean (افتراضي true) لتفعيل/تعطيل الاشتراك
 *  - max      : number  (افتراضي 100) أقصى عدد للأحداث المُخزّنة
 *  - toast    : boolean (افتراضي true) إظهار توستات لبعض الأنواع
 *  - include  : string[] أو null (افتراضي null) أنواع الأحداث المسموح بها
 *
 * استخدام سريع:
 *   const { events, connected } = useEvents({ enabled: isAdmin });
 */
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
  const backoffRef = useRef(1000); // ms -> يتضاعف حتى 15s

  // حضّر URL القناة، ولو عندك توكن مستقبلاً يضاف كـ query
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

  // إضافة الحدث للستيت مع dedupe وحد أقصى
  const push = useCallback(
    (e) => {
      setEvents((prev) => {
        if (!e?.id) return prev; // نتوقع id من السيرفر داخل JSON
        if (prev.some((x) => x.id === e.id)) return prev;
        const next = [e, ...prev];
        if (next.length > max) next.length = max;
        return next;
      });

      if (!toast) return;
      // توستات أنيقة لبعض الأنواع (عدّل اللي تريده)
      if (e.type === "contact.created") {
        notify.success(`New contact: ${e?.payload?.subject || "Message"}`);
      } else if (e.type === "order.paid") {
        notify.success(`Order #${e?.payload?.order_id} paid`);
      } else if (e.type === "user.created") {
        notify.success(`New user: ${e?.payload?.username || "user"}`);
      }
    },
    [max, toast]
  );

  const connect = useCallback(() => {
    if (srcRef.current) return; // already connected/connecting

    const src = new EventSource(url, { withCredentials: false });
    srcRef.current = src;

    src.onopen = () => {
      setConnected(true);
      backoffRef.current = 1000; // reset backoff
    };

    // كل رسالة data من emitEvent
    src.onmessage = (ev) => {
      if (!ev?.data) return;
      try {
        const parsed = JSON.parse(ev.data);
        if (shouldKeep(parsed)) push(parsed);
      } catch {
        // تجاهل JSON معطوب
      }
    };

    // في بعض البيئات EventSource يعيد الاتصال تلقائيًا،
    // لكن نضيف إعادة إنشاء يدوية مع backoff كتحوّط.
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

  // ابدأ/أوقف الاشتراك
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

  // أدوات صغيرة
  const clear = useCallback(() => setEvents([]), []);
  const stop = useCallback(() => {
    try {
      srcRef.current?.close();
    } catch {}
    srcRef.current = null;
    setConnected(false);
  }, []);
  const start = useCallback(() => {
    if (!enabled) return;
    connect();
  }, [connect, enabled]);

  const last = events[0] || null;
  const count = events.length;

  return { events, last, count, connected, clear, stop, start };
}
