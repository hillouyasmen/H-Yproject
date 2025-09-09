// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../styles/AdminDashboard.module.css';
import api from '../api';
import { useAuth } from '../contexts/AuthContext.jsx';
import { notify } from '../components/Notifications.jsx';
import { normalizeImageUrl } from '../lib/img.js';
import useEvents from '../hooks/useEvents.js';

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
} from 'recharts';

/* =========================
   Constants / helpers
========================= */

const PINK = '#d63384';
const COLORS = [
  '#d63384',
  '#ff7ab8',
  '#e91e63',
  '#fd8bb6',
  '#ffb3d1',
  '#8e3b6b',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}
function ymd(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
const money = n => '$' + Number(n || 0).toFixed(2);

/* =========================
   Component
========================= */

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = !!user && user.role === 'admin';

  // SSE (must be unconditional)
  const { events, connected } = useEvents({ enabled: isAdmin, max: 150 });

  // Tabs
  const [tab, setTab] = useState('analytics'); // analytics | products | variations | orders | users | catalog | messages | settings
  const [loading, setLoading] = useState(true);

  // Search
  const [q, setQ] = useState('');

  // Data
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [shapes, setShapes] = useState([]);

  // ===== Business Settings (no dates) =====
  const [publicSettings, setPublicSettings] = useState({
    site_name: '',
    tax_percent: 0,
    shipping_flat: 0,
    free_shipping_threshold: 0,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Badges
  const [badges, setBadges] = useState({ orders: 0, messages: 0, products: 0 });
  const lastIdxRef = useRef(0);

  // Local-only preferences
  const [prefs, setPrefs] = useState({
    lowStockThreshold: 3,
    autoRefreshMin: 0,
  });

  // Forms
  const emptyP = {
    product_name: '',
    category_id: '',
    supplier_id: '',
    bodyshape_id: '',
    description: '',
    rating: '',
    image_url: '',
  };
  const [pForm, setPForm] = useState(emptyP);
  const [pEditId, setPEditId] = useState(null);

  const [vForm, setVForm] = useState({
    color: '',
    size: '',
    price: '',
    quantity: '',
  });
  const [uEdit, setUEdit] = useState(null);

  // Messages
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgFilter, setMsgFilter] = useState('open'); // open | resolved | all
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editStatus, setEditStatus] = useState('open');

  // ====== Analytics range ======
  const [range, setRange] = useState('30d'); // Today | 7d | 14d | 30d | 90d | YTD | All | Custom
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  /* =========================
     Effects (stable order)
  ========================= */

  // Load local prefs
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('adm_prefs') || '{}');
      setPrefs(p => ({ ...p, ...saved }));
    } catch {}
  }, []);

  // Load business settings (admin route)
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const { data } = await api.get('/settings'); // requires admin
        setPublicSettings({
          site_name: data?.site_name || '',
          tax_percent: Number(data?.tax_percent || 0),
          shipping_flat: Number(data?.shipping_flat || 0),
          free_shipping_threshold: Number(data?.free_shipping_threshold || 0),
        });
      } catch {
        // keep defaults
      }
    })();
  }, [isAdmin]);

  // Live badges from events
  useEffect(() => {
    if (!isAdmin || !Array.isArray(events)) return;
    for (let i = lastIdxRef.current; i < events.length; i++) {
      const ev = events[i];
      switch (ev?.type) {
        case 'order.created':
        case 'order.paid':
          setBadges(b => ({ ...b, orders: b.orders + 1 }));
          break;
        case 'contact.new':
        case 'contact.created':
          setBadges(b => ({ ...b, messages: b.messages + 1 }));
          break;
        case 'stock.low':
          setBadges(b => ({ ...b, products: (b.products || 0) + 1 }));
          break;
        default:
          break;
      }
    }
    lastIdxRef.current = events.length;
  }, [events, isAdmin]);

  // Clear badge when opening tab
  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'orders' && badges.orders)
      setBadges(b => ({ ...b, orders: 0 }));
    if (tab === 'messages' && badges.messages)
      setBadges(b => ({ ...b, messages: 0 }));
    if (tab === 'products' && badges.products)
      setBadges(b => ({ ...b, products: 0 }));
  }, [tab, isAdmin, badges.orders, badges.messages, badges.products]);

  // Boot load
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Auto refresh
  useEffect(() => {
    if (!isAdmin) return;
    if (!prefs.autoRefreshMin || Number(prefs.autoRefreshMin) <= 0) return;
    const ms = Number(prefs.autoRefreshMin) * 60_000;
    const id = setInterval(() => {
      reloadAll();
    }, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, prefs.autoRefreshMin]);

  useEffect(() => {
    if (tab === 'messages' && isAdmin) loadMessages();
  }, [tab, isAdmin]);
  useEffect(() => {
    if (tab === 'messages' && isAdmin) loadMessages(msgFilter);
  }, [msgFilter, tab, isAdmin]);

  useEffect(() => {
    if (tab === 'variations' && !selectedProduct && products.length) {
      setSelectedProduct(products[0]);
    }
  }, [tab, products, selectedProduct]);

  useEffect(() => {
    if (selectedProduct) loadVariations(selectedProduct.product_id);
  }, [selectedProduct]);

  /* =========================
     Loaders / CRUD
  ========================= */

  const reloadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadUsers(),
        loadCatalog(),
      ]);
      notify.success('Data reloaded');
    } finally {
      setLoading(false);
    }
  };

  const savePrefs = () => {
    localStorage.setItem('adm_prefs', JSON.stringify(prefs));
    notify.success('Local preferences saved');
  };

  const clearBadges = () => {
    setBadges({ orders: 0, messages: 0, products: 0 });
    notify.info('Badges cleared');
  };

  const loadProducts = () =>
    api.get('/products').then(({ data }) => setProducts(data));
  const loadOrders = () =>
    api.get('/orders').then(({ data }) => setOrders(data));
  const loadUsers = () => api.get('/users').then(({ data }) => setUsers(data));
  const loadCatalog = async () => {
    const [c, s, b] = await Promise.all([
      api.get('/categories'),
      api.get('/suppliers'),
      api.get('/bodyshapes'),
    ]);
    setCategories(c.data);
    setSuppliers(s.data);
    setShapes(b.data);
  };
  const loadVariations = async pid => {
    const { data } = await api.get(`/variations/product/${pid}`);
    setVariations(data);
  };

  // Messages
  const loadMessages = async (status = msgFilter) => {
    setMsgLoading(true);
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      const { data } = await api.get('/contact', { params });
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      notify.error('Failed to load messages');
    } finally {
      setMsgLoading(false);
    }
  };
  const openMessage = m => {
    setSelectedMsg(m);
    setEditNote(m.admin_note || '');
    setEditStatus(m.status || 'open');
  };
  const saveMessage = async () => {
    if (!selectedMsg) return;
    try {
      await api.put(`/contact/${selectedMsg.id}`, {
        admin_note: editNote,
        status: editStatus,
      });
      notify.success('Message updated');
      setSelectedMsg(null);
      loadMessages();
    } catch {
      notify.error('Update failed');
    }
  };

  // Images
  const uploadImage = async file => {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  };
  const onImgUrlChange = e => {
    let v = e.target.value.trim();
    const m = v.replace(/\\/g, '/').match(/uploads\/([^/]+)$/i);
    if (m) {
      const origin =
        import.meta.env.VITE_FILES_ORIGIN || 'http://localhost:5000';
      v = `${origin}/uploads/${m[1]}`;
    }
    setPForm({ ...pForm, image_url: v });
  };

  // Products CRUD
  const addProduct = async e => {
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
      await api.post('/products', payload);
      notify.success('Product added');
      setPForm(emptyP);
      loadProducts();
      setTab('products');
    } catch {
      notify.error('Failed to add product');
    }
  };
  const startEditProduct = p => {
    setPEditId(p.product_id);
    setPForm({
      product_name: p.product_name || '',
      category_id: p.category_id || '',
      supplier_id: p.supplier_id || '',
      bodyshape_id: p.bodyshape_id || '',
      description: p.description || '',
      rating: p.rating || '',
      image_url: p.image_url || '',
    });
  };
  const saveEditProduct = async id => {
    try {
      await api.put(`/products/${id}`, pForm);
      notify.success('Product updated');
      setPEditId(null);
      setPForm(emptyP);
      loadProducts();
    } catch {
      notify.error('Update failed');
    }
  };
  const deleteProduct = async id => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      notify.success('Product deleted');
      if (selectedProduct?.product_id === id) setSelectedProduct(null);
      loadProducts();
    } catch {
      notify.error('Delete failed');
    }
  };

  // Variations CRUD
  const addVariation = async e => {
    e.preventDefault();
    if (!selectedProduct) return notify.error('Select a product first');
    try {
      await api.post('/variations', {
        product_id: selectedProduct.product_id,
        ...vForm,
        price: Number(vForm.price),
        quantity: Number(vForm.quantity || 0),
      });
      notify.success('Variation added');
      setVForm({ color: '', size: '', price: '', quantity: '' });
      loadVariations(selectedProduct.product_id);
    } catch {
      notify.error('Add variation failed');
    }
  };
  const updateVariation = async v => {
    try {
      await api.put('/variations', {
        product_id: v.product_id,
        color: v.color,
        size: v.size,
        price: Number(v.price),
        quantity: Number(v.quantity),
      });
      notify.success('Saved');
      loadVariations(v.product_id);
    } catch {
      notify.error('Save failed');
    }
  };
  const adjustStock = async (v, delta) => {
    try {
      await api.patch('/variations/stock', {
        product_id: v.product_id,
        color: v.color,
        size: v.size,
        delta,
      });
      loadVariations(v.product_id);
    } catch {
      notify.error('Stock update failed');
    }
  };
  const deleteVariation = async v => {
    if (!confirm('Delete this variation?')) return;
    try {
      await api.delete('/variations', {
        data: { product_id: v.product_id, color: v.color, size: v.size },
      });
      notify.success('Deleted');
      loadVariations(v.product_id);
    } catch {
      notify.error('Delete failed');
    }
  };

  // Users
  const saveUser = async u => {
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
      notify.success('User updated');
      setUEdit(null);
      loadUsers();
    } catch {
      notify.error('Update failed');
    }
  };
  const deleteUser = async id => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      notify.success('User deleted');
      loadUsers();
    } catch {
      notify.error('Delete failed');
    }
  };

  /* =========================
     Helpers / selectors
  ========================= */

  const byId = (arr, idField, id) =>
    arr.find(x => String(x[idField]) === String(id));
  const catName = id =>
    byId(categories, 'category_id', id)?.category_name || '-';
  const supName = id =>
    byId(suppliers, 'supplier_id', id)?.supplier_name || '-';
  const shapeName = id => byId(shapes, 'bodyshape_id', id)?.shape_name || 'All';

  const _inc = (v, term) =>
    !term
      ? true
      : String(v ?? '')
          .toLowerCase()
          .includes(String(term).toLowerCase());

  const filteredProducts = useMemo(
    () =>
      products.filter(
        p =>
          _inc(p.product_name, q) ||
          _inc(p.description, q) ||
          _inc(catName(p.category_id), q) ||
          _inc(supName(p.supplier_id), q) ||
          _inc(shapeName(p.bodyshape_id), q),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, q, categories, suppliers, shapes],
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        o =>
          _inc(o.order_id, q) ||
          _inc(o.username, q) ||
          _inc(o.status, q) ||
          _inc(o.total_amount, q) ||
          _inc(new Date(o.order_date).toLocaleString(), q),
      ),
    [orders, q],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter(
        u =>
          _inc(u.user_id, q) ||
          _inc(u.username, q) ||
          _inc(u.email, q) ||
          _inc(u.role, q) ||
          _inc(shapeName(u.bodyshape_id), q),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, q, shapes],
  );

  const filteredMessages = useMemo(
    () =>
      messages.filter(
        m =>
          _inc(m.id, q) ||
          _inc(m.name, q) ||
          _inc(m.email, q) ||
          _inc(m.subject, q) ||
          _inc(m.status, q) ||
          _inc(m.message, q),
      ),
    [messages, q],
  );

  // Activity feed for variations (from SSE)
  const varFeed = useMemo(() => {
    const types = new Set([
      'variation.added',
      'variation.updated',
      'variation.deleted',
      'stock.delta',
      'stock.low',
    ]);
    return (events || [])
      .filter(
        e =>
          types.has(e.type) &&
          (!selectedProduct ||
            e?.payload?.product_id === selectedProduct.product_id),
      )
      .slice(0, 10);
  }, [events, selectedProduct]);

  function renderActivity(ev) {
    const p = ev?.payload || {};
    const who = [p.color, p.size].filter(Boolean).join('/');
    switch (ev.type) {
      case 'stock.delta':
        return `Stock ${Number(p.delta) > 0 ? 'increased' : 'decreased'} for #${
          p.product_id
        } ${who} → ${p.quantity}`;
      case 'stock.low':
        return `Low stock for #${p.product_id} ${who} (${p.quantity})`;
      case 'variation.added':
        return `Variation added #${p.product_id} ${who} @ ${p.price}`;
      case 'variation.updated':
        return `Variation updated #${p.product_id} ${who} @ ${p.price}, qty ${p.quantity}`;
      case 'variation.deleted':
        return `Variation deleted #${p.product_id} ${who}`;
      default:
        return ev.type;
    }
  }

  // Analytics KPIs (we won't render total users/customers tiles)
  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const customers = totalUsers - admins;

    const paidish = new Set(['paid', 'shipped']);
    const agg = orders.reduce(
      (a, o) => {
        const amt = Number(o.total_amount || 0);
        a.count += 1;
        a.byStatus[o.status] = (a.byStatus[o.status] || 0) + 1;
        if (paidish.has(String(o.status))) a.revenue += amt;
        a.biggestOrder = Math.max(a.biggestOrder, amt);
        return a;
      },
      { count: 0, revenue: 0, byStatus: {}, biggestOrder: 0 },
    );

    return {
      totalUsers,
      customers,
      ordersCount: agg.count,
      revenue: agg.revenue,
      avgOrder: agg.count ? agg.revenue / agg.count : 0,
      byStatus: agg.byStatus,
      biggestOrder: agg.biggestOrder,
    };
  }, [users, orders]);

  // Date window for analytics
  const analyticsWindow = useMemo(() => {
    const now = new Date();
    const to = ymd(now);
    let from;
    switch (range) {
      case 'Today': {
        from = ymd(now);
        break;
      }
      case '7d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        from = ymd(d);
        break;
      }
      case '14d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 13);
        from = ymd(d);
        break;
      }
      case '30d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        from = ymd(d);
        break;
      }
      case '90d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 89);
        from = ymd(d);
        break;
      }
      case 'YTD': {
        const d = new Date(now.getFullYear(), 0, 1);
        from = ymd(d);
        break;
      }
      case 'All':
        from = '1970-01-01';
        break;
      case 'Custom':
        return { from: customFrom || '1970-01-01', to: customTo || to };
      default: {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        from = ymd(d);
      }
    }
    return { from, to };
  }, [range, customFrom, customTo]);

  const ordersInWindow = useMemo(() => {
    const fromT = new Date(analyticsWindow.from + 'T00:00:00Z').getTime();
    const toT = new Date(analyticsWindow.to + 'T23:59:59Z').getTime();
    return orders.filter(o => {
      const t = new Date(o.order_date).getTime();
      return t >= fromT && t <= toT;
    });
  }, [orders, analyticsWindow]);

  const revenueSeries = useMemo(() => {
    const paidish = new Set(['paid', 'shipped']);
    const days = [];
    {
      const start = new Date(analyticsWindow.from);
      const end = new Date(analyticsWindow.to);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(ymd(d));
      }
    }
    const byDay = Object.fromEntries(days.map(d => [d, 0]));
    for (const o of ordersInWindow) {
      if (!o?.order_date) continue;
      if (!paidish.has(String(o.status))) continue;
      const d = ymd(o.order_date);
      if (byDay[d] !== undefined) byDay[d] += Number(o.total_amount || 0);
    }
    return days.map(d => ({ day: d, revenue: byDay[d] }));
  }, [ordersInWindow, analyticsWindow]);

  const statusData = useMemo(() => {
    const keys = ['pending', 'paid', 'shipped', 'cancelled'];
    const counts = keys.reduce((m, k) => ((m[k] = 0), m), {});
    for (const o of ordersInWindow)
      counts[o.status] = (counts[o.status] || 0) + 1;
    return keys.map(k => ({ status: k, count: counts[k] || 0 }));
  }, [ordersInWindow]);

  const bodyshapeData = useMemo(() => {
    const map = {};
    for (const u of users) {
      const k = u.shape_name || '—';
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [users]);

  /* =========================
     UI bits
  ========================= */

  const badgeStyle = {
    marginLeft: 8,
    minWidth: 18,
    height: 18,
    padding: '0 6px',
    borderRadius: 999,
    background: '#e11d48',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  function TabButton({ label, active, onClick, count = 0 }) {
    return (
      <button
        className={`${styles.tab} ${active ? styles.active : ''}`}
        onClick={onClick}
      >
        {label}
        {count > 0 && <span style={badgeStyle}>{count}</span>}
      </button>
    );
  }

  const ProductCard = ({ p }) => {
    const editing = pEditId === p.product_id;
    const imgSrc =
      normalizeImageUrl(editing ? pForm.image_url : p.image_url) ||
      'https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop';

    return (
      <div className={`card ${styles.productCard}`}>
        <img src={imgSrc} className={styles.pImg} alt={p.product_name} />
        {!editing ? (
          <>
            <div className={styles.pTitle}>{p.product_name}</div>
            <div className={styles.pMeta}>
              <span className='badge'>{shapeName(p.bodyshape_id)}</span>
              <span className='badge'>{catName(p.category_id)}</span>
              <span className='badge'>{supName(p.supplier_id)}</span>
            </div>
            <div className={styles.actions}>
              <button
                className='btn'
                onClick={() => {
                  setSelectedProduct(p);
                  setTab('variations');
                }}
              >
                Variations
              </button>
              <button className='btn' onClick={() => startEditProduct(p)}>
                Edit
              </button>
              <button
                className='btn'
                onClick={() => deleteProduct(p.product_id)}
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              className='input'
              value={pForm.product_name}
              onChange={e =>
                setPForm({ ...pForm, product_name: e.target.value })
              }
              placeholder='Product name'
            />
            <input
              className='input'
              style={{ marginTop: 8 }}
              value={pForm.image_url}
              onChange={onImgUrlChange}
              placeholder='Image URL'
            />
            <input
              type='file'
              accept='image/*'
              onChange={async e => {
                if (e.target.files?.[0]) {
                  const url = await uploadImage(e.target.files[0]);
                  setPForm({ ...pForm, image_url: url });
                  notify.success('Image uploaded');
                }
              }}
              style={{ marginTop: 8 }}
            />
            <div className={styles.triple}>
              <select
                className='select'
                value={pForm.category_id}
                onChange={e =>
                  setPForm({ ...pForm, category_id: e.target.value })
                }
              >
                <option value=''>Category</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
              <select
                className='select'
                value={pForm.supplier_id}
                onChange={e =>
                  setPForm({ ...pForm, supplier_id: e.target.value })
                }
              >
                <option value=''>Supplier</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name}
                  </option>
                ))}
              </select>
              <select
                className='select'
                value={pForm.bodyshape_id}
                onChange={e =>
                  setPForm({ ...pForm, bodyshape_id: e.target.value })
                }
              >
                <option value=''>Bodyshape</option>
                {shapes.map(s => (
                  <option key={s.bodyshape_id} value={s.bodyshape_id}>
                    {s.shape_name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className='textarea'
              style={{ marginTop: 8 }}
              value={pForm.description}
              onChange={e =>
                setPForm({ ...pForm, description: e.target.value })
              }
              placeholder='Description'
            />
            <div className={styles.actions}>
              <button
                className='btn'
                onClick={() => saveEditProduct(p.product_id)}
              >
                Save
              </button>
              <button
                className='btn'
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

  // Guards
  if (!isAdmin) return <div className='card'>Admins only.</div>;
  if (loading) return <div className='card'>Loading dashboard…</div>;

  const liveDot = {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: connected ? '#16a34a' : '#9ca3af',
    display: 'inline-block',
    marginRight: 6,
  };

  /* =========================
     Render
  ========================= */

  return (
    <div className={styles.wrap}>
      {/* Tabs + Search + Live */}
      <div
        className={styles.tabs}
        style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <TabButton
            label='Analytics'
            active={tab === 'analytics'}
            onClick={() => setTab('analytics')}
          />
          <TabButton
            label='Products'
            active={tab === 'products'}
            onClick={() => setTab('products')}
            count={badges.products}
          />
          <TabButton
            label='Variations'
            active={tab === 'variations'}
            onClick={() => setTab('variations')}
          />
          <TabButton
            label='Orders'
            active={tab === 'orders'}
            onClick={() => setTab('orders')}
            count={badges.orders}
          />
          <TabButton
            label='Users'
            active={tab === 'users'}
            onClick={() => setTab('users')}
          />
          <TabButton
            label='Catalog'
            active={tab === 'catalog'}
            onClick={() => setTab('catalog')}
          />
          <TabButton
            label='Messages'
            active={tab === 'messages'}
            onClick={() => setTab('messages')}
            count={badges.messages}
          />
          <TabButton
            label='Settings'
            active={tab === 'settings'}
            onClick={() => setTab('settings')}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginLeft: 'auto',
          }}
        >
          <div
            title={
              connected ? 'Live updates connected' : 'Live updates offline'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280',
              fontWeight: 700,
            }}
          >
            <span style={liveDot} /> {connected ? 'Live' : 'Offline'}
          </div>
          <input
            className='input'
            style={{ minWidth: 240 }}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Search ${tab}…`}
          />
          {q && (
            <button
              className='btn'
              onClick={() => setQ('')}
              title='Clear search'
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className={styles.analytics}>
          {/* Range presets */}
          <div className={styles.rangeRow}>
            {['Today', '7d', '14d', '30d', '90d', 'YTD', 'All'].map(r => (
              <button
                key={r}
                className={`${styles.rangeBtn} ${
                  range === r ? styles.rangeActive : ''
                }`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
            <button
              className={`${styles.rangeBtn} ${
                range === 'Custom' ? styles.rangeActive : ''
              }`}
              onClick={() => setRange('Custom')}
            >
              Custom
            </button>
            {range === 'Custom' && (
              <div className={styles.customRange}>
                <input
                  type='date'
                  className='input'
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                />
                <span>→</span>
                <input
                  type='date'
                  className='input'
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* KPIs (removed Total Users & Customers) */}
          <div className={styles.kpis}>
            <button
              type='button'
              className={`${styles.kpi} ${styles.kpiLink}`}
              onClick={() => setTab('orders')}
            >
              <div className={styles.kpiTitle}>Orders</div>
              <div className={styles.kpiValue}>{kpis.ordersCount}</div>
            </button>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Revenue</div>
              <div className={styles.kpiValue}>{money(kpis.revenue)}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Avg Order</div>
              <div className={styles.kpiValue}>{money(kpis.avgOrder)}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiTitle}>Biggest Order</div>
              <div className={styles.kpiValue}>{money(kpis.biggestOrder)}</div>
            </div>
          </div>

          {/* Charts */}
          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Revenue</div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id='revGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor={PINK} stopOpacity={0.6} />
                        <stop
                          offset='100%'
                          stopColor={PINK}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='day' tickFormatter={d => d.slice(5)} />
                    <YAxis />
                    <Tooltip formatter={v => money(v)} />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      stroke={PINK}
                      fill='url(#revGrad)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Orders by status</div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='status' />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey='count' fill={PINK} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Users by bodyshape</div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={bodyshapeData}
                      dataKey='value'
                      nameKey='name'
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
      {tab === 'products' && (
        <div className={styles.grid2}>
          <div className='card'>
            <h2 className='sectionTitle'>Add Product</h2>
            <form onSubmit={addProduct}>
              <input
                className='input'
                placeholder='Product name'
                value={pForm.product_name}
                onChange={e =>
                  setPForm({ ...pForm, product_name: e.target.value })
                }
              />
              <input
                className='input'
                style={{ marginTop: 8 }}
                placeholder='Image URL'
                value={pForm.image_url}
                onChange={onImgUrlChange}
              />
              <input
                type='file'
                accept='image/*'
                onChange={async e => {
                  if (e.target.files?.[0]) {
                    const url = await uploadImage(e.target.files[0]);
                    setPForm({ ...pForm, image_url: url });
                    notify.success('Image uploaded');
                  }
                }}
                style={{ marginTop: 8 }}
              />
              <div className={styles.triple}>
                <select
                  className='select'
                  value={pForm.category_id}
                  onChange={e =>
                    setPForm({ ...pForm, category_id: e.target.value })
                  }
                >
                  <option value=''>Category</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
                <select
                  className='select'
                  value={pForm.supplier_id}
                  onChange={e =>
                    setPForm({ ...pForm, supplier_id: e.target.value })
                  }
                >
                  <option value=''>Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
                <select
                  className='select'
                  value={pForm.bodyshape_id}
                  onChange={e =>
                    setPForm({ ...pForm, bodyshape_id: e.target.value })
                  }
                >
                  <option value=''>Bodyshape</option>
                  {shapes.map(s => (
                    <option key={s.bodyshape_id} value={s.bodyshape_id}>
                      {s.shape_name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className='textarea'
                style={{ marginTop: 8 }}
                placeholder='Description'
                value={pForm.description}
                onChange={e =>
                  setPForm({ ...pForm, description: e.target.value })
                }
              />
              <input
                className='input'
                style={{ marginTop: 8 }}
                placeholder='Rating'
                value={pForm.rating}
                onChange={e => setPForm({ ...pForm, rating: e.target.value })}
              />
              <button className='btn' style={{ marginTop: 12 }}>
                Create
              </button>
            </form>
          </div>

          <div>
            <div
              className='sectionTitle'
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <h2 className='sectionTitle' style={{ margin: 0 }}>
                Products
              </h2>
              {q && <span className='badge'>Filtered</span>}
            </div>
            <div className={styles.cards}>
              {filteredProducts.map(p => (
                <ProductCard key={p.product_id} p={p} />
              ))}
              {filteredProducts.length === 0 && (
                <div
                  className='card'
                  style={{ padding: 16, color: 'var(--muted)' }}
                >
                  No products matched your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VARIATIONS */}
      {tab === 'variations' && (
        <div className='card'>
          <h2 className='sectionTitle'>Product Variations</h2>

          <div className={styles.selectorRow}>
            <select
              className='select'
              value={selectedProduct?.product_id || ''}
              onChange={e =>
                setSelectedProduct(
                  products.find(p => p.product_id === Number(e.target.value)),
                )
              }
            >
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  #{p.product_id} — {p.product_name}
                </option>
              ))}
            </select>
            <div className='badge'>
              {selectedProduct ? shapeName(selectedProduct.bodyshape_id) : ''}
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
              {variations.map(v => {
                const isLow =
                  Number(v.quantity) <= Number(prefs.lowStockThreshold);
                return (
                  <tr
                    key={`${v.color}-${v.size}`}
                    className={isLow ? styles.lowRow : undefined}
                    title={isLow ? 'Low stock' : undefined}
                  >
                    <td>{v.color}</td>
                    <td>{v.size}</td>
                    <td>
                      <input
                        className={styles.cellInput}
                        defaultValue={v.price}
                        onChange={e => (v.price = e.target.value)}
                      />
                    </td>
                    <td className={isLow ? styles.qtyWarn : undefined}>
                      <input
                        className={styles.cellInput}
                        defaultValue={v.quantity}
                        onChange={e => (v.quantity = e.target.value)}
                      />
                    </td>
                    <td className={styles.stockBtns}>
                      <button
                        className='btn'
                        onClick={() => adjustStock(v, +1)}
                      >
                        +
                      </button>
                      <button
                        className='btn'
                        onClick={() => adjustStock(v, -1)}
                      >
                        -
                      </button>
                    </td>
                    <td>
                      <button
                        className='btn'
                        onClick={() => updateVariation(v)}
                      >
                        Save
                      </button>
                    </td>
                    <td>
                      <button
                        className='btn'
                        onClick={() => deleteVariation(v)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {variations.length === 0 && (
                <tr>
                  <td
                    colSpan='7'
                    style={{ textAlign: 'center', color: 'var(--muted)' }}
                  >
                    No variations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form className={styles.addVar} onSubmit={addVariation}>
            <input
              className='input'
              placeholder='Color'
              value={vForm.color}
              onChange={e => setVForm({ ...vForm, color: e.target.value })}
            />
            <input
              className='input'
              placeholder='Size'
              value={vForm.size}
              onChange={e => setVForm({ ...vForm, size: e.target.value })}
            />
            <input
              className='input'
              placeholder='Price'
              value={vForm.price}
              onChange={e => setVForm({ ...vForm, price: e.target.value })}
            />
            <input
              className='input'
              placeholder='Quantity'
              value={vForm.quantity}
              onChange={e => setVForm({ ...vForm, quantity: e.target.value })}
            />
            <button className='btn'>Add variation</button>
          </form>

          {/* Latest activity */}
          <div className={styles.activity}>
            <div className={styles.activityTitle}>Latest activity</div>
            <ul className={styles.activityList}>
              {varFeed.map(ev => (
                <li key={ev.id} className={styles.activityItem}>
                  <span className={styles.activityDot} data-type={ev.type} />
                  <span className={styles.activityText}>
                    {renderActivity(ev)}
                  </span>
                  <span className={styles.activityTime}>
                    {new Date(ev.ts || Date.now()).toLocaleString()}
                  </span>
                </li>
              ))}
              {varFeed.length === 0 && (
                <li className={styles.activityEmpty}>No activity yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className='card'>
          <div
            className='sectionTitle'
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <h2 className='sectionTitle' style={{ margin: 0 }}>
              Orders
            </h2>
            {q && <span className='badge'>Filtered</span>}
            <button
              className='btn'
              style={{ marginLeft: 'auto' }}
              onClick={() => window.print()}
              title='Print orders table'
            >
              Print
            </button>
          </div>
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
              {filteredOrders.map(o => (
                <tr key={o.order_id}>
                  <td>{o.order_id}</td>
                  <td>{o.username}</td>
                  <td>{new Date(o.order_date).toLocaleString()}</td>
                  <td>
                    <select
                      className='select'
                      defaultValue={o.status}
                      onChange={e => (o.status = e.target.value)}
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
                      className='btn'
                      onClick={async () => {
                        await api.put(`/orders/${o.order_id}`, {
                          status: o.status,
                        });
                        notify.success('Status updated');
                        loadOrders();
                      }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan='6'
                    style={{ textAlign: 'center', color: 'var(--muted)' }}
                  >
                    No orders matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className='card'>
          <div
            className='sectionTitle'
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <h2 className='sectionTitle' style={{ margin: 0 }}>
              Users
            </h2>
            {q && <span className='badge'>Filtered</span>}
          </div>
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
              {filteredUsers.map(u => {
                const editing = uEdit === u.user_id;
                return (
                  <tr key={u.user_id}>
                    <td>{u.user_id}</td>
                    <td>
                      {editing ? (
                        <input
                          className={styles.cellInput}
                          defaultValue={u.username}
                          onChange={e => (u.username = e.target.value)}
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
                          onChange={e => (u.email = e.target.value)}
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <select
                          className='select'
                          defaultValue={u.role}
                          onChange={e => (u.role = e.target.value)}
                        >
                          <option value='customer'>customer</option>
                          <option value='admin'>admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <select
                          className='select'
                          defaultValue={u.bodyshape_id || ''}
                          onChange={e => (u.bodyshape_id = e.target.value)}
                        >
                          <option value=''>—</option>
                          {shapes.map(s => (
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
                        <button className='btn' onClick={() => saveUser(u)}>
                          Save
                        </button>
                      ) : (
                        <button
                          className='btn'
                          onClick={() => setUEdit(u.user_id)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        className='btn'
                        onClick={() => deleteUser(u.user_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan='7'
                    style={{ textAlign: 'center', color: 'var(--muted)' }}
                  >
                    No users matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CATALOG */}
      {tab === 'catalog' && (
        <div
          className='grid'
          style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 20 }}
        >
          <CategoriesManager
            categories={categories}
            notify={notify}
            uploadImage={uploadImage}
            normalizeImageUrl={normalizeImageUrl}
            api={api}
            reload={loadCatalog}
          />
          <div className='card'>
            <h3 className='sectionTitle'>Suppliers</h3>
            <ul>
              {suppliers.map(s => (
                <li key={s.supplier_id}>{s.supplier_name}</li>
              ))}
            </ul>
          </div>
          <div className='card'>
            <h3 className='sectionTitle'>Bodyshapes</h3>
            <ul>
              {shapes.map(b => (
                <li key={b.bodyshape_id}>{b.shape_name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SETTINGS — Business settings */}
      {tab === 'settings' && (
        <div className='card'>
          <h2 className='sectionTitle'>Business Settings</h2>

          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(2, minmax(0, 420px))',
            }}
          >
            <div>
              <label className={styles.label}>Site name</label>
              <input
                className='input'
                value={publicSettings.site_name}
                onChange={e =>
                  setPublicSettings(s => ({ ...s, site_name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={styles.label}>Tax percent (%)</label>
              <input
                type='number'
                step='0.01'
                min='0'
                className='input'
                value={publicSettings.tax_percent}
                onChange={e =>
                  setPublicSettings(s => ({
                    ...s,
                    tax_percent: Number(e.target.value),
                  }))
                }
              />
              <div className='badge' style={{ marginTop: 6 }}>
                Applied on orders at checkout.
              </div>
            </div>

            <div>
              <label className={styles.label}>Shipping flat ($)</label>
              <input
                type='number'
                step='0.01'
                min='0'
                className='input'
                value={publicSettings.shipping_flat}
                onChange={e =>
                  setPublicSettings(s => ({
                    ...s,
                    shipping_flat: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className={styles.label}>
                Free shipping threshold ($)
              </label>
              <input
                type='number'
                step='0.01'
                min='0'
                className='input'
                value={publicSettings.free_shipping_threshold}
                onChange={e =>
                  setPublicSettings(s => ({
                    ...s,
                    free_shipping_threshold: Number(e.target.value),
                  }))
                }
              />
              <div className='badge' style={{ marginTop: 6 }}>
                If subtotal ≥ threshold, shipping becomes $0.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              className='btn'
              disabled={settingsSaving}
              onClick={async () => {
                setSettingsSaving(true);
                try {
                  const payload = {
                    site_name: (publicSettings.site_name || '').trim(),
                    tax_percent: Number(publicSettings.tax_percent) || 0,
                    shipping_flat: Number(publicSettings.shipping_flat) || 0,
                    free_shipping_threshold:
                      Number(publicSettings.free_shipping_threshold) || 0,
                  };
                  await api.put('/settings', payload);
                  notify.success('Settings saved');
                } catch {
                  notify.error('Failed to save settings');
                } finally {
                  setSettingsSaving(false);
                }
              }}
            >
              {settingsSaving ? 'Saving…' : 'Save'}
            </button>

            <button className='btn' onClick={reloadAll}>
              Reload data
            </button>
            <button className='btn' onClick={clearBadges}>
              Clear badges
            </button>

            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#6b7280',
                fontWeight: 700,
              }}
            >
              <span style={liveDot} />{' '}
              {connected ? 'Live connected' : 'Live offline'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------
   Categories Manager (inline)
------------------------- */
function CategoriesManager({
  categories,
  notify,
  uploadImage,
  normalizeImageUrl,
  api,
  reload,
}) {
  const [catForm, setCatForm] = useState({ name: '', image_url: '' });
  const [catEditing, setCatEditing] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  const onCatImgUrlChange = e => {
    let v = e.target.value.trim();
    const m = v.replace(/\\/g, '/').match(/uploads\/([^/]+)$/i);
    if (m) {
      const origin =
        import.meta.env.VITE_FILES_ORIGIN || 'http://localhost:5000';
      v = `${origin}/uploads/${m[1]}`;
    }
    setCatForm(f => ({ ...f, image_url: v }));
  };

  const addCategory = async e => {
    e?.preventDefault();
    if (!catForm.name.trim()) return notify.error('Write a category name');
    setCatSaving(true);
    try {
      await api.post('/categories', {
        category_name: catForm.name.trim(),
        image_url: catForm.image_url || null,
      });
      notify.success('Category added');
      setCatForm({ name: '', image_url: '' });
      reload();
    } catch {
      notify.error('Add failed');
    } finally {
      setCatSaving(false);
    }
  };

  const startEditCategory = c =>
    setCatEditing({
      id: c.category_id,
      name: c.category_name || '',
      image_url: c.image_url || '',
    });
  const cancelEditCategory = () => setCatEditing(null);

  const saveEditCategory = async () => {
    if (!catEditing) return;
    setCatSaving(true);
    try {
      await api.put(`/categories/${catEditing.id}`, {
        category_name: catEditing.name,
        image_url: catEditing.image_url || null,
      });
      notify.success('Category updated');
      setCatEditing(null);
      reload();
    } catch {
      notify.error('Update failed');
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCategoryX = async id => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      notify.success('Category deleted');
      reload();
      if (catEditing?.id === id) setCatEditing(null);
    } catch {
      notify.error('Delete failed');
    }
  };

  return (
    <div className='card'>
      <h3 className='sectionTitle' style={{ marginBottom: 10 }}>
        Categories
      </h3>

      {/* Add new */}
      <form onSubmit={addCategory} style={{ display: 'grid', gap: 8 }}>
        <input
          className='input'
          placeholder='New category name'
          value={catForm.name}
          onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
        />
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            className='input'
            placeholder='Image URL (optional)'
            value={catForm.image_url}
            onChange={onCatImgUrlChange}
          />
          <input
            type='file'
            accept='image/*'
            onChange={async e => {
              if (e.target.files?.[0]) {
                const url = await uploadImage(e.target.files[0]);
                setCatForm(f => ({ ...f, image_url: url }));
                notify.success('Image uploaded');
              }
            }}
          />
        </div>
        <button className='btn' disabled={catSaving}>
          {catSaving ? 'Adding…' : 'Add Category'}
        </button>
      </form>

      {/* List + inline edit */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          marginTop: 12,
          display: 'grid',
          gap: 8,
        }}
      >
        {categories.map(c => {
          const editing = catEditing?.id === c.category_id;
          return (
            <li
              key={c.category_id}
              style={{
                display: 'grid',
                gridTemplateColumns: editing ? '1fr' : 'auto 1fr auto',
                alignItems: 'center',
                gap: 10,
                background: '#fff',
                border: '1px solid rgba(214, 51, 132, 0.12)',
                padding: 10,
                borderRadius: 12,
              }}
            >
              {!editing ? (
                <>
                  <img
                    src={normalizeImageUrl(c.image_url) || '/images/Club.png'}
                    alt=''
                    style={{
                      width: 56,
                      height: 38,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid rgba(214,51,132,.15)',
                    }}
                  />
                  <div style={{ fontWeight: 800 }}>{c.category_name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type='button'
                      className='btn'
                      onClick={() => startEditCategory(c)}
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      className='btn'
                      onClick={() => deleteCategoryX(c.category_id)}
                      title='Delete'
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    className='input'
                    value={catEditing.name}
                    onChange={e =>
                      setCatEditing(x => ({ ...x, name: e.target.value }))
                    }
                    placeholder='Category name'
                  />
                  <input
                    className='input'
                    value={catEditing.image_url}
                    onChange={e =>
                      setCatEditing(x => ({ ...x, image_url: e.target.value }))
                    }
                    placeholder='Image URL'
                  />
                  <input
                    type='file'
                    accept='image/*'
                    onChange={async e => {
                      if (e.target.files?.[0]) {
                        const url = await uploadImage(e.target.files[0]);
                        setCatEditing(x => ({ ...x, image_url: url }));
                        notify.success('Image uploaded');
                      }
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type='button'
                      className='btn'
                      onClick={saveEditCategory}
                      disabled={catSaving}
                    >
                      {catSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type='button'
                      className='btn'
                      onClick={cancelEditCategory}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {categories.length === 0 && (
          <li style={{ color: 'var(--muted)' }}>No categories found.</li>
        )}
      </ul>
    </div>
  );
}
