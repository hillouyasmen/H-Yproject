// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import { normalizeImageUrl } from "../lib/img.js";

export default function Product() {
  const { id } = useParams(); // product id
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // تفاصيل المنتج
        const { data: p } = await api.get(`/products/${id}`);
        // الـ variations الخاصة بهذا المنتج
        const { data: v } = await api.get(`/variations`, {
          params: { product_id: id },
        });

        if (!mounted) return;
        setProduct(p);
        setVariations(Array.isArray(v) ? v : v?.items || []);
      } catch (e) {
        console.error(e);
        notify.error("Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // ألوان وأحجام متاحة
  const colors = useMemo(() => {
    const set = new Set(variations.map((x) => x.color).filter(Boolean));
    return [...set];
  }, [variations]);

  const sizesForColor = useMemo(() => {
    return variations
      .filter((x) => (color ? x.color === color : true))
      .map((x) => x.size)
      .filter(Boolean)
      .filter((x, i, arr) => arr.indexOf(x) === i);
  }, [variations, color]);

  // سعر الوحدة للـ variation المختارة
  const unitPrice = useMemo(() => {
    const v = variations.find((x) => x.color === color && x.size === size);
    return v
      ? Number(v.price || 0)
      : Number(product?.price ?? product?.base_price ?? 0);
  }, [variations, color, size, product]);

  const imageSrc =
    normalizeImageUrl(product?.image_url) ??
    "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";

  const canAdd = !!user && !isAdmin && !!color && !!size;

  const addToCart = async () => {
    if (!user) return notify.error("Please login to add items");
    if (isAdmin) return notify.error("Admins cannot add to cart");
    if (!color || !size) return notify.info("Choose color and size first");

    try {
      await api.post("/cart/add", {
        user_id: user.user_id,
        product_id: Number(id),
        color,
        size,
        quantity: Math.max(1, Number(qty) || 1),
      });
      notify.success("Added to cart");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="card">Loading…</div>;
  if (!product) return <div className="card">Product not found</div>;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <img
            src={imageSrc}
            alt={product.product_name || "Product"}
            style={{
              width: "100%",
              height: 420,
              objectFit: "cover",
              borderRadius: 12,
            }}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";
            }}
          />
        </div>

        <div>
          <h1 style={{ margin: 0 }}>
            {product.product_name || product.name || "Product"}
          </h1>
          {product.description && (
            <p style={{ opacity: 0.8 }}>{product.description}</p>
          )}

          <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "8px 0" }}>
            {unitPrice.toFixed(2)} ₪
          </div>

          {/* اختيار اللون */}
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontWeight: 700 }}>Color</label>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {colors.length ? (
                colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setSize(""); // اعد ضبط الحجم عند تغيير اللون
                    }}
                    className="btn"
                    style={{
                      background: color === c ? "var(--ink)" : "var(--card)",
                      color: color === c ? "#fff" : "inherit",
                      border: "1px solid #ddd",
                    }}
                  >
                    {c}
                  </button>
                ))
              ) : (
                <span style={{ opacity: 0.7 }}>No color options</span>
              )}
            </div>
          </div>

          {/* اختيار المقاس */}
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontWeight: 700 }}>Size</label>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {sizesForColor.length ? (
                sizesForColor.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="btn"
                    style={{
                      background: size === s ? "var(--ink)" : "var(--card)",
                      color: size === s ? "#fff" : "inherit",
                      border: "1px solid #ddd",
                    }}
                  >
                    {s}
                  </button>
                ))
              ) : (
                <span style={{ opacity: 0.7 }}>
                  {color ? "No sizes for this color" : "Pick a color first"}
                </span>
              )}
            </div>
          </div>

          {/* الكمية */}
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontWeight: 700 }}>
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ width: 100 }}
            />
          </div>

          {/* أزرار */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={addToCart} disabled={!canAdd}>
              Add to Cart
            </button>
            {/* يمكنك هنا إضافة زر Buy Now لاحقًا */}
          </div>
        </div>
      </div>
    </div>
  );
}
