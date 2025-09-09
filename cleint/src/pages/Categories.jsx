// src/pages/Categories.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/Categories.module.css";
import api from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import { normalizeImageUrl } from "../lib/img.js";

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const location = useLocation();
  const navigate = useNavigate();

  const qs = new URLSearchParams(location.search);
  const qsShape = qs.get("bs") || "";

  const [cats, setCats] = useState([]);
  const [bodyshapes, setBodyshapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(
    qsShape || user?.bodyshape_id || ""
  );
  const [loading, setLoading] = useState(true);

  // admin form: create
  const [name, setName] = useState("");
  const [newImg, setNewImg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // admin form: mapping
  const [mapCat, setMapCat] = useState(null); // category_id being mapped
  const [mapBodyIds, setMapBodyIds] = useState([]); // selected bodyshape_ids

  // admin form: edit
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editImg, setEditImg] = useState("");

  // keep URL in sync (deep-linkable)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (selectedShape) p.set("bs", selectedShape);
    else p.delete("bs");
    const next = `${location.pathname}?${p.toString()}`;
    if (
      next !==
      `${location.pathname}?${new URLSearchParams(location.search).toString()}`
    ) {
      navigate(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShape]);

  const loadShapes = async () => {
    try {
      const { data } = await api.get("/bodyshapes");
      setBodyshapes(Array.isArray(data) ? data : []);
    } catch {
      notify.error("Failed to load bodyshapes");
    }
  };

  // Fetch categories (optionally by bodyshape) + enrich with mapped shapes for pills
  const loadCats = async (shapeId) => {
    setLoading(true);
    try {
      const url = shapeId
        ? `/categories?bodyshape_id=${shapeId}`
        : `/categories`;
      const { data } = await api.get(url);
      const list = Array.isArray(data) ? data : [];

      // enrich each category with its mapped shapes (for shape pills)
      const enriched = await Promise.all(
        list.map(async (c) => {
          try {
            const { data: m } = await api.get(
              `/categories/${c.category_id}/bodyshapes`
            );
            return { ...c, _shapes: Array.isArray(m) ? m : [] };
          } catch {
            return { ...c, _shapes: [] };
          }
        })
      );

      setCats(enriched);
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

  // helpers
  const normalizeInputUrl = (v) => {
    let s = String(v || "").trim();
    const m = s.replace(/\\/g, "/").match(/uploads\/([^/]+)$/i);
    if (m) {
      const origin =
        import.meta.env.VITE_FILES_ORIGIN || "http://localhost:5000";
      s = `${origin}/uploads/${m[1]}`;
    }
    return s;
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  };

  // admin-only CRUD
  const add = async (e) => {
    e?.preventDefault();
    if (!isAdmin) return;
    const label = (name || "").trim();
    if (!label) return notify.error("Write a category name");
    setSubmitting(true);
    try {
      await api.post("/categories", {
        category_name: label,
        image_url: newImg ? normalizeInputUrl(newImg) : null,
      });
      setName("");
      setNewImg("");
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
      if (mapCat === id) {
        setMapCat(null);
        setMapBodyIds([]);
      }
      if (editId === id) {
        setEditId(null);
        setEditName("");
        setEditImg("");
      }
    } catch {
      notify.error("Delete failed");
    }
  };

  const startEdit = (c) => {
    setEditId(c.category_id);
    setEditName(c.category_name || "");
    setEditImg(c.image_url || "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditImg("");
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const payload = {};
      if (editName !== "") payload.category_name = editName;
      // لو فاضي نخليه null عشان نمسح الصورة لو حاب
      payload.image_url = editImg ? normalizeInputUrl(editImg) : null;

      await api.put(`/categories/${editId}`, payload);
      notify.success("Category updated");
      cancelEdit();
      loadCats(selectedShape || "");
    } catch {
      notify.error("Update failed");
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
      // refresh to reflect pills
      loadCats(selectedShape || "");
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
              title="Open store"
            >
              <div
                className={styles.tileImg}
                style={{ backgroundImage: `url(${c.img})` }}
              />

              <div className={styles.tileGrad} />

              <div className={styles.tileName}>
                {c.category_name}
                <span className={styles.arrow}>→</span>
              </div>

              {/* Shape pills */}
              {c._shapes?.length > 0 && (
                <div className={styles.pills}>
                  {c._shapes.slice(0, 4).map((b) => (
                    <Link
                      key={b.bodyshape_id}
                      to={`/store?cat_id=${c.category_id}&bs=${b.bodyshape_id}`}
                      className={styles.pill}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {b.shape_name}
                    </Link>
                  ))}
                  {c._shapes.length > 4 && (
                    <span className={styles.more}>+{c._shapes.length - 4}</span>
                  )}
                </div>
              )}

              {/* زر تعديل سريع للأدمن */}
              {isAdmin && (
                <button
                  type="button"
                  className={styles.quickEdit}
                  onClick={(e) => {
                    e.preventDefault();
                    startEdit(c);
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    });
                  }}
                  title="Edit category"
                >
                  ✎
                </button>
              )}
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

            {/* List + inline edit */}
            <ul className={styles.list}>
              {cats.map((c) => {
                const editing = editId === c.category_id;
                return (
                  <li key={c.category_id} className={styles.item}>
                    {!editing ? (
                      <>
                        <span className={styles.dot} />
                        <span className={styles.name}>{c.category_name}</span>
                        <div className={styles.actions}>
                          <button
                            className={styles.btn}
                            onClick={() => startEdit(c)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.del}
                            onClick={() => remove(c.category_id)}
                            aria-label={`Delete ${c.category_name}`}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className={styles.editRow}>
                        <div className={styles.editLeft}>
                          <label className={styles.label}>Name</label>
                          <input
                            className={styles.input}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Category name"
                          />
                          <label className={styles.label}>Image URL</label>
                          <input
                            className={styles.input}
                            value={editImg}
                            onChange={(e) => setEditImg(e.target.value)}
                            placeholder="https://… or /uploads/…"
                          />
                          <div className={styles.imgInputRow}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const url = await uploadImage(
                                    e.target.files[0]
                                  );
                                  setEditImg(url);
                                  notify.success("Image uploaded");
                                }
                              }}
                            />
                            <span className={styles.smallNote}>
                              You can paste a URL or upload.
                            </span>
                          </div>
                          <div className={styles.editBtns}>
                            <button className={styles.btn} onClick={saveEdit}>
                              Save
                            </button>
                            <button className={styles.btn} onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                        <div className={styles.editRight}>
                          <div className={styles.label}>Preview</div>
                          <img
                            className={styles.imgPrev}
                            src={
                              normalizeImageUrl(editImg || c.image_url) ||
                              "/images/Club.png"
                            }
                            alt="preview"
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Create new */}
            <form onSubmit={add} className={styles.form}>
              <div className={styles.formCol}>
                <input
                  className={styles.input}
                  placeholder="New category"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="Image URL (optional)"
                  value={newImg}
                  onChange={(e) => setNewImg(e.target.value)}
                />
                <div className={styles.imgInputRow}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await uploadImage(e.target.files[0]);
                        setNewImg(url);
                        notify.success("Image uploaded");
                      }
                    }}
                  />
                  <span className={styles.smallNote}>
                    Paste a URL or upload an image.
                  </span>
                </div>
              </div>
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
