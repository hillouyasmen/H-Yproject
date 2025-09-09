// src/components/AdminBell.jsx
import { useMemo, useState } from "react";
import styles from "../styles/AdminBell.module.css";

export default function AdminBell({ events = [], connected = false }) {
  const [open, setOpen] = useState(false);

  const important = useMemo(() => {
    const ok = new Set([
      "user.created",
      "order.created",
      "order.paid",
      "stock.low",
      "contact.created",
    ]);
    return (events || []).filter((e) => ok.has(e?.type));
  }, [events]);

  const unread = important.length;
  const last10 = important.slice(0, 10);

  const label = (e) => {
    const p = e.payload || {};
    switch (e.type) {
      case "user.created":
        return `New user: ${p.username || "user"} (${p.email || "-"})`;
      case "order.created":
        return `New order #${p.order_id} — $${Number(
          p.total_amount || 0
        ).toFixed(2)}`;
      case "order.paid":
        return `Order paid #${p.order_id}`;
      case "stock.low":
        return `Low stock #${p.product_id} ${p.color}/${p.size} (${p.quantity})`;
      case "contact.created":
        return `Contact: ${p.subject || "Message"}`;
      default:
        return e.type;
    }
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.dot} data-ok={connected ? "1" : "0"} />
        <span className={styles.icon}>🔔</span>
        {unread > 0 && <span className={styles.badge}>{unread}</span>}
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel} role="dialog" aria-modal="true">
            <div className={styles.head}>
              <div className={styles.title}>Notifications</div>
              <button className={styles.close} onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            <ul className={styles.list}>
              {last10.map((e) => (
                <li key={e.id} className={styles.item}>
                  <div className={styles.type} data-type={e.type} />
                  <div className={styles.text}>
                    <div className={styles.main}>{label(e)}</div>
                    <div className={styles.time}>
                      {new Date(e.ts || Date.now()).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
              {last10.length === 0 && (
                <li className={styles.empty}>No notifications yet.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
