import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Bodyshape.module.css";

export default function BodyshapePage() {
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [active, setActive] = useState(null); // bodyshape object
  const [products, setProducts] = useState([]); // filtered products
  const [variations, setVariations] = useState({}); // { [pid]: Variation[] }
  const [selected, setSelected] = useState({}); // { [pid]: { color, size } }
  const [open, setOpen] = useState(false);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/bodyshapes");
        setShapes(data || []);
      } catch {
        notify.error("Failed to load bodyshapes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // map hero images per shape
  const heroFor = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("hour"))
      return "https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60f12a025285e1675eb6871b_Hourglass%20Body%20Shape%20Title%20Image.webp";
    if (n.includes("pear"))
      return "https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60efde82ce0dc256c05142f2_Pear%20Body%20Shape%20Title%20Image.webp";
    if (n.includes("apple"))
      return "https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60f12ec55285e1aca7b6a437_Apple%20Body%20Shape%20Title%20Image.webp";
    if (n.includes("rect"))
      return "https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60ee8f387785b9eb58eb0ea8_Rectangle%20Body%20Shape%20Title%20Image.webp";
    if (n.includes("invert"))
      return "https://cdn.prod.website-files.com/5eca30fd2b50b671e2107b06/60efe4a9ce19af708fe6e3dc_Inverted%20Triangle%20Body%20Shape%20Title%20Image.png";
    return "https://images.unsplash.com/photo-1504185945330-7a3ca6e0b35b?q=80&w=1600&auto=format&fit=crop";
  };

  // open modal with products for a shape
  const openShape = async (shape) => {
    try {
      setActive(shape);
      setOpen(true);

      const { data } = await api.get("/products", {
        params: { bodyshape_id: shape.bodyshape_id },
      });
      const list = Array.isArray(data)
        ? data.filter(
            (p) => String(p.bodyshape_id) === String(shape.bodyshape_id)
          )
        : [];
      setProducts(list);

      // fetch variations for each product
      const entries = await Promise.all(
        list.map(async (p) => {
          const { data: v } = await api.get(
            `/variations/product/${p.product_id}`
          );
          const def = v?.[0] ? { color: v[0].color, size: v[0].size } : null;
          return [p.product_id, { v: v || [], def }];
        })
      );

      const vmap = {};
      const smap = {};
      for (const [pid, obj] of entries) {
        vmap[pid] = obj.v;
        if (obj.def) smap[pid] = obj.def;
      }
      setVariations(vmap);
      setSelected(smap);
    } catch {
      notify.error("Failed to load products");
    }
  };

  const closeModal = () => {
    setOpen(false);
    setProducts([]);
    setVariations({});
    setSelected({});
    setActive(null);
  };

  // unique colors for a product
  const colorsOf = (pid) => {
    const vs = variations[pid] || [];
    return Array.from(new Set(vs.map((v) => v.color)));
  };
  // sizes for chosen color
  const sizesOf = (pid, color) => {
    const vs = variations[pid] || [];
    return vs.filter((v) => v.color === color).map((v) => v.size);
  };
  // find full selected variation
  const findSelectedVariation = (pid) => {
    const sel = selected[pid];
    if (!sel) return null;
    const vs = variations[pid] || [];
    return vs.find((v) => v.color === sel.color && v.size === sel.size) || null;
  };

  const onColorChange = (pid, color) => {
    const sizes = sizesOf(pid, color);
    setSelected((prev) => ({
      ...prev,
      [pid]: { color, size: sizes[0] || "" },
    }));
  };
  const onSizeChange = (pid, size) => {
    const prev = selected[pid] || {};
    setSelected((s) => ({ ...s, [pid]: { ...prev, size } }));
  };

  // ADD TO CART — with guards for guests/admins
  const add = (p) => {
    if (!user) return notify.error("Please login to add items");
    if (isAdmin) return notify.error("Admins cannot add to cart");
    const v = findSelectedVariation(p.product_id);
    if (!v) return notify.error("Choose color & size");
    addToCart(p, v, 1);
    notify.success("Added to cart");
  };

  const gotoCheckout = () => {
    if (!user) return notify.error("Please login to checkout");
    if (isAdmin) return notify.error("Admins cannot place orders");
    nav("/cart");
  };

  /* 3D Tilt handlers for shape cards (no state thrash; CSS vars on element) */
  const handleMove = useCallback((e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = (y / r.height - 0.5) * -8; // -4deg..4deg
    const ry = (x / r.width - 0.5) * 8;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
  }, []);
  const handleLeave = useCallback((e) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  }, []);

  if (loading) return <div className="card">Loading…</div>;

  return (
    <div className={styles.page}>
      {/* FX layers */}
      <div className={styles.fxStars} aria-hidden />
      <div className={styles.fxBokeh} aria-hidden />

      <h1 className={styles.title}>Find Your Perfect Fit</h1>
      <p className={styles.subtitle}>
        Tap a body shape to explore curated pieces just for you.
      </p>

      <div className={styles.grid}>
        {shapes.map((s) => (
          <button
            key={s.bodyshape_id}
            className={`${styles.shapeCard} ${styles.luxBorder}`}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={() => openShape(s)}
            aria-label={`Open ${s.shape_name}`}
          >
            <div
              className={styles.shapeImage}
              style={{ backgroundImage: `url(${heroFor(s.shape_name)})` }}
            />
            <div className={styles.shapeName}>{s.shape_name}</div>
            <div className={styles.shapeHint}>Explore selection →</div>
          </button>
        ))}
      </div>

      {/* MODAL */}
      {open && active && (
        <div
          className={styles.overlay}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.close}
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>

            <div
              className={styles.hero}
              style={{ backgroundImage: `url(${heroFor(active.shape_name)})` }}
            >
              <div className={styles.heroContent}>
                <div className={styles.heroTitle}>{active.shape_name}</div>
                <div className={styles.heroDesc}>
                  {active.description ||
                    "Styled picks tailored to your silhouette."}
                </div>
              </div>
            </div>

            <div className={styles.productsGrid}>
              {products.map((p) => {
                const sel = selected[p.product_id];
                const colors = colorsOf(p.product_id);
                const sizes = sel?.color
                  ? sizesOf(p.product_id, sel.color)
                  : [];
                const v = findSelectedVariation(p.product_id);

                return (
                  <div key={p.product_id} className={styles.pCard}>
                    <img
                      className={styles.thumb}
                      src={
                        p.image_url ||
                        "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop"
                      }
                      alt={p.product_name}
                      loading="lazy"
                    />
                    <div className={styles.pName}>{p.product_name}</div>

                    <div className={styles.row}>
                      <label>Color</label>
                      <select
                        className={styles.select}
                        value={sel?.color || ""}
                        onChange={(e) =>
                          onColorChange(p.product_id, e.target.value)
                        }
                      >
                        {colors.length === 0 && <option value="">—</option>}
                        {colors.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.row}>
                      <label>Size</label>
                      <select
                        className={styles.select}
                        value={sel?.size || ""}
                        onChange={(e) =>
                          onSizeChange(p.product_id, e.target.value)
                        }
                        disabled={!sel?.color}
                      >
                        {(!sel?.color || sizes.length === 0) && (
                          <option value="">—</option>
                        )}
                        {sizes.map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.price}>
                        {v ? `₪${Number(v.price).toFixed(2)}` : "--"}
                      </div>
                      <button
                        className={styles.primaryBtn}
                        onClick={() => add(p)}
                        disabled={!user || isAdmin || !v}
                        title={
                          !user
                            ? "Please login to add items"
                            : isAdmin
                            ? "Admins cannot add to cart"
                            : !v
                            ? "Choose color & size"
                            : ""
                        }
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                );
              })}

              {products.length === 0 && (
                <div className={styles.empty}>
                  No products found for this body shape.
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostBtn} onClick={closeModal}>
                Continue browsing
              </button>
              <button
                className={styles.checkoutBtn}
                onClick={gotoCheckout}
                disabled={!user || isAdmin}
                title={
                  !user
                    ? "Please login to checkout"
                    : isAdmin
                    ? "Admins cannot place orders"
                    : ""
                }
              >
                Go to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
