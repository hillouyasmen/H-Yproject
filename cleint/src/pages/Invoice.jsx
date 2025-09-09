// src/pages/Invoice.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Invoice.module.css";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export default function Invoice() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [sending, setSending] = useState(false);
  const [toEmail, setToEmail] = useState("");

  useEffect(() => {
    if (!user) {
      notify.error("Please login to view invoices");
      nav("/login");
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setData(data);
        document.title = `Invoice #${data.order.order_id} - H&Y Moda`;
      } catch {
        notify.error("Failed to load invoice");
      }
    })();
  }, [id, user, nav]);

  if (!data) return <div className="card">Loading invoice…</div>;

  const { order, items, summary } = data;

  const sendToEmail = async () => {
    try {
      setSending(true);
      const { data } = await api.post(
        `/orders/${order.order_id}/send-invoice`,
        {
          ...(toEmail ? { to: toEmail } : {}),
        }
      );
      if (data?.ok && data?.emailed) {
        notify.success("Invoice sent to your email");
      } else if (data?.ok && data?.emailed === false) {
        notify.info(
          data?.message === "mail_failed"
            ? "Email failed (SMTP). Open the invoice tab to save/print."
            : "Email service is disabled in development."
        );
      } else {
        notify.error(data?.message || "Failed to send invoice");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send invoice";
      notify.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.head}>
          <div>
            <div className={styles.brand}>H&Y Moda</div>
            <div className={styles.muted}>Invoice #{order.order_id}</div>
            <div className={styles.muted}>
              {new Date(order.order_date).toLocaleString()}
            </div>
          </div>
          <div className={styles.billTo}>
            <div>
              <b>Bill To</b>
            </div>
            <div>{order.username}</div>
            {order.email && <div className={styles.muted}>{order.email}</div>}
            {order.address && (
              <div className={styles.muted}>{order.address}</div>
            )}
          </div>
        </div>

        <div className={styles.rowBetween}>
          <h2 className={styles.title}>Payment Invoice</h2>
          <span
            className={`${styles.badge} ${styles[order.status || "pending"]}`}
          >
            {order.status}
          </span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Color</th>
              <th>Size</th>
              <th className={styles.right}>Qty</th>
              <th className={styles.right}>Unit</th>
              <th className={styles.right}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, idx) => (
              <tr key={idx}>
                <td>{r.product_name}</td>
                <td>{r.color}</td>
                <td>{r.size}</td>
                <td className={styles.right}>{r.quantity}</td>
                <td className={styles.right}>
                  ${Number(r.unit_price || 0).toFixed(2)}
                </td>
                <td className={styles.right}>
                  ${Number(r.line_total || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totalsWrap}>
          <table className={styles.totals}>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td className={styles.right}>
                  ${Number(summary?.subtotal || 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Shipping</td>
                <td className={styles.right}>
                  ${Number(summary?.shipping || 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Tax</td>
                <td className={styles.right}>
                  ${Number(summary?.tax || 0).toFixed(2)}
                </td>
              </tr>
              <tr className={styles.grand}>
                <th>Total</th>
                <th className={styles.right}>
                  ${Number(summary?.grand_total || 0).toFixed(2)}
                </th>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <button className="btn" onClick={() => window.print()}>
            Print
          </button>
          <a
            className="btn"
            href={`${API_ORIGIN}/api/orders/${order.order_id}/invoice`}
            target="_blank"
            rel="noreferrer"
          >
            Open in new tab
          </a>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="input"
              style={{ minWidth: 260 }}
              placeholder={
                order.email ? `Send to (${order.email})` : "Email to..."
              }
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
            />
            <button className="btn" onClick={sendToEmail} disabled={sending}>
              {sending ? "Sending…" : "Email me this invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
