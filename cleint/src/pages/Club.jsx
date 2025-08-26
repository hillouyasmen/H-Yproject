// src/pages/Club.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Club.module.css";
import { normalizeImageUrl } from "../lib/img.js";

export default function Club() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null); // { user, membership, trial_used }
  const [shapes, setShapes] = useState([]);
  const [chosenShape, setChosenShape] = useState("");

  // منتجات بحسب الـ bodyshape
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  const currentPlan = info?.membership?.plan || null;
  const bodyshapeId = info?.user?.bodyshape_id || null;
  const trialUsed = !!info?.trial_used;

  const canChooseShape = useMemo(() => {
    if (!user) return false;
    return !info?.user?.bodyshape_id; // مسموح مرة وحدة
  }, [info, user]);

  // ========= Helpers =========
  const toNum = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // جلب بيانات العضوية + كل أشكال الجسم
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

  // دالة جلب المنتجات بحسب الـ bodyshape
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

  // حفظ/اشتراك + توجيه للدفع
  const subscribe = async (plan) => {
    if (!user) return notify.error("Please login first");
    if (canChooseShape && !chosenShape)
      return notify.error("Pick your bodyshape first");

    // منع تكرار الـ trial
    if (plan === "trial" && trialUsed) {
      return notify.error("You have already used the free trial");
    }

    // خطة التجربة المجانية: نحفظ مباشرة بدون دفع
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
        /* errors handled globally if any */
      }
      return;
    }

    // شهري/سنوي: محاولة إنشاء جلسة دفع، وإلا نفتح /checkout بالـ query
    const payload = {
      user_id: user.user_id,
      bodyshape_id: chosenShape || info?.user?.bodyshape_id,
      plan,
    };

    try {
      const { data } = await api.post("/payments/create-session", payload);

      if (data?.checkout_url) {
        // (اختياري) حفظ نية الاشتراك/الشكل قبل التحويل
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
    // أسماء و معرّفات آمنة
    const id = p.id || p.product_id;
    const name = p.name || p.product_name || "Product";

    // أسعار آمنة
    const basePrice = toNum(p.price ?? p.base_price ?? p.unit_price);
    const memberPrice = toNum(p.member_price);

    const showMember =
      !!currentPlan &&
      memberPrice !== null &&
      (basePrice === null || memberPrice < basePrice);

    const priceToShow = showMember ? memberPrice : basePrice;

    const FALLBACK_IMG = "/images/Club.png";

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
              try {
                await api.post("/cart/add", {
                  user_id: user?.user_id,
                  product_id: id,
                  quantity: 1,
                });
                notify.success("Added to cart");
              } catch {}
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
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.brand}>
            H&Y <span>Moda</span> Club
          </div>
        </div>
        <div className={styles.heroArt} />
      </section>

      <div className="card" style={{ marginTop: 16 }}>
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

            {/* اختيار البودي شيب مرة واحدة فقط */}
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

            {/* الباقات */}
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
                  disabled={!!currentPlan || trialUsed}
                >
                  {currentPlan
                    ? "Already joined"
                    : trialUsed
                    ? "Trial used"
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
                  disabled={!!currentPlan}
                >
                  {currentPlan ? "Already joined" : "Join Monthly"}
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
                  disabled={!!currentPlan}
                >
                  {currentPlan ? "Already joined" : "Join Yearly"}
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

      {/* منتجات مناسبة للشكل */}
      <section className="card" style={{ marginTop: 24 }}>
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
