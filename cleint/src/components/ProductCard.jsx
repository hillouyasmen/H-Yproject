import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { notify } from "./Notifications.jsx";
import api from "../api";
import { normalizeImageUrl } from "../lib/img.js";
import styles from "../styles/ProductCard.module.css";

const parsePrice = (v) => {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

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

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAdmin = user?.role === "admin";

  const [vars, setVars] = useState(product?.variations || null);
  const [loadingVars, setLoadingVars] = useState(false);
  const [sel, setSel] = useState({ color: "", size: "" });

  const img =
    normalizeImageUrl(product?.image_url) ||
    "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";

  const basePrice =
    [product?.price, product?.base_price, product?.min_price]
      .map(parsePrice)
      .find((v) => v != null && v >= 0) ?? null;

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

  const allVars = vars ?? [];
  const colors = useMemo(
    () => [...new Set(allVars.map((v) => v.color))],
    [allVars]
  );
  const sizesFor = (color) =>
    sortSizes(allVars.filter((v) => v.color === color).map((v) => v.size));

  const selectedVar = () =>
    allVars.find((v) => v.color === sel.color && v.size === sel.size) || null;

  const minVarPrice = useMemo(() => {
    const numbers = allVars
      .map((v) => parsePrice(v?.price))
      .filter((n) => n != null);
    return numbers.length ? Math.min(...numbers) : null;
  }, [allVars]);

  const varPrice = parsePrice(selectedVar()?.price);
  const displayPrice = varPrice ?? basePrice ?? minVarPrice;
  const isFrom = !varPrice && !basePrice && minVarPrice != null;

  const rating = Number(product?.rating || 0);
  const ratingStars = "★★★★★☆☆☆☆☆".slice(
    5 - Math.round(rating),
    10 - Math.round(rating)
  );

  const onAdd = async () => {
    if (!user) return notify.error("Please login to add items");
    if (isAdmin) return notify.error("Admins cannot add to cart");

    let arr = allVars;
    if (!arr || arr.length === 0) arr = await loadVars();

    if (!arr || arr.length === 0) {
      if (displayPrice == null) return notify.error("No price available yet");
      const fakeVar = { color: "default", size: "std", price: displayPrice };
      addToCart(product, fakeVar, 1);
      return notify.success("Added to cart");
    }

    if (arr.length === 1) {
      const v = { ...arr[0] };
      v.price = parsePrice(v.price) ?? basePrice;
      if (v.price == null)
        return notify.error("No price available for this item");
      addToCart(product, v, 1);
      return notify.success("Added to cart");
    }

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
    <article className={styles.card}>
      <div className={styles.mediaWrap}>
        <img
          className={styles.media}
          src={img}
          alt={product?.product_name || "Product"}
          loading="lazy"
          decoding="async"
        />
        <div className={styles.ribbon}>New</div>
        <button
          className={styles.quickBtn}
          onClick={() => {
            loadVars();
            onAdd();
          }}
          disabled={isAdmin || loadingVars}
          title="Quick add"
        >
          + Add
        </button>
        <div className={styles.shine} />
      </div>

      <div className={styles.body}>
        <div className={styles.topLine}>
          <h3 className={styles.title} title={product?.product_name}>
            {product?.product_name || "Unnamed product"}
          </h3>
          {rating > 0 && (
            <div className={styles.rating} title={`${rating.toFixed(1)} / 5`}>
              <span className={styles.starFill}>★</span>
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {(product?.shape_name ||
          product?.category_name ||
          product?.supplier_name) && (
          <div className={styles.tags}>
            {product?.shape_name && (
              <span className={styles.tag}>{product.shape_name}</span>
            )}
            {product?.category_name && (
              <span className={styles.tag}>{product.category_name}</span>
            )}
            {product?.supplier_name && (
              <span className={styles.tag}>{product.supplier_name}</span>
            )}
          </div>
        )}

        <div className={styles.priceRow}>
          {displayPrice != null ? (
            <span className={styles.priceNow}>
              {isFrom && <b className={styles.from}>From</b>}
              <span className={styles.currency}>₪</span>
              {displayPrice.toFixed(2)}
            </span>
          ) : (
            <span className={styles.noPrice}>—</span>
          )}
        </div>

        {/* خيارات سريعة */}
        {colors.length > 0 && (
          <div className={styles.row}>
            <div className={styles.swatches}>
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.swatch} ${
                    sel.color === c ? styles.active : ""
                  }`}
                  title={c}
                  onClick={async () => {
                    if (!vars) await loadVars();
                    const firstSize = sizesFor(c)[0] || "";
                    setSel({ color: c, size: firstSize });
                  }}
                >
                  {c}
                </button>
              ))}
              {!vars && (
                <button
                  className={styles.loadBtn}
                  onClick={loadVars}
                  disabled={loadingVars}
                >
                  {loadingVars ? "Loading…" : "Options"}
                </button>
              )}
            </div>

            {sel.color && sizesFor(sel.color).length > 0 && (
              <div className={styles.sizes}>
                {sizesFor(sel.color).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.size} ${
                      sel.size === s ? styles.active : ""
                    }`}
                    onClick={() => setSel((p) => ({ ...p, size: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.addBtn}
            onClick={onAdd}
            disabled={isAdmin || loadingVars}
            title={!user ? "Please login to add items" : ""}
          >
            {loadingVars ? "Loading…" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
