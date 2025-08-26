import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Categories.module.css";
import api from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import { normalizeImageUrl } from "../lib/img.js";

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [cats, setCats] = useState([]);
  const [bodyshapes, setBodyshapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(user?.bodyshape_id || "");
  const [loading, setLoading] = useState(true);

  // admin form
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mapCat, setMapCat] = useState(null); // category_id being mapped
  const [mapBodyIds, setMapBodyIds] = useState([]); // selected bodyshape_ids

  const loadShapes = async () => {
    try {
      const { data } = await api.get("/bodyshapes");
      setBodyshapes(Array.isArray(data) ? data : []);
    } catch {
      notify.error("Failed to load bodyshapes");
    }
  };

  const loadCats = async (shapeId) => {
    setLoading(true);
    try {
      const url = shapeId
        ? `/categories?bodyshape_id=${shapeId}`
        : `/categories`;
      const { data } = await api.get(url);
      setCats(Array.isArray(data) ? data : []);
    } catch {
      notify.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShapes();
    loadCats(selectedShape || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCats(selectedShape || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShape]);

  // admin-only CRUD
  const add = async (e) => {
    e?.preventDefault();
    if (!isAdmin) return;
    const label = (name || "").trim();
    if (!label) return notify.error("Write a category name");
    setSubmitting(true);
    try {
      await api.post("/categories", { category_name: label });
      setName("");
      notify.success("Category added");
      loadCats(selectedShape || "");
    } catch {
      notify.error("Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      notify.success("Category removed");
      loadCats(selectedShape || "");
    } catch {
      notify.error("Delete failed");
    }
  };

  // admin mapping save
  const saveMapping = async () => {
    if (!mapCat) return;
    try {
      await api.post(`/categories/${mapCat}/bodyshapes`, {
        bodyshape_ids: mapBodyIds,
      });
      notify.success("Mapping saved");
      setMapCat(null);
      setMapBodyIds([]);
    } catch {
      notify.error("Save mapping failed");
    }
  };

  // Compute gallery cards with safe image
  const gallery = useMemo(
    () =>
      cats.map((c) => {
        const raw = c.image_url || c.img || "/images/Club.png";
        const img = normalizeImageUrl(raw);
        return {
          ...c,
          img,
          slug: encodeURIComponent((c.category_name || "").toLowerCase()),
        };
      }),
    [cats]
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <h2 className={styles.title}>Categories</h2>

        {/* Filter by bodyshape */}
        <div className={styles.filter}>
          <label htmlFor="shapeSel">Bodyshape:</label>
          <select
            id="shapeSel"
            className={styles.select}
            value={selectedShape}
            onChange={(e) => setSelectedShape(e.target.value)}
          >
            <option value="">All</option>
            {bodyshapes.map((b) => (
              <option key={b.bodyshape_id} value={b.bodyshape_id}>
                {b.shape_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Read-only gallery */}
      <section
        className={styles.gallery}
        aria-busy={loading ? "true" : "false"}
      >
        {loading ? (
          <>
            <div className={styles.skelTile} />
            <div className={styles.skelTile} />
            <div className={styles.skelTile} />
            <div className={styles.skelTile} />
          </>
        ) : gallery.length === 0 ? (
          <div className={styles.empty}>No categories for this bodyshape.</div>
        ) : (
          gallery.map((c) => (
            <Link
              key={c.category_id}
              to={`/store?cat_id=${c.category_id}${
                selectedShape ? `&bs=${selectedShape}` : ""
              }`}
              className={styles.tile}
            >
              <div
                className={styles.tileImg}
                style={{ backgroundImage: `url(${c.img})` }}
              />
              <div className={styles.tileName}>
                {c.category_name}
                <span style={{ color: "var(--muted)", fontWeight: 700 }}>
                  →
                </span>
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Admin panel */}
      {isAdmin && (
        <section className={styles.mgmt}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Manage categories</h3>

            {/* map category ↔ bodyshapes */}
            <div className={styles.mapRow}>
              <select
                className={styles.select}
                value={mapCat || ""}
                onChange={(e) => setMapCat(e.target.value)}
              >
                <option value="">Select category to map…</option>
                {cats.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                multiple
                size={Math.min(6, bodyshapes.length || 6)}
                value={mapBodyIds}
                onChange={(e) =>
                  setMapBodyIds(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
                }
                aria-label="Select bodyshapes"
              >
                {bodyshapes.map((b) => (
                  <option key={b.bodyshape_id} value={b.bodyshape_id}>
                    {b.shape_name}
                  </option>
                ))}
              </select>

              <button
                className={styles.btn}
                onClick={saveMapping}
                disabled={!mapCat || mapBodyIds.length === 0}
                title={!mapCat ? "Choose a category first" : undefined}
              >
                Save mapping
              </button>
            </div>

            <ul className={styles.list}>
              {cats.map((c) => (
                <li key={c.category_id} className={styles.item}>
                  <span className={styles.dot} />
                  <span className={styles.name}>{c.category_name}</span>
                  <button
                    className={styles.del}
                    onClick={() => remove(c.category_id)}
                    aria-label={`Delete ${c.category_name}`}
                    title="Delete"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={add} className={styles.form}>
              <input
                className={styles.input}
                placeholder="New category"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className={styles.btn} disabled={submitting}>
                {submitting ? "Adding…" : "Add"}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
