// src/components/NotificationsBell.jsx
import { useState } from "react";
import { useNotif } from "../contexts/NotifCenter.jsx";
import styles from "../styles/NotificationsBell.module.css";

export default function NotificationsBell() {
  const { list, unread, markAllRead } = useNotif();
  const [open, setOpen] = useState(false);

  const fmt = (ts) => new Date(ts || Date.now()).toLocaleString();

  return (
    <div className={styles.wrap}>
      <button
        className={styles.bell}
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className={styles.badge}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div className={styles.pop}>
          <div className={styles.head}>
            <div className={styles.title}>Notifications</div>
            <button className={styles.link} onClick={markAllRead}>
              Mark all read
            </button>
          </div>

          <div className={styles.list}>
            {list.length === 0 ? (
              <div className={styles.empty}>No notifications yet.</div>
            ) : (
              list.map((n) => (
                <div key={n.id} className={styles.item}>
                  <div className={styles.itemTitle}>{n.title || n.type}</div>
                  {n.text ? (
                    <div className={styles.itemText}>{n.text}</div>
                  ) : null}
                  <div className={styles.itemTime}>{fmt(n.ts)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
