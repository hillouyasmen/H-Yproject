// src/pages/Store.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard.jsx";

export default function Store() {
  const loc = useLocation();
  const nav = useNavigate();

  const params = new URLSearchParams(loc.search);
  const catId = params.get("cat_id");
  const bs = params.get("bs");
  const qFromUrl = params.get("q") || "";

  // كل المنتجات الخام + بحث
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(qFromUrl);

  // حمّل المنتجات (حسب cat_id/bs)
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (catId) {
          const url = bs
            ? `/categories/${catId}/products?bodyshape_id=${bs}`
            : `/categories/${catId}/products`;
          const { data } = await api.get(url);
          setAllProducts(Array.isArray(data) ? data : []);
        } else {
          const { data } = await api.get("/products");
          setAllProducts(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    })();
    // ملاحظة: إذا تغيّر q فقط، لا نعيد التحميل
  }, [catId, bs]);

  // حدّث الرابط بـ q (debounced بسيط)
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams();
      if (catId) sp.set("cat_id", catId);
      if (bs) sp.set("bs", bs);
      if (q.trim()) sp.set("q", q.trim());
      nav(
        { pathname: loc.pathname, search: sp.toString() ? `?${sp}` : "" },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [q, catId, bs, loc.pathname, nav]);

  // فلترة فورية
  const filtered = useMemo(() => {
    if (!q.trim()) return allProducts;
    const term = q.trim().toLowerCase();
    return allProducts.filter((p) => {
      const name = String(p?.product_name || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [allProducts, q]);

  if (loading) return <div className="card">Loading products…</div>;

  return (
    <div>
      <div
        className="card"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <h2 className="sectionTitle" style={{ margin: 0 }}>
          Store
        </h2>

        {/* شريط البحث الهوت */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          <input
            className="input"
            style={{ minWidth: 260 }}
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="btn" onClick={() => setQ("")} title="Clear">
              Clear
            </button>
          )}
          <span className="badge" title="Results count">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {filtered.map((p) => (
          <ProductCard key={p.product_id || p.id} product={p} />
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ color: "var(--muted)" }}>
            No products matched “{q}”.
          </div>
        )}
      </div>
    </div>
  );
}
