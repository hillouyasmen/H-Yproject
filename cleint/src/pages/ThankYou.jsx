import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../styles/ThankYou.module.css";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export default function ThankYou() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const oid = sp.get("oid"); // order id (إن وُجد)
  const plan = sp.get("plan"); // خطة الاشتراك (إن وُجدت)
  const uid = sp.get("uid"); // المستخدِم (اختياري)

  const isOrder = !!oid;

  const title = useMemo(
    () => (isOrder ? "Payment successful" : "Welcome aboard!"),
    [isOrder]
  );
  const subtitle = useMemo(() => {
    if (isOrder)
      return "התשלום בוצע בהצלחה!   ,Your payment has been confirmed.";
    if (plan) return `Your ${plan} plan is now active.`;
    return "Everything is ready 🎉";
  }, [isOrder, plan]);

  const openInvoice = () => {
    if (oid) window.open(`${API_ORIGIN}/api/orders/${oid}/invoice`, "_blank");
  };

  const confettiColors = [
    "#d63384",
    "#ff7ab8",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
  ];

  return (
    <div className={styles.page}>
      {/* Confetti (خلفية خفيفة) */}
      <div className={styles.confetti} aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 1.5;
          const duration = 3 + Math.random() * 2;
          const size = 6 + Math.random() * 8;
          const rotate = Math.random() * 360;
          const bg = confettiColors[i % confettiColors.length];
          return (
            <span
              key={i}
              className={styles.piece}
              style={{
                left: `${left}%`,
                width: size,
                height: size * 1.4,
                background: bg,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                transform: `rotate(${rotate}deg)`,
              }}
            />
          );
        })}
      </div>

      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            width="32"
            height="32"
            aria-hidden
          >
            <path
              d="M20 7L9 18l-5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>

        <div className={styles.meta}>
          {isOrder && <span className={styles.badge}>Order #{oid}</span>}
          {plan && <span className={styles.badge}>Plan: {plan}</span>}
          {uid && <span className={styles.badge}>User: {uid}</span>}
        </div>

        <div className={styles.ctaRow}>
          {isOrder ? (
            <>
              <button className={styles.btnPrimary} onClick={openInvoice}>
                View invoice
              </button>
              <button className={styles.btnGhost} onClick={() => nav("/")}>
                Continue shopping
              </button>
              <button className={styles.btnLink} onClick={() => window.print()}>
                Print
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.btnPrimary}
                onClick={() => nav("/club")}
              >
                Go to Club
              </button>
              <button className={styles.btnGhost} onClick={() => nav("/")}>
                Home
              </button>
              <button className={styles.btnLink} onClick={() => window.print()}>
                Print
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
