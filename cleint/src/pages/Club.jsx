// src/pages/Club.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Club.module.css";
import { normalizeImageUrl } from "../lib/img.js";
import { useCart } from "../contexts/CartContext.jsx";

export default function Club() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null); // { user, membership, trial_used }
  const [shapes, setShapes] = useState([]);
  const [chosenShape, setChosenShape] = useState("");

  // products for the selected bodyshape
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  // simple local wishlist just for UI (no API)
  const [wishes, setWishes] = useState(() => new Set());
  const toggleWish = (id) =>
    setWishes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const currentPlan = info?.membership?.plan || null;
  const bodyshapeId = info?.user?.bodyshape_id || null;
  const trialUsed = !!info?.trial_used;

  const canChooseShape = useMemo(() => {
    if (!user) return false;
    return !info?.user?.bodyshape_id; // pick once
  }, [info, user]);

  const needsShape = canChooseShape && !chosenShape;

  // helpers
  const toNum = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // fetch membership + shapes
  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [me, bs] = await Promise.all([
          api.get("/club", { params: { user_id: user.user_id } }),
          api.get("/bodyshapes"),
        ]);
        setInfo(me.data || null);
        setShapes(bs.data || []);
        if (me.data?.user?.bodyshape_id)
          setChosenShape(String(me.data.user.bodyshape_id));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // fetch products by bodyshape
  const fetchProducts = useCallback(
    async (shapeIdToUse) => {
      if (!shapeIdToUse) return;
      try {
        setProdLoading(true);
        const { data } = await api.get("/products", {
          params: {
            bodyshape_id: shapeIdToUse,
            member: !!currentPlan,
            limit: 12,
          },
        });
        setProducts(Array.isArray(data) ? data : data?.items || []);
      } finally {
        setProdLoading(false);
      }
    },
    [currentPlan]
  );

  useEffect(() => {
    const shapeIdToUse = chosenShape || bodyshapeId;
    if (shapeIdToUse) fetchProducts(shapeIdToUse);
  }, [chosenShape, bodyshapeId, currentPlan, fetchProducts]);

  // subscribe / pay
  const subscribe = async (plan) => {
    if (!user) return notify.error("Please login first");
    if (canChooseShape && !chosenShape)
      return notify.error("Pick your bodyshape first");

    if (plan === "trial" && trialUsed) {
      return notify.error("You have already used the free trial");
    }

    if (plan === "trial") {
      try {
        await api.post("/club", {
          user_id: user.user_id,
          bodyshape_id: chosenShape || info?.user?.bodyshape_id,
          plan,
        });
        notify.success(`Welcome to ${plan} plan!`);
        const me = await api.get("/club", {
          params: { user_id: user.user_id },
        });
        setInfo(me.data);
      } catch {
        /* handled globally */
      }
      return;
    }

    const payload = {
      user_id: user.user_id,
      bodyshape_id: chosenShape || info?.user?.bodyshape_id,
      plan,
    };

    try {
      const { data } = await api.post("/payments/create-session", payload);

      if (data?.checkout_url) {
        if (canChooseShape && chosenShape) {
          try {
            await api.post("/club", payload);
          } catch {}
        }
        window.location.href = data.checkout_url;
        return;
      }

      const qs = new URLSearchParams({
        plan,
        uid: String(payload.user_id),
        ...(payload.bodyshape_id ? { bs: String(payload.bodyshape_id) } : {}),
      }).toString();
      navigate(`/checkout?${qs}`, { replace: false });
    } catch {
      const qs = new URLSearchParams({
        plan,
        uid: String(payload.user_id),
        ...(payload.bodyshape_id ? { bs: String(payload.bodyshape_id) } : {}),
      }).toString();
      navigate(`/checkout?${qs}`, { replace: false });
    }
  };

  const cancel = async () => {
    if (!user) return;
    await api.put("/club/cancel", { user_id: user.user_id });
    notify.success("Membership cancelled");
    const me = await api.get("/club", { params: { user_id: user.user_id } });
    setInfo(me.data);
  };

  const renderProductCard = (p) => {
    const id = p.id || p.product_id;
    const name = p.name || p.product_name || "Product";

    const basePrice = toNum(p.price ?? p.base_price ?? p.unit_price);
    const memberPrice = toNum(p.member_price);

    const showMember =
      !!currentPlan &&
      memberPrice !== null &&
      (basePrice === null || memberPrice < basePrice);

    const priceToShow = showMember ? memberPrice : basePrice;

    const FALLBACK_IMG = "/images/Club.png";

    const wished = wishes.has(id);

    return (
      <div key={id} className={styles.product}>
        <div className={styles.productImgWrap}>
          <img
            src={normalizeImageUrl(p.image_url || p.thumbnail) || FALLBACK_IMG}
            alt={name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
              e.currentTarget.onerror = null;
            }}
          />
          {currentPlan && <span className={styles.tag}>Club deal</span>}

          {/* wishlist heart */}
          <button
            type="button"
            className={styles.wishBtn}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            title={wished ? "Saved" : "Save"}
            onClick={() => toggleWish(id)}
          >
            {wished ? "♥" : "♡"}
          </button>
        </div>

        <div className={styles.productInfo}>
          <div className={styles.productName}>{name}</div>
          <div className={styles.productPrice}>
            {showMember && basePrice !== null && (
              <span className={styles.oldPrice}>${basePrice.toFixed(2)}</span>
            )}
            <span className={styles.finalPrice}>
              {priceToShow !== null ? `$${priceToShow.toFixed(2)}` : "—"}
            </span>
          </div>
        </div>

        <div className={styles.productActions}>
          <button
            className={styles.secondaryBtn}
            onClick={() => navigate(`/product/${id}`)}
          >
            View
          </button>

          <button
            className={styles.primaryBtn}
            onClick={async () => {
              if (!user) return notify.error("Please login first");
              try {
                // حاول تجيب أول فاريشن متاح
                const { data } = await api.get(`/variations/product/${id}`);
                const list = Array.isArray(data) ? data : [];
                const v = list[0];
                if (!v || !v.color || !v.size) {
                  notify.info("Choose color & size");
                  navigate(`/product/${id}`);
                  return;
                }
                // أضف للكرت عبر السياق (يحدث البادج فورًا)
                addToCart(
                  {
                    product_id: id,
                    product_name: name,
                    image_url: p.image_url || p.thumbnail,
                  },
                  { color: v.color, size: v.size, price: Number(v.price) },
                  1
                );
                notify.success("Added to cart");
              } catch {
                // لو فشل جلب الفاريشن → خليه يختار يدويًا
                navigate(`/product/${id}`);
              }
            }}
            disabled={priceToShow === null}
            title={priceToShow === null ? "Price not available" : ""}
          >
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.brand}>
            H&Y <span>Moda</span> Club
          </div>
          <h1 className={styles.h1}>Pretty perks for your shape</h1>
          <p className={styles.lead}>
            Join the sweetest membership for curated picks, early drops, and
            exclusive pink deals.
          </p>
          <div className={styles.ctaRow}>
            <button
              className={styles.primaryBtn}
              onClick={() =>
                document
                  .getElementById("plans")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Join now
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() =>
                document
                  .getElementById("recs")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See recommendations
            </button>
          </div>
        </div>
        <div className={styles.heroArt} />
      </section>

      {/* PREFERENCES + PLANS */}
      <div className="card" style={{ marginTop: 16 }} id="plans">
        {loading ? (
          "Loading…"
        ) : (
          <>
            <div className={styles.sectionHead}>
              <h2 className={styles.title}>Your Preference</h2>
              {currentPlan && (
                <span className={styles.badge}>Active: {currentPlan}</span>
              )}
            </div>

            {/* bodyshape picker (once) */}
            <div className={styles.shapeBlock}>
              <label className={styles.label}>Bodyshape</label>
              <select
                className={styles.select}
                value={chosenShape}
                onChange={(e) => setChosenShape(e.target.value)}
                disabled={!canChooseShape}
                title={
                  canChooseShape ? "" : "You already picked your bodyshape"
                }
              >
                <option value="">
                  {canChooseShape ? "Pick your bodyshape" : "Saved"}
                </option>
                {shapes.map((s) => (
                  <option key={s.bodyshape_id} value={s.bodyshape_id}>
                    {s.shape_name}
                  </option>
                ))}
              </select>
              {!canChooseShape && bodyshapeId && (
                <div className={styles.hint}>
                  Saved — you can’t change it again.
                </div>
              )}
            </div>

            {/* plans */}
            <div className={styles.planGrid}>
              <div className={`${styles.plan} ${styles.soft}`}>
                <div className={styles.planName}>7-Day Trial</div>
                <div className={styles.price}>$0</div>
                <ul className={styles.features}>
                  <li>Personalized picks</li>
                  <li>Club newsletter</li>
                  <li>Cancel anytime</li>
                </ul>
                <button
                  className={styles.primaryBtn}
                  onClick={() => subscribe("trial")}
                  disabled={!!currentPlan || trialUsed || needsShape}
                  title={needsShape ? "Pick your bodyshape first" : ""}
                >
                  {currentPlan
                    ? "Already joined"
                    : trialUsed
                    ? "Trial used"
                    : needsShape
                    ? "Pick bodyshape"
                    : "Start Free Trial"}
                </button>
              </div>

              <div className={`${styles.plan} ${styles.highlight}`}>
                <div className={styles.ribbon}>Most Loved</div>
                <div className={styles.planName}>Monthly</div>
                <div className={styles.price}>$14.99</div>
                <ul className={styles.features}>
                  <li>All trial benefits</li>
                  <li>Early access to drops</li>
                  <li>Exclusive pink offers</li>
                </ul>
                <button
                  className={styles.primaryBtn}
                  onClick={() => subscribe("monthly")}
                  disabled={!!currentPlan || needsShape}
                  title={needsShape ? "Pick your bodyshape first" : ""}
                >
                  {currentPlan
                    ? "Already joined"
                    : needsShape
                    ? "Pick bodyshape"
                    : "Join Monthly"}
                </button>
              </div>

              <div className={`${styles.plan} ${styles.soft}`}>
                <div className={styles.planName}>Yearly</div>
                <div className={styles.price}>$129</div>
                <ul className={styles.features}>
                  <li>Best value</li>
                  <li>VIP surprises</li>
                  <li>Gifts & bundles</li>
                </ul>
                <button
                  className={styles.primaryBtn}
                  onClick={() => subscribe("yearly")}
                  disabled={!!currentPlan || needsShape}
                  title={needsShape ? "Pick your bodyshape first" : ""}
                >
                  {currentPlan
                    ? "Already joined"
                    : needsShape
                    ? "Pick bodyshape"
                    : "Join Yearly"}
                </button>
              </div>
            </div>

            {currentPlan && (
              <div className={styles.actions}>
                <button className={styles.ghostBtn} onClick={cancel}>
                  Cancel membership
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* RECOMMENDED PRODUCTS */}
      <section className="card" style={{ marginTop: 24 }} id="recs">
        <div className={styles.sectionHead}>
          <h2 className={styles.title}>Recommended For You</h2>
          {(chosenShape || bodyshapeId) && (
            <span className={styles.hint}>
              Based on your bodyshape: #{chosenShape || bodyshapeId}
            </span>
          )}
        </div>

        {prodLoading ? (
          <div style={{ padding: 16 }}>Loading products…</div>
        ) : products.length ? (
          <div className={styles.productsGrid}>
            {products.map((p) => renderProductCard(p))}
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            No products found for this bodyshape yet.
          </div>
        )}
      </section>
    </div>
  );
}
