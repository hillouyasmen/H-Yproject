// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "../styles/AdminDashboard.module.css";
import api from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import { normalizeImageUrl } from "../lib/img.js";
import useEvents from "../hooks/useEvents.js";

// Recharts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = !!user && user.role === "admin";

  const [tab, setTab] = useState("products"); // products | variations | orders | users | catalog | analytics | messages
  const [loading, setLoading] = useState(true);

  // data
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [shapes, setShapes] = useState([]);

  // forms
  const emptyP = {
    product_name: "",
    category_id: "",
    supplier_id: "",
    bodyshape_id: "",
    description: "",
    rating: "",
    image_url: "",
  };
  const [pForm, setPForm] = useState(emptyP);
  const [pEditId, setPEditId] = useState(null);

  const [vForm, setVForm] = useState({
    color: "",
    size: "",
    price: "",
    quantity: "",
  });

  const [uEdit, setUEdit] = useState(null);

  // ======== Contact Messages state ========
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgFilter, setMsgFilter] = useState("open"); // open | resolved | all
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState("open");

  // loaders
  const loadProducts = () =>
    api.get("/products").then(({ data }) => setProducts(data));
  const loadOrders = () =>
    api.get("/orders").then(({ data }) => setOrders(data));
  const loadUsers = () => api.get("/users").then(({ data }) => setUsers(data));
  const loadCatalog = async () => {
    const [c, s, b] = await Promise.all([
      api.get("/categories"),
      api.get("/suppliers"),
      api.get("/bodyshapes"),
    ]);
    setCategories(c.data);
    setSuppliers(s.data);
    setShapes(b.data);
  };

  // ✅ لا نعيد تعريف isAdmin مرة ثانية
  const { events, connected } = useEvents({ enabled: isAdmin, max: 150 });

  const loadVariations = async (pid) => {
    const { data } = await api.get(`/variations/product/${pid}`);
    setVariations(data);
  };

  // contact messages
  const loadMessages = async (status = msgFilter) => {
    setMsgLoading(true);
    try {
      const params = {};
      if (status !== "all") params.status = status;
      const { data } = await api.get("/contact", { params });
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      notify.error("Failed to load messages");
    } finally {
      setMsgLoading(false);
    }
  };

  const openMessage = (m) => {
    setSelectedMsg(m);
    setEditNote(m.admin_note || "");
    setEditStatus(m.status || "open");
  };

  const saveMessage = async () => {
    if (!selectedMsg) return;
    try {
      await api.put(`/contact/${selectedMsg.id}`, {
        admin_note: editNote,
        status: editStatus,
      });
      notify.success("Message updated");
      setSelectedMsg(null);
      loadMessages();
    } catch {
      notify.error("Update failed");
    }
  };

  // boot
  useEffect(() => {
    if (!isAdmin) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadProducts(),
          loadOrders(),
          loadUsers(),
          loadCatalog(),
        ]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (tab === "messages" && isAdmin) loadMessages();
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab === "messages" && isAdmin) loadMessages(msgFilter);
  }, [msgFilter, tab, isAdmin]);

  useEffect(() => {
    if (tab === "variations" && !selectedProduct && products.length) {
      setSelectedProduct(products[0]);
    }
  }, [tab, products, selectedProduct]);

  useEffect(() => {
    if (selectedProduct) loadVariations(selectedProduct.product_id);
  }, [selectedProduct]);

  const byId = (arr, idField, id) =>
    arr.find((x) => String(x[idField]) === String(id));
  const catName = (id) =>
    byId(categories, "category_id", id)?.category_name || "-";
  const supName = (id) =>
    byId(suppliers, "supplier_id", id)?.supplier_name || "-";
  const shapeName = (id) =>
    byId(shapes, "bodyshape_id", id)?.shape_name || "All";

  // image helpers
  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  };

  const onImgUrlChange = (e) => {
    let v = e.target.value.trim();
    const m = v.replace(/\\/g, "/").match(/uploads\/([^/]+)$/i);
    if (m) {
      const origin =
        import.meta.env.VITE_FILES_ORIGIN || "http://localhost:5000";
      v = `${origin}/uploads/${m[1]}`;
    }
    setPForm({ ...pForm, image_url: v });
  };

  // products CRUD
  const addProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...pForm,
        category_id: pForm.category_id || null,
        supplier_id: pForm.supplier_id || null,
        bodyshape_id: pForm.bodyshape_id || null,
        rating: pForm.rating || null,
        image_url: pForm.image_url || null,
      };
      await api.post("/products", payload);
      notify.success("Product added");
      setPForm(emptyP);
      loadProducts();
      setTab("products");
    } catch {
      notify.error("Failed to add product");
    }
  };

  const startEditProduct = (p) => {
    setPEditId(p.product_id);
    setPForm({
      product_name: p.product_name || "",
      category_id: p.category_id || "",
      supplier_id: p.supplier_id || "",
      bodyshape_id: p.bodyshape_id || "",
      description: p.description || "",
      rating: p.rating || "",
      image_url: p.image_url || "",
    });
  };

  const saveEditProduct = async (id) => {
    try {
      await api.put(`/products/${id}`, pForm);
      notify.success("Product updated");
      setPEditId(null);
      setPForm(emptyP);
      loadProducts();
    } catch {
      notify.error("Update failed");
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      notify.success("Product deleted");
      if (selectedProduct?.product_id === id) setSelectedProduct(null);
      loadProducts();
    } catch {
      notify.error("Delete failed");
    }
  };

  // variations CRUD
  const addVariation = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return notify.error("Select a product first");
    try {
      await api.post("/variations", {
        product_id: selectedProduct.product_id,
        ...vForm,
        price: Number(vForm.price),
        quantity: Number(vForm.quantity || 0),
      });
      notify.success("Variation added");
      setVForm({ color: "", size: "", price: "", quantity: "" });
      loadVariations(selectedProduct.product_id);
    } catch {
      notify.error("Add variation failed");
    }
  };

  const updateVariation = async (v) => {
    try {
      await api.put("/variations", {
        product_id: v.product_id,
        color: v.color,
        size: v.size,
        price: Number(v.price),
        quantity: Number(v.quantity),
      });
      notify.success("Saved");
      loadVariations(v.product_id);
    } catch {
      notify.error("Save failed");
    }
  };

  const adjustStock = async (v, delta) => {
    try {
      await api.patch("/variations/stock", {
        product_id: v.product_id,
        color: v.color,
        size: v.size,
        delta,
      });
      loadVariations(v.product_id);
    } catch {
      notify.error("Stock update failed");
    }
  };

  const deleteVariation = async (v) => {
    if (!confirm("Delete this variation?")) return;
    try {
      await api.delete("/variations", {
        data: { product_id: v.product_id, color: v.color, size: v.size },
      });
      notify.success("Deleted");
      loadVariations(v.product_id);
    } catch {
      notify.error("Delete failed");
    }
  };

  // users
  const saveUser = async (u) => {
    try {
      await api.put(`/users/${u.user_id}`, {
        username: u.username,
        email: u.email,
        phone: u.phone,
        birth_date: u.birth_date,
        role: u.role,
        address: u.address,
        bodyshape_id: u.bodyshape_id || null,
      });
      notify.success("User updated");
      setUEdit(null);
      loadUsers();
    } catch {
      notify.error("Update failed");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      notify.success("User deleted");
      loadUsers();
    } catch {
      notify.error("Delete failed");
    }
  };

  // analytics
  const PINK = "#d63384";
  const COLORS = [
    "#d63384",
    "#ff7ab8",
    "#e91e63",
    "#fd8bb6",
    "#ffb3d1",
    "#8e3b6b",
  ];

  function daysBack(n = 14) {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const t = new Date(d);
      t.setDate(d.getDate() - i);
      out.push(t.toISOString().slice(0, 10));
    }
    return out;
  }

  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const customers = totalUsers - admins;

    const paidish = new Set(["paid", "shipped"]);
    const agg = orders.reduce(
      (a, o) => {
        const amt = Number(o.total_amount || 0);
        a.count += 1;
        a.byStatus[o.status] = (a.byStatus[o.status] || 0) + 1;
        if (paidish.has(String(o.status))) a.revenue += amt;
        return a;
      },
      { count: 0, revenue: 0, byStatus: {} }
    );

    return {
      totalUsers,
      admins,
      customers,
      ordersCount: agg.count,
      revenue: agg.revenue,
      avgOrder: agg.count ? agg.revenue / agg.count : 0,
      byStatus: agg.byStatus,
    };
  }, [users, orders]);

  const bodyshapeData = useMemo(() => {
    const map = {};
    for (const u of users) {
      const k = u.shape_name || "—";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [users]);

  const statusData = useMemo(() => {
    const keys = ["pending", "paid", "shipped", "cancelled"];
    return keys.map((k) => ({ status: k, count: kpis.byStatus[k] || 0 }));
  }, [kpis]);

  const revenueSeries = useMemo(() => {
    const days = daysBack(14);
    const paidish = new Set(["paid", "shipped"]);
    const byDay = Object.fromEntries(days.map((d) => [d, 0]));
    for (const o of orders) {
      if (!o?.order_date) continue;
      if (!paidish.has(String(o.status))) continue;
      const d = new Date(o.order_date).toISOString().slice(0, 10);
      if (byDay[d] !== undefined) byDay[d] += Number(o.total_amount || 0);
    }
    return days.map((d) => ({ day: d, revenue: byDay[d] }));
  }, [orders]);

  const money = (n) => "$" + Number(n || 0).toFixed(2);

  // product card
  const ProductCard = ({ p }) => {
    const editing = pEditId === p.product_id;
    const imgSrc =
      normalizeImageUrl(editing ? pForm.image_url : p.image_url) ||
      "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";

    return (
      <div className={`card ${styles.productCard}`}>
        <img src={imgSrc} className={styles.pImg} alt={p.product_name} />
        {!editing ? (
          <>
            <div className={styles.pTitle}>{p.product_name}</div>
            <div className={styles.pMeta}>
              <span className="badge">{shapeName(p.bodyshape_id)}</span>
              <span className="badge">{catName(p.category_id)}</span>
              <span className="badge">{supName(p.supplier_id)}</span>
            </div>
            <div className={styles.actions}>
              <button
                className="btn"
                onClick={() => {
                  setSelectedProduct(p);
                  setTab("variations");
                }}
              >
                Variations
              </button>
              <button className="btn" onClick={() => startEditProduct(p)}>
                Edit
              </button>
              <button
                className="btn"
                onClick={() => deleteProduct(p.product_id)}
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              className="input"
              value={pForm.product_name}
              onChange={(e) =>
                setPForm({ ...pForm, product_name: e.target.value })
              }
              placeholder="Product name"
            />
            <input
              className="input"
              style={{ marginTop: 8 }}
              value={pForm.image_url}
              onChange={onImgUrlChange}
              placeholder="Image URL"
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadImage(e.target.files[0]);
                  setPForm({ ...pForm, image_url: url });
                  notify.success("Image uploaded");
                }
              }}
              style={{ marginTop: 8 }}
            />
            <div className={styles.triple}>
              <select
                className="select"
                value={pForm.category_id}
                onChange={(e) =>
                  setPForm({ ...pForm, category_id: e.target.value })
                }
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={pForm.supplier_id}
                onChange={(e) =>
                  setPForm({ ...pForm, supplier_id: e.target.value })
                }
              >
                <option value="">Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={pForm.bodyshape_id}
                onChange={(e) =>
                  setPForm({ ...pForm, bodyshape_id: e.target.value })
                }
              >
                <option value="">Bodyshape</option>
                {shapes.map((s) => (
                  <option key={s.bodyshape_id} value={s.bodyshape_id}>
                    {s.shape_name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="textarea"
              style={{ marginTop: 8 }}
              value={pForm.description}
              onChange={(e) =>
                setPForm({ ...pForm, description: e.target.value })
              }
              placeholder="Description"
            />
            <div className={styles.actions}>
              <button
                className="btn"
                onClick={() => saveEditProduct(p.product_id)}
              >
                Save
              </button>
              <button
                className="btn"
                onClick={() => {
                  setPEditId(null);
                  setPForm(emptyP);
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // guards after hooks
  if (!isAdmin) return <div className="card">Admins only.</div>;
  if (loading) return <div className="card">Loading dashboard…</div>;

  return (
    <div className={styles.wrap}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          "analytics",
          "products",
          "variations",
          "orders",
          "users",
          "catalog",
          "messages",
        ].map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.active : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div className={styles.analytics}>
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Total Users</div>
              <div className={styles.kpiValue}>{kpis.totalUsers}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Customers</div>
              <div className={styles.kpiValue}>{kpis.customers}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Orders</div>
              <div className={styles.kpiValue}>{kpis.ordersCount}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Revenue</div>
              <div className={styles.kpiValue}>{money(kpis.revenue)}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Avg Order</div>
              <div className={styles.kpiValue}>{money(kpis.avgOrder)}</div>
            </div>
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Revenue (last 14 days)</div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PINK} stopOpacity={0.6} />
                        <stop
                          offset="100%"
                          stopColor={PINK}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} />
                    <YAxis />
                    <Tooltip formatter={(v) => money(v)} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={PINK}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Orders by status</div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={PINK} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Users by bodyshape</div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bodyshapeData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {bodyshapeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "products" && (
        <div className={styles.grid2}>
          <div className="card">
            <h2 className="sectionTitle">Add Product</h2>
            <form onSubmit={addProduct}>
              <input
                className="input"
                placeholder="Product name"
                value={pForm.product_name}
                onChange={(e) =>
                  setPForm({ ...pForm, product_name: e.target.value })
                }
              />
              <input
                className="input"
                style={{ marginTop: 8 }}
                placeholder="Image URL"
                value={pForm.image_url}
                onChange={onImgUrlChange}
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadImage(e.target.files[0]);
                    setPForm({ ...pForm, image_url: url });
                    notify.success("Image uploaded");
                  }
                }}
                style={{ marginTop: 8 }}
              />
              <div className={styles.triple}>
                <select
                  className="select"
                  value={pForm.category_id}
                  onChange={(e) =>
                    setPForm({ ...pForm, category_id: e.target.value })
                  }
                >
                  <option value="">Category</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  value={pForm.supplier_id}
                  onChange={(e) =>
                    setPForm({ ...pForm, supplier_id: e.target.value })
                  }
                >
                  <option value="">Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  value={pForm.bodyshape_id}
                  onChange={(e) =>
                    setPForm({ ...pForm, bodyshape_id: e.target.value })
                  }
                >
                  <option value="">Bodyshape</option>
                  {shapes.map((s) => (
                    <option key={s.bodyshape_id} value={s.bodyshape_id}>
                      {s.shape_name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="textarea"
                style={{ marginTop: 8 }}
                placeholder="Description"
                value={pForm.description}
                onChange={(e) =>
                  setPForm({ ...pForm, description: e.target.value })
                }
              />
              <input
                className="input"
                style={{ marginTop: 8 }}
                placeholder="Rating"
                value={pForm.rating}
                onChange={(e) => setPForm({ ...pForm, rating: e.target.value })}
              />
              <button className="btn" style={{ marginTop: 12 }}>
                Create
              </button>
            </form>
          </div>

          <div>
            <h2 className="sectionTitle">Products</h2>
            <div className={styles.cards}>
              {products.map((p) => (
                <ProductCard key={p.product_id} p={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VARIATIONS */}
      {tab === "variations" && (
        <div className="card">
          <h2 className="sectionTitle">Product Variations</h2>

          <div className={styles.selectorRow}>
            <select
              className="select"
              value={selectedProduct?.product_id || ""}
              onChange={(e) =>
                setSelectedProduct(
                  products.find((p) => p.product_id === Number(e.target.value))
                )
              }
            >
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  #{p.product_id} — {p.product_name}
                </option>
              ))}
            </select>
            <div className="badge">
              {selectedProduct ? shapeName(selectedProduct.bodyshape_id) : ""}
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Color</th>
                <th>Size</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Stock</th>
                <th>Save</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr key={`${v.color}-${v.size}`}>
                  <td>{v.color}</td>
                  <td>{v.size}</td>
                  <td>
                    <input
                      className={styles.cellInput}
                      defaultValue={v.price}
                      onChange={(e) => (v.price = e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      defaultValue={v.quantity}
                      onChange={(e) => (v.quantity = e.target.value)}
                    />
                  </td>
                  <td className={styles.stockBtns}>
                    <button className="btn" onClick={() => adjustStock(v, +1)}>
                      +
                    </button>
                    <button className="btn" onClick={() => adjustStock(v, -1)}>
                      -
                    </button>
                  </td>
                  <td>
                    <button className="btn" onClick={() => updateVariation(v)}>
                      Save
                    </button>
                  </td>
                  <td>
                    <button className="btn" onClick={() => deleteVariation(v)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {variations.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", color: "var(--muted)" }}
                  >
                    No variations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form className={styles.addVar} onSubmit={addVariation}>
            <input
              className="input"
              placeholder="Color"
              value={vForm.color}
              onChange={(e) => setVForm({ ...vForm, color: e.target.value })}
            />
            <input
              className="input"
              placeholder="Size"
              value={vForm.size}
              onChange={(e) => setVForm({ ...vForm, size: e.target.value })}
            />
            <input
              className="input"
              placeholder="Price"
              value={vForm.price}
              onChange={(e) => setVForm({ ...vForm, price: e.target.value })}
            />
            <input
              className="input"
              placeholder="Quantity"
              value={vForm.quantity}
              onChange={(e) => setVForm({ ...vForm, quantity: e.target.value })}
            />
            <button className="btn">Add variation</button>
          </form>
        </div>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        <div className="card">
          <h2 className="sectionTitle">Orders</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.order_id}>
                  <td>{o.order_id}</td>
                  <td>{o.username}</td>
                  <td>{new Date(o.order_date).toLocaleString()}</td>
                  <td>
                    <select
                      className="select"
                      defaultValue={o.status}
                      onChange={(e) => (o.status = e.target.value)}
                    >
                      <option>pending</option>
                      <option>paid</option>
                      <option>shipped</option>
                      <option>cancelled</option>
                    </select>
                  </td>
                  <td>${Number(o.total_amount || 0).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn"
                      onClick={async () => {
                        await api.put(`/orders/${o.order_id}`, {
                          status: o.status,
                        });
                        notify.success("Status updated");
                        loadOrders();
                      }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="card">
          <h2 className="sectionTitle">Users</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Bodyshape</th>
                <th>Save</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const editing = uEdit === u.user_id;
                return (
                  <tr key={u.user_id}>
                    <td>{u.user_id}</td>
                    <td>
                      {editing ? (
                        <input
                          className={styles.cellInput}
                          defaultValue={u.username}
                          onChange={(e) => (u.username = e.target.value)}
                        />
                      ) : (
                        u.username
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className={styles.cellInput}
                          defaultValue={u.email}
                          onChange={(e) => (u.email = e.target.value)}
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <select
                          className="select"
                          defaultValue={u.role}
                          onChange={(e) => (u.role = e.target.value)}
                        >
                          <option value="customer">customer</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <select
                          className="select"
                          defaultValue={u.bodyshape_id || ""}
                          onChange={(e) => (u.bodyshape_id = e.target.value)}
                        >
                          <option value="">—</option>
                          {shapes.map((s) => (
                            <option key={s.bodyshape_id} value={s.bodyshape_id}>
                              {s.shape_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        shapeName(u.bodyshape_id)
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <button className="btn" onClick={() => saveUser(u)}>
                          Save
                        </button>
                      ) : (
                        <button
                          className="btn"
                          onClick={() => setUEdit(u.user_id)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn"
                        onClick={() => deleteUser(u.user_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CATALOG */}
      {tab === "catalog" && (
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}
        >
          <div className="card">
            <h3 className="sectionTitle">Categories</h3>
            <ul>
              {categories.map((c) => (
                <li key={c.category_id}>{c.category_name}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="sectionTitle">Suppliers</h3>
            <ul>
              {suppliers.map((s) => (
                <li key={s.supplier_id}>{s.supplier_name}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="sectionTitle">Bodyshapes</h3>
            <ul>
              {shapes.map((b) => (
                <li key={b.bodyshape_id}>{b.shape_name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      {tab === "messages" && (
        <div className="card">
          <div className={styles.msgHead}>
            <h2 className="sectionTitle">Messages</h2>
            <div className={styles.msgFilters}>
              <select
                className="select"
                value={msgFilter}
                onChange={(e) => setMsgFilter(e.target.value)}
              >
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="all">All</option>
              </select>
              <button className="btn" onClick={() => loadMessages()}>
                Refresh
              </button>
            </div>
          </div>

          {msgLoading ? (
            <div style={{ padding: 8 }}>Loading…</div>
          ) : (
            <table className={styles.msgTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td>#{m.id}</td>
                    <td>
                      <div className={styles.msgFrom}>
                        <b>{m.name}</b>
                        <div className={styles.msgEmail}>{m.email}</div>
                      </div>
                    </td>
                    <td className={styles.msgSubject} title={m.subject}>
                      {m.subject}
                    </td>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                    <td>
                      <span
                        className={
                          m.status === "resolved"
                            ? styles.pillResolved
                            : styles.pillOpen
                        }
                      >
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn" onClick={() => openMessage(m)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", color: "var(--muted)" }}
                    >
                      No messages
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {selectedMsg && (
            <>
              <div
                className={styles.msgBackdrop}
                onClick={() => setSelectedMsg(null)}
              />
              <div className={styles.msgDrawer} role="dialog" aria-modal="true">
                <div className={styles.msgDrawerHead}>
                  <div>
                    <div className={styles.msgDrawerTitle}>
                      #{selectedMsg.id} — {selectedMsg.subject}
                    </div>
                    <div className={styles.msgDrawerMeta}>
                      From: <b>{selectedMsg.name}</b> &lt;{selectedMsg.email}
                      &gt; · {new Date(selectedMsg.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button className="btn" onClick={() => setSelectedMsg(null)}>
                    Close
                  </button>
                </div>

                <div className={styles.msgBody}>
                  <label className={styles.label}>Message</label>
                  <div className={styles.msgText}>{selectedMsg.message}</div>

                  <div className={styles.row}>
                    <div className={styles.col}>
                      <label className={styles.label}>Status</label>
                      <select
                        className="select"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="open">open</option>
                        <option value="resolved">resolved</option>
                      </select>
                    </div>
                    <div className={styles.col}>
                      <label className={styles.label}>Quick reply</label>
                      <a
                        className="btn"
                        href={`mailto:${encodeURIComponent(
                          selectedMsg.email
                        )}?subject=${encodeURIComponent(
                          "Re: " + (selectedMsg.subject || "")
                        )}`}
                      >
                        Reply via email
                      </a>
                    </div>
                  </div>

                  <label className={styles.label}>Admin note</label>
                  <textarea
                    className="textarea"
                    rows={5}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Internal note…"
                  />

                  <div className={styles.msgDrawerActions}>
                    <button className="btn" onClick={saveMessage}>
                      Save changes
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setEditStatus("resolved");
                        saveMessage();
                      }}
                    >
                      Mark as resolved
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
