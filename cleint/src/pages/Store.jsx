// src/pages/Store.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import styles from "../styles/Store.module.css"; // يستخدم CSS module

function toNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function Store() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);

  const catId = toNum(qs.get("cat_id"));
  const bsFromQuery = toNum(qs.get("bs"));
  // استخدم bodyshape المحفوظ للمستخدم إذا لم يصل bs بالكويري
  const bodyshapeId = bsFromQuery ?? toNum(user?.bodyshape_id);

  // ✅ عرّف الحالات قبل أي استخدام
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needShape, setNeedShape] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setNeedShape(false);
      try {
        let data = [];

        if (catId) {
          // عند التصفّح حسب الفئة، مطلوب bodyshape
          if (bodyshapeId == null) {
            if (!mounted) return;
            setNeedShape(true);
          } else {
            const r = await api.get(`/categories/${catId}/products`, {
              params: { bodyshape_id: bodyshapeId },
            });
            data = r.data;
          }
        } else {
          // بدون فئة: اعرض كل المنتجات
          const r = await api.get("/products");
          data = r.data;
        }

        if (!mounted) return;
        setProducts(Array.isArray(data) ? data : data?.items || []);
      } catch {
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [catId, bodyshapeId]);

  // ✅ الآن آمن تستعمل needShape
  if (needShape) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>
            Pick your bodyshape to view this category.
          </div>
          <button className="btn" onClick={() => nav("/bodyshape")}>
            Choose bodyshape
          </button>
        </div>
      </div>
    );
  }

  // سكيلتون أنيق أثناء التحميل
  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.head}>
          <h2 className={styles.title}>Store</h2>
        </div>
        <div className={styles.skelGrid}>
          {[...Array(6)].map((_, i) => (
            <div className={styles.skelCard} key={i}>
              <div className={styles.skelThumb} />
              <div className={styles.skelLine} />
              <div className={styles.skelLine} style={{ width: "60%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={styles.title}>Store</h2>
      </div>

      <div className={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.product_id || p.id} product={p} />
        ))}

        {products.length === 0 && (
          <div className={styles.empty}>No products found.</div>
        )}
      </div>
    </div>
  );
}
