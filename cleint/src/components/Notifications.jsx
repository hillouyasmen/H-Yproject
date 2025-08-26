import { useEffect, useState } from "react";
import styles from "../styles/Notifications.module.css";

/* ─────────────  Tiny event bus  ───────────── */
let listeners = [];
const emit = (toast) => listeners.forEach((l) => l(toast));
const make = (type, msg, duration) => ({
  id: Date.now() + Math.random(),
  type,
  msg,
  ts: Date.now(),
  duration: typeof duration === "number" ? duration : 3000,
});

/* نفس الـAPI مع مدة اختيارية */
export const notify = {
  success: (msg, ms) => emit(make("success", msg, ms)),
  error: (msg, ms) => emit(make("error", msg, ms)),
  info: (msg, ms) => emit(make("info", msg, ms)),
  warn: (msg, ms) => emit(make("warn", msg, ms)),
};

const TITLE = {
  success: "SUCCESS",
  error: "ERROR",
  info: "INFO",
  warn: "WARNING",
};
const PALETTE = {
  success: ["#2bd37a", "#7df3b4"],
  info: ["#3aa5ff", "#84c7ff"],
  warn: ["#ff7b39", "#ffd166"],
  error: ["#ff4d5e", "#ff8ab0"],
};

function Icon({ type }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  };
  if (type === "success")
    return (
      <svg {...props}>
        <path d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2zm-1 14l-4-4 1.41-1.41L11 12.17l5.59-5.58L18 8z" />
      </svg>
    );
  if (type === "error")
    return (
      <svg {...props}>
        <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2zm0-8h-2v6h2z" />
      </svg>
    );
  if (type === "warn")
    return (
      <svg {...props}>
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V9h2v5z" />
      </svg>
    );
  return (
    <svg {...props}>
      <path d="M11 7h2v6h-2zm0 8h2v2h-2z" />
      <path d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2z" />
    </svg>
  );
}

/* ─────────────  Host component  ───────────── */
export default function NotificationsHost() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const sub = (t) => {
      setList((prev) => [t, ...prev]); // الأحدث أولاً
      if (t.duration > 0) {
        setTimeout(() => {
          setList((prev) => prev.filter((x) => x.id !== t.id));
        }, t.duration);
      }
    };
    listeners.push(sub);
    return () => {
      listeners = listeners.filter((l) => l !== sub);
    };
  }, []);

  return (
    <div className={styles.wrap} aria-live="polite" aria-atomic="true">
      {list.map((t) => {
        const [a, b] = PALETTE[t.type] || PALETTE.info;
        const cssVars = {
          ["--t1"]: a,
          ["--t2"]: b,
          ["--life"]: `${t.duration}ms`,
        };
        const autoClass = t.duration > 0 ? styles.auto : "";
        // دمج الحالة (success/info/warn/error) لفليكِر إلخ
        const stateClass = styles[t.type] || "";
        return (
          <div
            key={t.id}
            className={`${styles.toast} ${stateClass} ${autoClass}`}
            style={cssVars}
            role="status"
          >
            <div className={styles.icon}>
              <Icon type={t.type} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>{TITLE[t.type]}</div>
              <div className={styles.msg}>{t.msg}</div>
            </div>
            <button
              onClick={() =>
                setList((prev) => prev.filter((x) => x.id !== t.id))
              }
              className={styles.close}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
