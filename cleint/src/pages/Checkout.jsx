// src/pages/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Checkout.module.css";

function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

const PLAN_PRICE = { trial: 0, monthly: 14.99, yearly: 129 };

export default function Checkout() {
  const nav = useNavigate();
  const { search, state } = useLocation();
  const qs = new URLSearchParams(search);

  // ممكن يوصل من query أو من state
  const payment_id = qs.get("pid") ?? state?.payment_id ?? null;
  const plan = qs.get("plan") ?? state?.plan ?? null;

  const user_id = toNumOrNull(qs.get("uid") ?? state?.user_id);
  const bodyshape_id = toNumOrNull(qs.get("bs") ?? state?.bodyshape_id);

  // دفع طلب
  const order_id = toNumOrNull(qs.get("oid") ?? state?.order_id);
  const isOrder = !!order_id;

  const [busy, setBusy] = useState(false);

  // بطاقة
  const [holder, setHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // بيانات الطلب
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (isOrder) {
      api.get(`/orders/${order_id}`).then(({ data }) => {
        setOrder(data.order);
        setItems(data.items || []);
        setSummary(data.summary || null);
      });
    }
  }, [isOrder, order_id]);

  const totalToPay = useMemo(() => {
    if (isOrder) return Number(summary?.grand_total || 0);
    if (!plan) return 0;
    return PLAN_PRICE[plan] ?? 0;
  }, [isOrder, summary, plan]);

  const btnText = useMemo(() => {
    const amount = `$${totalToPay.toFixed(2)}`;
    if (isOrder) return `Pay ${amount}`;
    if (plan) return `Pay ${amount} • ${plan}`;
    return "Pay";
  }, [isOrder, totalToPay, plan]);

  const confirm = async () => {
    // لازم plan أو order_id
    if (!plan && !isOrder) {
      notify.error("Missing plan or order id");
      return;
    }
    // user_id مطلوب فقط للاشتراك (مش الطلب)
    if (!user_id && !isOrder) {
      notify.error("Missing user id");
      return;
    }
    if (!cardNumber || !expiry || !cvv) {
      notify.error("Fill all card fields");
      return;
    }

    try {
      setBusy(true);

      const pid = payment_id || `mock-${Date.now()}`;

      try {
        await api.post("/payments/complete", {
          payment_id: pid,
          success: true,
          ...(isOrder ? { order_id } : {}),
        });
      } catch {
        // نتجاوز لأغراض الـ mock
      }

      // اشتراك Club
      if (plan) {
        await api.post("/club", {
          user_id,
          bodyshape_id: bodyshape_id ?? undefined,
          plan,
        });
        notify.success(`Welcome to ${plan} plan!`);
        nav("/club", { replace: true });
        return;
      }

      // دفع طلب
      if (isOrder) {
        notify.success("Payment completed");
        const origin =
          import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
        window.open(`${origin}/api/orders/${order_id}/invoice`, "_blank");
        nav("/", { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.wrap}>
          <section className={styles.left}>
            <h1 className={styles.title}>Checkout</h1>
            <div className={styles.sub}>
              {isOrder ? (
                <>Pay order #{order_id}</>
              ) : (
                <>
                  Plan: <b>{plan ?? "—"}</b> • User: <b>{user_id ?? "—"}</b>{" "}
                  {bodyshape_id != null && (
                    <>
                      • Bodyshape: <b>{bodyshape_id}</b>
                    </>
                  )}
                </>
              )}
            </div>

            {!payment_id && (
              <div className={styles.testBanner}>
                Test mode — no gateway session (mock payment)
              </div>
            )}

            {/* معاينة الكريدت كارد */}
            <div className={styles.cardPreview}>
              <div className={styles.cardBrand}>H&Y Moda</div>
              <div className={styles.cardNumberPreview}>
                {(cardNumber || "•••• •••• •••• ••••")
                  .replace(/\D/g, "")
                  .replace(/(.{4})/g, "$1 ")
                  .trim()
                  .slice(0, 19)}
              </div>
              <div className={styles.cardFoot}>
                <span>{holder || "CARD HOLDER"}</span>
                <span>{expiry || "MM/YY"}</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirm();
              }}
              className={styles.cardForm}
            >
              <label className={styles.label}>Card holder</label>
              <input
                className={styles.input}
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                placeholder="Full name"
              />

              <label className={styles.label}>Card number</label>
              <input
                className={styles.input}
                inputMode="numeric"
                maxLength={19}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(
                    e.target.value
                      .replace(/\D/g, "")
                      .replace(/(.{4})/g, "$1 ")
                      .trim()
                      .slice(0, 19)
                  )
                }
              />

              <div className={styles.row}>
                <div className={styles.col}>
                  <label className={styles.label}>Expiry</label>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) =>
                      setExpiry(
                        e.target.value
                          .replace(/\D/g, "")
                          .replace(/(\d{2})(\d)/, "$1/$2")
                          .slice(0, 5)
                      )
                    }
                  />
                </div>
                <div className={styles.col}>
                  <label className={styles.label}>CVV</label>
                  <input
                    className={styles.input}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                  />
                </div>
              </div>

              <button className={styles.payBtn} disabled={busy} type="submit">
                {btnText}
              </button>
              <div className={styles.note}>
                * Mock credit card form — connect Stripe/PayPal in production.
              </div>
            </form>
          </section>

          <aside className={styles.right}>
            <h3 className={styles.sectionHead}>Summary</h3>

            {isOrder ? (
              <>
                <div className={styles.items}>
                  {items.map((it, i) => (
                    <div key={i} className={styles.itemRow}>
                      <div>
                        <div className={styles.itemName}>{it.product_name}</div>
                        <div className={styles.badge}>
                          {it.color} • {it.size}
                        </div>
                      </div>
                      <div className={styles.qty}>x{it.quantity}</div>
                      <div className={styles.line}>
                        ${Number(it.line_total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className={styles.qty}>Loading items…</div>
                  )}
                </div>

                <div className={styles.sumRow}>
                  <span>Subtotal</span>
                  <b>${Number(summary?.subtotal || 0).toFixed(2)}</b>
                </div>
                <div className={styles.sumRow}>
                  <span>Shipping</span>
                  <b>${Number(summary?.shipping || 0).toFixed(2)}</b>
                </div>
                <div className={styles.sumRow}>
                  <span>Tax</span>
                  <b>${Number(summary?.tax || 0).toFixed(2)}</b>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <b>${Number(summary?.grand_total || 0).toFixed(2)}</b>
                </div>
              </>
            ) : (
              <>
                <div className={styles.items}>
                  <div className={styles.itemRow}>
                    <div className={styles.itemName}>
                      {plan ? plan.toUpperCase() : "—"}
                    </div>
                    <div />
                    <div className={styles.line}>${totalToPay.toFixed(2)}</div>
                  </div>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <b>${totalToPay.toFixed(2)}</b>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
