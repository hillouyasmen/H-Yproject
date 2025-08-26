import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import api from "../api";
import styles from "../styles/Cart.module.css";

export default function Cart() {
  const { items, removeFromCart, total } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const nav = useNavigate();
  const [placing, setPlacing] = useState(false);

  const CURRENCY = "₪";

  const onCheckout = async () => {
    if (!user) return notify.error("Please login");
    if (isAdmin) return notify.error("Admins cannot place orders");
    if (items.length === 0) return notify.error("Your cart is empty");

    try {
      setPlacing(true);

      const orderItems = items
        .map((i) => ({
          product_id: i.product?.product_id ?? i.product_id ?? null,
          color: i.variation?.color,
          size: i.variation?.size,
          quantity: Number(i.qty || 1),
        }))
        .filter(
          (x) => x.product_id && x.color && x.size && Number(x.quantity) > 0
        );

      if (!orderItems.length) {
        notify.error("Cart items invalid");
        setPlacing(false);
        return;
      }

      const { data } = await api.post("/orders", {
        user_id: user.user_id,
        items: orderItems,
      });

      if (data?.order_id) {
        notify.success("Order created ✓");
        nav(`/checkout?oid=${data.order_id}`, { replace: false });
      } else {
        notify.error("Failed to create order");
        setPlacing(false);
      }
    } catch {
      notify.error("Failed to create order");
      setPlacing(false);
    }
  };

  const canCheckout = !!user && !isAdmin && items.length > 0 && !placing;

  // (اختياري) عتبة شحن مجاني تجميليّة
  const FREE_SHIP = 300;
  const freePct = Math.min(100, Math.round((total / FREE_SHIP) * 100));
  const freeLeft = Math.max(0, FREE_SHIP - total);

  return (
    <div className={styles.page}>
      {/* FX Layers */}
      <div className={styles.fxStars} aria-hidden />
      <div className={styles.fxBokeh} aria-hidden />

      {/* Header / Steps */}
      <header className={styles.header}>
        <h2 className={styles.title}>Your Cart</h2>
        <div className={styles.steps} aria-label="checkout steps">
          <div className={`${styles.step} ${styles.active}`}>Cart</div>
          <div className={styles.step}>Details</div>
          <div className={styles.step}>Payment</div>
        </div>
      </header>

      {/* Layout: Items + Summary */}
      <div className={styles.shell}>
        <section className={styles.listWrap}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>Your cart is empty</div>
              <p className={styles.emptyHint}>
                {user ? (
                  <>Add some lovely pieces from the store 💖</>
                ) : (
                  <>
                    Please{" "}
                    <Link to="/login" className={styles.link}>
                      login
                    </Link>{" "}
                    to start shopping.
                  </>
                )}
              </p>
              <Link to="/store" className={`${styles.btn} ${styles.ghost}`}>
                Explore store →
              </Link>
            </div>
          ) : (
            <div className={styles.list}>
              {items.map((i) => {
                const name = i.product?.product_name || "Product";
                const img =
                  i.product?.image_url ||
                  "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";
                const lineTotal = Number(
                  i.qty * Number(i.variation?.price || 0)
                );

                return (
                  <div
                    key={i.key}
                    className={`${styles.row} ${styles.luxBorderSoft}`}
                  >
                    <div className={styles.prod}>
                      <img className={styles.thumb} src={img} alt={name} />
                      <div className={styles.prodText}>
                        <div className={styles.name} title={name}>
                          {name}
                        </div>
                        <div className={styles.badges}>
                          <span className={styles.badge}>
                            {i.variation?.color} / {i.variation?.size}
                          </span>
                          <span className={`${styles.badge} ${styles.muted}`}>
                            x{i.qty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.price}>
                      {CURRENCY}
                      {lineTotal.toFixed(2)}
                    </div>

                    <button
                      className={styles.remove}
                      onClick={() => removeFromCart(i.key)}
                      title="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Summary */}
        <aside
          className={`${styles.summary} ${styles.glass} ${styles.luxBorder}`}
        >
          <div className={styles.summaryHead}>Order Summary</div>

          <div className={styles.rowLite}>
            <span>Subtotal</span>
            <span className={styles.strong}>
              {CURRENCY}
              {total.toFixed(2)}
            </span>
          </div>

          <div className={styles.freeShip}>
            <div className={styles.freeRow}>
              {freeLeft > 0 ? (
                <span>
                  Spend{" "}
                  <strong>
                    {CURRENCY}
                    {freeLeft.toFixed(0)}
                  </strong>{" "}
                  more for free shipping
                </span>
              ) : (
                <span>🎉 You’ve unlocked free shipping!</span>
              )}
              <span className={styles.freePct}>{freePct}%</span>
            </div>
            <div className={styles.track}>
              <div className={styles.bar} style={{ width: `${freePct}%` }} />
            </div>
          </div>

          <div className={styles.coupon}>
            <input
              type="text"
              placeholder="Have a coupon?"
              className={styles.couponInput}
              aria-label="coupon code"
            />
            <button
              className={`${styles.btn} ${styles.ghost}`}
              onClick={() => notify.info("Coupon feature coming soon")}
            >
              Apply
            </button>
          </div>

          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={onCheckout}
            disabled={!canCheckout}
          >
            {placing ? (
              <span className={styles.spinner} aria-hidden />
            ) : (
              "Checkout"
            )}
          </button>

          {!user && (
            <div className={styles.helper}>
              You need to{" "}
              <Link to="/login" className={styles.link}>
                login
              </Link>{" "}
              to checkout.
            </div>
          )}
          {isAdmin && (
            <div className={styles.helper}>Admins cannot place orders.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
