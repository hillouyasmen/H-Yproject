import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api";
import styles from "../styles/UserProfile.module.css";
import { Link } from "react-router-dom";
import { notify } from "../components/Notifications.jsx";

export default function UserProfile() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user orders
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await api.get("/orders", {
          params: { user_id: user.user_id },
        });
        const list = Array.isArray(data)
          ? data.filter((o) => o.user_id === user.user_id)
          : [];
        setOrders(list);
      } catch (e) {
        notify.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user)
    return <div className="card">Please login to see your profile.</div>;

  // Derived
  const ordersSorted = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.order_date) - new Date(a.order_date)
    );
  }, [orders]);

  const totalSpent = useMemo(
    () => orders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
    [orders]
  );
  const lastOrder = ordersSorted[0];

  // Membership tier (feel free to tweak thresholds)
  const tier = useMemo(() => {
    const t = totalSpent;
    if (t >= 1000)
      return { name: "Diamond", pct: Math.min(100, (t / 1500) * 100) };
    if (t >= 400) return { name: "Gold", pct: Math.min(100, (t / 1000) * 100) };
    return { name: "Rose", pct: Math.min(100, (t / 400) * 100) };
  }, [totalSpent]);

  // Order status → progress step
  const statusStep = (status = "pending") => {
    const map = { pending: 1, paid: 2, shipped: 3, delivered: 4 };
    return map[status] || 1;
  };
  const formatDate = (d) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <div className={styles.page}>
      {/* FX layers */}
      <div className={styles.aurora} aria-hidden />
      <div className={styles.grain} aria-hidden />

      {/* Header / Identity */}
      <section className={`${styles.headerCard} ${styles.luxBorder}`}>
        <div className={styles.userBlock}>
          <img
            className={styles.avatar}
            src="/images/avatars/hazem.jpg"
            alt={user.username}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1520975823756-3f4f2d09557f?q=80&w=600&auto=format&fit=crop";
            }}
          />
          <div>
            <div className={styles.nameRow}>
              <h2 className={styles.title}>{user.username}</h2>
              <span className={styles.roleBadge}>{user.role}</span>
              <span
                className={`${styles.tierBadge} ${styles[`tier${tier.name}`]}`}
              >
                {tier.name}
              </span>
            </div>
            <div className={styles.meta}>
              <span>{user.email}</span>
              {user.phone && <span> • {user.phone}</span>}
              {user.bodyshape_id ? (
                <span> • Bodyshape ID: {user.bodyshape_id}</span>
              ) : (
                <Link to="/bodyshape" className={styles.linkSoft}>
                  {" "}
                  • Set body shape
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={`${styles.stat} ${styles.glass}`}>
            <div className={styles.statLabel}>Orders</div>
            <div className={styles.statValue}>{orders.length}</div>
          </div>
          <div className={`${styles.stat} ${styles.glass}`}>
            <div className={styles.statLabel}>Total spent</div>
            <div className={styles.statValue}>${totalSpent.toFixed(2)}</div>
          </div>
          <div className={`${styles.stat} ${styles.glass}`}>
            <div className={styles.statLabel}>Last status</div>
            <div className={styles.statValue}>{lastOrder?.status || "—"}</div>
          </div>
        </div>
      </section>

      {/* Loyalty / Membership */}
      <section className={`${styles.loyaltyCard} ${styles.softShadow}`}>
        <div>
          <div className={styles.loyaltyTitle}>Membership Progress</div>
          <div className={styles.loyaltyMeta}>
            Spend more to unlock perks & gifts
          </div>
          <div className={styles.progressWrap} aria-label="membership progress">
            <div className={styles.progressTrack} />
            <div
              className={styles.progressBar}
              style={{ width: `${Math.max(6, Math.min(100, tier.pct))}%` }}
            />
          </div>
          <div className={styles.tierRow}>
            <span>Rose</span>
            <span>Gold</span>
            <span>Diamond</span>
          </div>
        </div>
        <div className={styles.quickActions}>
          <Link to="/store" className={`${styles.qAction} ${styles.luxBorder}`}>
            Shop new picks
          </Link>
          <Link
            to="/contact"
            className={`${styles.qAction} ${styles.luxBorder}`}
          >
            Contact support
          </Link>
          <Link
            to="/bodyshape"
            className={`${styles.qAction} ${styles.luxBorder}`}
          >
            Update body shape
          </Link>
        </div>
      </section>

      {/* Orders */}
      <section className="card">
        <div className={styles.sectionHead}>
          <h3 className="sectionTitle">My Orders</h3>
          {!loading && orders.length > 0 && (
            <div className={styles.hint}>{orders.length} orders found</div>
          )}
        </div>

        {loading ? (
          <div className={styles.skeletonWrap}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            No orders yet.{" "}
            <Link to="/store" className={styles.linkSoft}>
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className={styles.orderGrid}>
            {ordersSorted.map((o) => {
              const step = statusStep(o.status);
              const pct = (step / 4) * 100;
              return (
                <div
                  key={o.order_id}
                  className={`${styles.orderCard} ${styles.luxBorderSoft}`}
                >
                  <div className={styles.orderTop}>
                    <div className={styles.orderId}>Order #{o.order_id}</div>
                    <span
                      className={`${styles.status} ${
                        styles[o.status || "pending"]
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div className={styles.orderMeta}>
                    <div>
                      <div className={styles.metaLabel}>Date</div>
                      <div className={styles.metaValue}>
                        {formatDate(o.order_date)}
                      </div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>Items</div>
                      <div className={styles.metaValue}>
                        {o.items_count ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>Total</div>
                      <div className={styles.total}>
                        ${Number(o.total_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* progress */}
                  <div className={styles.orderProgress}>
                    <div className={styles.orderTrack} />
                    <div
                      className={styles.orderBar}
                      style={{ width: `${pct}%` }}
                      aria-label={`progress ${pct}%`}
                    />
                    <div className={styles.stepLabels}>
                      <span>Pending</span>
                      <span>Paid</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                  </div>

                  {o.note && <div className={styles.note}>“{o.note}”</div>}

                  <div className={styles.actions}>
                    <Link
                      className={`${styles.btn}`}
                      to={`/invoice/${o.order_id}`}
                    >
                      View invoice
                    </Link>
                    <a
                      className={styles.btn}
                      href={`/api/orders/${o.order_id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download / Print
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
