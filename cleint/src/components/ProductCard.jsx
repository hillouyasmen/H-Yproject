// src/components/ProductCard.jsx
import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { notify } from "./Notifications.jsx";
import api from "../api";
import { normalizeImageUrl } from "../lib/img.js";
import styles from "../styles/ProductCard.module.css"; // استخدم CSS Module

// يحوّل أي قيمة سعر إلى رقم (يشيل رموز العملة والمسافات)
const parsePrice = (v) => {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.]/g, "")); // يشيل ₪ مثلاً
  return Number.isFinite(n) ? n : null;
};

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAdmin = user?.role === "admin";

  const [vars, setVars] = useState(null);
  const [loadingVars, setLoadingVars] = useState(false);
  const [sel, setSel] = useState({ color: "", size: "" });

  // صورة
  const img = normalizeImageUrl(product?.image_url);

  // ترتيب مقاسات ذكي
  const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
  const sizeKey = (s) => {
    const S = String(s).toUpperCase().trim();
    const idx = SIZE_ORDER.indexOf(S);
    if (idx !== -1) return idx;
    const num = parseFloat(S.replace(/[^\d.]/g, ""));
    return Number.isFinite(num) ? 100 + num : 999;
  };
  const sortSizes = (arr) =>
    [...new Set(arr)].sort((a, b) => sizeKey(a) - sizeKey(b));

  // أسعار أساسية محتملة على مستوى المنتج
  const basePrice =
    [product?.price, product?.base_price, product?.min_price]
      .map(parsePrice)
      .find((v) => v != null && v >= 0) ?? null;

  // تحميل الـ variations عند الحاجة
  const loadVars = async () => {
    if (vars) return vars;
    try {
      setLoadingVars(true);
      const { data } = await api.get(
        `/variations/product/${product.product_id}`
      );
      const arr = Array.isArray(data) ? data : [];
      setVars(arr);
      if (arr[0]) {
        const firstColor = arr[0].color;
        const firstSize =
          sortSizes(
            arr.filter((x) => x.color === firstColor).map((x) => x.size)
          )[0] || arr[0].size;
        setSel({ color: firstColor, size: firstSize });
      }
      return arr;
    } catch {
      notify.error("Failed to load options");
      return [];
    } finally {
      setLoadingVars(false);
    }
  };

  // مشتقات الستايت
  const allVars = vars ?? product?.variations ?? [];
  const colors = useMemo(
    () => [...new Set(allVars.map((v) => v.color))],
    [allVars]
  );
  const sizesFor = (color) =>
    sortSizes(allVars.filter((v) => v.color === color).map((v) => v.size));

  const selectedVar = () =>
    allVars.find((v) => v.color === sel.color && v.size === sel.size) || null;

  // أقل سعر من الـvariants (لو موجود)
  const minVarPrice = useMemo(() => {
    const numbers = allVars
      .map((v) => parsePrice(v?.price))
      .filter((n) => n != null);
    return numbers.length ? Math.min(...numbers) : null;
  }, [allVars]);

  // السعر المعروض: المختار ← الأساسي ← أقل variant
  const varPrice = parsePrice(selectedVar()?.price);
  const displayPrice = varPrice ?? basePrice ?? minVarPrice; // قد يكون null
  const isFrom = !varPrice && !basePrice && minVarPrice != null;

  // إضافة لعربة التسوق
  const onAdd = async () => {
    if (!user) return notify.error("Please login to add items");
    if (isAdmin) return notify.error("Admins cannot add to cart");

    let arr = allVars;
    if (!arr || arr.length === 0) arr = await loadVars();

    // لا يوجد variations → أضف بسعر المنتج/المعروض إن وُجد
    if (!arr || arr.length === 0) {
      if (displayPrice == null) return notify.error("No price available yet");
      const fakeVar = { color: "default", size: "std", price: displayPrice };
      addToCart(product, fakeVar, 1);
      return notify.success("Added to cart");
    }

    // يوجد variation واحد
    if (arr.length === 1) {
      const v = { ...arr[0] };
      v.price = parsePrice(v.price) ?? basePrice;
      if (v.price == null)
        return notify.error("No price available for this item");
      addToCart(product, v, 1);
      return notify.success("Added to cart");
    }

    // متعدد → تأكد من اختيار المستخدم
    const chosen =
      selectedVar() ||
      (await (async () => {
        await loadVars();
        return null;
      })());
    if (!chosen) return notify.info("Choose color & size first");

    const price = parsePrice(chosen.price) ?? basePrice;
    if (price == null)
      return notify.error("No price available for this option");
    addToCart(product, { ...chosen, price }, 1);
    notify.success("Added to cart");
  };

  return (
    <div className={styles.card}>
      {/* الصورة */}
      <div className={styles.mediaWrap}>
        <img
          className={styles.media}
          src={img}
          alt={product?.product_name || "Product"}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";
          }}
        />
        <div className={styles.mediaShine} />
      </div>

      {/* المحتوى */}
      <div className={styles.body}>
        <a className={styles.title} href="#">
          {product?.product_name || "Unnamed product"}
        </a>

        {/* السعر */}
        <div className={styles.priceRow}>
          {displayPrice != null ? (
            <span className={styles.priceNow}>
              {isFrom && (
                <span style={{ fontWeight: 700, opacity: 0.7, marginRight: 6 }}>
                  From
                </span>
              )}
              <span className={styles.currency}>₪</span>
              {displayPrice.toFixed(2)}
            </span>
          ) : (
            <span className={styles.priceNow} style={{ opacity: 0.65 }}>
              —
            </span>
          )}
        </div>

        {/* خيارات اللون */}
        {colors.length > 1 && (
          <div className={styles.variants}>
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.variant} ${
                  sel.color === c ? styles.active : ""
                }`}
                onClick={() => {
                  const firstSize = sizesFor(c)[0] || "";
                  setSel({ color: c, size: firstSize });
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* خيارات المقاس */}
        {sel.color && sizesFor(sel.color).length > 0 && (
          <div className={styles.variants}>
            {sizesFor(sel.color).map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.variant} ${
                  sel.size === s ? styles.active : ""
                }`}
                onClick={() => setSel((p) => ({ ...p, size: s }))}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* الزر */}
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={onAdd}
            disabled={isAdmin || loadingVars}
            title={
              !user
                ? "Please login to add items"
                : isAdmin
                ? "Admins cannot add to cart"
                : ""
            }
          >
            {loadingVars ? "Loading…" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
