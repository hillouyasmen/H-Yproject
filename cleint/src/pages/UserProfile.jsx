// src/pages/UserProfile.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api';
import styles from '../styles/UserProfile.module.css';
import { notify } from '../components/Notifications.jsx';
import { normalizeImageUrl } from '../lib/img.js'; // ✅ fix file:/// images

export default function UserProfile() {
  const { user, loading: authLoading } = useAuth();

  // ------- Orders data -------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------- UI state -------
  const [range, setRange] = useState('48h'); // today | yesterday | 48h | 7d | 30d | all
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | paid | shipped | cancelled
  const [q, setQ] = useState('');
  const [view, setView] = useState('cards'); // cards | table

  // ------- Profile / Security -------
  const [profile, setProfile] = useState(null);
  const [pLoading, setPLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwd, setPwd] = useState({
    old_password: '',
    new_password: '',
    again: '',
  });
  const [savingPwd, setSavingPwd] = useState(false);
  const [sendingCard, setSendingCard] = useState(false); // ✅ state for card email

  // ------- Items cache + modal -------
  const [itemsCache, setItemsCache] = useState({});
  const [modal, setModal] = useState({
    open: false,
    orderId: null,
    loading: false,
  });

  // ------- Cancel state -------
  const [cancellingId, setCancellingId] = useState(null);

  // ---------- Helpers ----------
  const money = n => '$' + Number(n || 0).toFixed(2);
  const formatDateTime = d => (d ? new Date(d).toLocaleString() : '—');
  const toISOday = d => new Date(d).toISOString().slice(0, 10);
  const dateForInput = d => {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
  };
  const inRange = (date, r) => {
    const t = new Date(date).getTime();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sameDay = (a, b) =>
      new Date(a).toDateString() === new Date(b).toDateString();
    switch (r) {
      case 'today':
        return sameDay(t, now);
      case 'yesterday':
        return sameDay(t, now - oneDay);
      case '48h':
        return now - t <= 2 * oneDay;
      case '7d':
        return now - t <= 7 * oneDay;
      case '30d':
        return now - t <= 30 * oneDay;
      case 'all':
      default:
        return true;
    }
  };
  const textInc = (v, term) =>
    !term
      ? true
      : String(v ?? '')
          .toLowerCase()
          .includes(String(term).toLowerCase());

  // ---------- Fetch profile + orders ----------
  useEffect(() => {
    let abort = false;
    async function run() {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        const { data } = await api.get('/orders', {
          params: { user_id: user.user_id },
        });
        const list = Array.isArray(data)
          ? data.filter(o => String(o.user_id) === String(user.user_id))
          : [];
        if (!abort) setOrders(list);
      } catch {
        if (!abort) notify.error('Failed to load your orders');
      } finally {
        if (!abort) setLoading(false);
      }

      try {
        setPLoading(true);
        const { data } = await api.get(`/users/${user.user_id}`);
        if (!abort) {
          setProfile({
            username: data?.username ?? user.username,
            email: data?.email ?? user.email,
            phone: data?.phone ?? '',
            address: data?.address ?? '',
            birth_date: data?.birth_date ?? '',
            bodyshape_id: data?.bodyshape_id ?? user.bodyshape_id ?? '',
            role: data?.role ?? user.role ?? 'customer',
          });
        }
      } catch {
        if (!abort)
          setProfile({
            username: user.username,
            email: user.email,
            phone: user.phone ?? '',
            address: user.address ?? '',
            birth_date: '',
            bodyshape_id: user.bodyshape_id ?? '',
            role: user.role,
          });
      } finally {
        if (!abort) setPLoading(false);
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [user, authLoading]);

  // ---------- Prefetch first few orders' items ----------
  useEffect(() => {
    const firstIds = orders.slice(0, 12).map(o => o.order_id);
    const toFetch = firstIds.filter(id => !itemsCache[id]);
    if (!toFetch.length) return;
    (async () => {
      for (const id of toFetch) {
        try {
          const { data } = await api.get(`/orders/${id}`);
          setItemsCache(prev => ({
            ...prev,
            [id]: Array.isArray(data?.items) ? data.items : [],
          }));
        } catch {
          /* silent */
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // ---------- Derived (orders) ----------
  const ordersSorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.order_date) - new Date(a.order_date),
      ),
    [orders],
  );

  const filtered = useMemo(() => {
    return ordersSorted.filter(o => {
      const byStatus =
        statusFilter === 'all' ? true : o.status === statusFilter;
      const byRange = inRange(o.order_date, range);
      const byQuery =
        textInc(o.order_id, q) ||
        textInc(o.username, q) ||
        textInc(o.status, q) ||
        textInc(o.total_amount, q) ||
        textInc(new Date(o.order_date).toLocaleString(), q);
      return byStatus && byRange && byQuery;
    });
  }, [ordersSorted, statusFilter, range, q]);

  const stat = useMemo(() => {
    const count = filtered.length;
    const revenue = filtered.reduce(
      (s, o) => s + Number(o.total_amount || 0),
      0,
    );
    const items = filtered.reduce((s, o) => s + Number(o.items_count || 0), 0);
    const avg = count ? revenue / count : 0;
    return { count, revenue, items, avg };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const o of filtered) {
      const key = toISOday(o.order_date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(o);
    }
    return [...map.entries()]
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([day, list]) => ({ day, list }));
  }, [filtered]);

  // ===== KPIs =====
  const timeAgo = date => {
    if (!date) return '—';
    const t = new Date(date).getTime();
    const diff = Math.max(0, Date.now() - t);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    const mon = Math.floor(day / 30);
    if (mon < 12) return `${mon}mo ago`;
    const yr = Math.floor(day / 365);
    return `${yr}y ago`;
  };

  const buildSpark = (list, days, valueFn) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().slice(0, 10);
      const dayOrders = list.filter(o => toISOday(o.order_date) === iso);
      const val = dayOrders.reduce((s, o) => s + (valueFn ? valueFn(o) : 1), 0);
      buckets.push({ iso, label: d.toLocaleDateString(), val });
    }
    const max = Math.max(1, ...buckets.map(b => b.val));
    const bars = buckets.map(b => ({
      ...b,
      h: Math.max(6, Math.round((b.val / max) * 100)),
    }));
    return { bars, max };
  };

  const sparkDays = 10;
  const sparkOrders = useMemo(
    () => buildSpark(filtered, sparkDays, () => 1),
    [filtered],
  );
  const sparkItems = useMemo(
    () => buildSpark(filtered, sparkDays, o => Number(o.items_count || 0)),
    [filtered],
  );

  const lastOrderAt = useMemo(
    () => (ordersSorted.length ? ordersSorted[0].order_date : null),
    [ordersSorted],
  );
  const lastOrderAgo = useMemo(() => timeAgo(lastOrderAt), [lastOrderAt]);

  const paidCount = useMemo(
    () =>
      filtered.filter(o => String(o.status || '').toLowerCase() === 'paid')
        .length,
    [filtered],
  );
  const shippedCount = useMemo(
    () =>
      filtered.filter(o => String(o.status || '').toLowerCase() === 'shipped')
        .length,
    [filtered],
  );
  const progressed = paidCount + shippedCount;
  const pipelinePct = useMemo(
    () =>
      filtered.length ? Math.round((progressed / filtered.length) * 100) : 0,
    [progressed, filtered.length],
  );

  // ---------- Actions (email/invoice/csv) ----------
  const emailInvoice = async orderId => {
    try {
      const { data } = await api.post(`/orders/${orderId}/send-invoice`, {});
      if (data?.emailed) notify.success('Invoice was emailed to you');
      else notify.error('Could not send the invoice email');
    } catch {
      notify.error('Failed to send invoice email');
    }
  };

  const exportCSV = () => {
    const headers = ['order_id', 'date', 'status', 'items', 'total'];
    const rows = filtered.map(o => [
      o.order_id,
      new Date(o.order_date).toISOString(),
      o.status,
      o.items_count ?? '',
      Number(o.total_amount || 0).toFixed(2),
    ]);
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Profile actions ----------
  const saveProfile = async () => {
    if (!profile) return;
    try {
      setSavingProfile(true);
      await api.put(`/users/${user.user_id}/profile`, {
        username: profile.username,
        email: profile.email,
        phone: profile.phone || null,
        address: profile.address || null,
        birth_date: profile.birth_date || null,
        bodyshape_id: profile.bodyshape_id || null,
      });
      notify.success('Profile updated ✓');
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!pwd.old_password || !pwd.new_password)
      return notify.error('Fill password fields');
    if (pwd.new_password.length < 6)
      return notify.error('New password must be at least 6 chars');
    if (pwd.new_password !== pwd.again)
      return notify.error('Passwords do not match');
    try {
      setSavingPwd(true);
      await api.put(`/users/${user.user_id}/password`, {
        old_password: pwd.old_password,
        new_password: pwd.new_password,
      });
      notify.success('Password changed ✓');
      setPwd({ old_password: '', new_password: '', again: '' });
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Change password failed');
    } finally {
      setSavingPwd(false);
    }
  };

  // ✅ the function that was missing
  const sendMemberCard = async () => {
    try {
      setSendingCard(true);
      await api.post(`/users/${user.user_id}/card-email`, {});
      notify.success('Member card sent to your email 💌');
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Could not send the card');
    } finally {
      setSendingCard(false);
    }
  };

  // ---------- Cancel order (only pending) ----------
  const cancelOrder = async orderId => {
    const o = orders.find(x => x.order_id === orderId);
    if (!o) return;
    const status = String(o.status || '').toLowerCase();
    if (status !== 'pending') {
      notify.info('Only pending orders can be cancelled.');
      return;
    }
    if (!window.confirm(`Cancel order #${orderId}?`)) return;

    try {
      setCancellingId(orderId);
      await api.put(`/orders/${orderId}`, { status: 'cancelled' });
      setOrders(prev =>
        prev.map(x =>
          x.order_id === orderId ? { ...x, status: 'cancelled' } : x,
        ),
      );
      notify.success(`Order #${orderId} cancelled`);
    } catch (e) {
      notify.error(e?.response?.data?.message || 'Cancel failed');
    } finally {
      setCancellingId(null);
    }
  };

  // ---------- Modal helpers ----------
  const ensureItems = async orderId => {
    if (itemsCache[orderId]) return itemsCache[orderId];
    const { data } = await api.get(`/orders/${orderId}`);
    const items = Array.isArray(data?.items) ? data.items : [];
    setItemsCache(p => ({ ...p, [orderId]: items }));
    return items;
  };
  const openModal = async orderId => {
    setModal({ open: true, orderId, loading: !itemsCache[orderId] });
    if (!itemsCache[orderId]) {
      try {
        await ensureItems(orderId);
      } finally {
        setModal(m => ({ ...m, loading: false }));
      }
    }
  };
  const closeModal = () =>
    setModal({ open: false, orderId: null, loading: false });

  // ---------- Render ----------
  const displayName = profile?.username || user?.username;
  const displayEmail = profile?.email || user?.email;
  const displayPhone = profile?.phone || user?.phone;
  const displayBodyshape = profile?.bodyshape_id ?? user?.bodyshape_id;

  const FALLBACK_IMG = '/images/product-fallback.png';

  return (
    <div className={`${styles.page} ${styles.compact}`}>
      {authLoading ? (
        <div className='card'>Loading…</div>
      ) : !user ? (
        <div className='card'>
          Please login to see your profile. <Link to='/login'>Login</Link>
        </div>
      ) : (
        <>
          <div className={styles.bgFx} aria-hidden />

          {/* Header */}
          <section className={styles.headerCard}>
            <div className={styles.userSide}>
              <img
                className={styles.avatar}
                src={user.avatar || '/images/avatars/hazem.jpg'}
                alt={displayName}
                onError={e => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1520975823756-3f4f2d09557f?q=80&w=600&auto=format&fit=crop';
                }}
              />
              <div className={styles.userText}>
                <div className={styles.nameRow}>
                  <h2 className={styles.name}>{displayName}</h2>
                  <span className={`${styles.pill} ${styles.role}`}>
                    {profile?.role || user.role}
                  </span>
                </div>
                <div className={styles.meta}>
                  <span>{displayEmail}</span>
                  {displayPhone && <span> • {displayPhone}</span>}
                  {displayBodyshape ? (
                    <span> • Bodyshape ID: {displayBodyshape}</span>
                  ) : (
                    <Link to='/bodyshape' className={styles.link}>
                      {' '}
                      • Set body shape
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className={styles.kpisNeo}>
              <div className={`${styles.neo} ${styles.cardActivity}`}>
                <div className={styles.iconCirc} aria-hidden>
                  📦
                </div>
                <div className={styles.neoHead}>
                  <div className={styles.neoTitle}>Activity</div>
                  <div className={styles.neoValue}>{stat.count}</div>
                </div>
                <div className={styles.spark} title='Orders (last days)'>
                  {sparkOrders.bars.map((b, i) => (
                    <div
                      key={i}
                      className={styles.sparkBar}
                      style={{ height: `${b.h}%` }}
                      title={`${b.label}: ${b.val}`}
                    />
                  ))}
                </div>
                <div className={styles.neoHint}>orders in range</div>
              </div>

              <div className={`${styles.neo} ${styles.cardItems}`}>
                <div className={styles.iconCirc} aria-hidden>
                  🛍️
                </div>
                <div className={styles.neoHead}>
                  <div className={styles.neoTitle}>Items</div>
                  <div className={styles.neoValue}>{stat.items}</div>
                </div>
                <div className={styles.spark} title='Items (last days)'>
                  {sparkItems.bars.map((b, i) => (
                    <div
                      key={i}
                      className={styles.sparkBar}
                      style={{ height: `${b.h}%` }}
                      title={`${b.label}: ${b.val}`}
                    />
                  ))}
                </div>
                <div className={styles.neoHint}>items in range</div>
              </div>

              <div className={`${styles.neo} ${styles.cardLast}`}>
                <div className={styles.iconCirc} aria-hidden>
                  ⏱️
                </div>
                <div className={styles.neoHead}>
                  <div className={styles.neoTitle}>Last order</div>
                  <div className={styles.neoValue}>
                    {lastOrderAt ? lastOrderAgo : '—'}
                  </div>
                </div>
                <div className={styles.subPill}>
                  {lastOrderAt
                    ? new Date(lastOrderAt).toLocaleString()
                    : 'No orders yet'}
                </div>
              </div>

              <div className={`${styles.neo} ${styles.cardPipe}`}>
                <div className={styles.iconCirc} aria-hidden>
                  🚚
                </div>
                <div className={styles.neoHead}>
                  <div className={styles.neoTitle}>Pipeline</div>
                  <div className={styles.neoValue}>{pipelinePct}%</div>
                </div>
                <div
                  className={styles.pipeTrack}
                  title={`${pipelinePct}% progressed`}
                >
                  <div
                    className={styles.pipeFill}
                    style={{ width: `${pipelinePct}%` }}
                  />
                </div>
                <div className={styles.neoBadges}>
                  <span className={styles.badgeSoft}>Paid {paidCount}</span>
                  <span className={styles.badgeSoft}>
                    Shipped {shippedCount}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Profile & Security */}
          <section className={styles.profileCard}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>Profile & Security</h3>
              <div className={styles.actionsRow}>
                <button
                  className={`${styles.btn} ${styles.light}`}
                  onClick={sendMemberCard}
                  disabled={sendingCard}
                  title='Send member card to your email'
                >
                  {sendingCard ? 'Sending…' : 'Email my member card'}
                </button>
              </div>
            </div>

            {pLoading || !profile ? (
              <div className={styles.skeletons}>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </div>
            ) : (
              <div className={styles.split}>
                <div className={styles.formPane}>
                  <div className={styles.formTitle}>Profile</div>
                  <div className={styles.formGrid}>
                    <label className={styles.label}>
                      Username
                      <input
                        className={styles.input}
                        value={profile.username}
                        onChange={e =>
                          setProfile({ ...profile, username: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Email
                      <input
                        className={styles.input}
                        type='email'
                        value={profile.email}
                        onChange={e =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Phone
                      <input
                        className={styles.input}
                        value={profile.phone || ''}
                        onChange={e =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Address
                      <input
                        className={styles.input}
                        value={profile.address || ''}
                        onChange={e =>
                          setProfile({ ...profile, address: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Birth date
                      <input
                        className={styles.input}
                        type='date'
                        value={dateForInput(profile.birth_date)}
                        onChange={e =>
                          setProfile({ ...profile, birth_date: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Bodyshape ID
                      <input
                        className={styles.input}
                        value={profile.bodyshape_id || ''}
                        onChange={e =>
                          setProfile({
                            ...profile,
                            bodyshape_id: e.target.value,
                          })
                        }
                        placeholder='e.g. 1, 2…'
                      />
                    </label>
                  </div>
                  <div className={styles.formActions}>
                    <button
                      className={`${styles.btn} ${styles.primary}`}
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>

                <div className={styles.formPane}>
                  <div className={styles.formTitle}>Security</div>
                  <div className={styles.formGrid}>
                    <label className={styles.label}>
                      Current password
                      <input
                        className={styles.input}
                        type='password'
                        value={pwd.old_password}
                        onChange={e =>
                          setPwd({ ...pwd, old_password: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      New password
                      <input
                        className={styles.input}
                        type='password'
                        value={pwd.new_password}
                        onChange={e =>
                          setPwd({ ...pwd, new_password: e.target.value })
                        }
                      />
                    </label>
                    <label className={styles.label}>
                      Repeat new password
                      <input
                        className={styles.input}
                        type='password'
                        value={pwd.again}
                        onChange={e =>
                          setPwd({ ...pwd, again: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className={styles.formActions}>
                    <button
                      className={`${styles.btn} ${styles.light}`}
                      onClick={() =>
                        setPwd({
                          old_password: '',
                          new_password: '',
                          again: '',
                        })
                      }
                    >
                      Clear
                    </button>
                    <button
                      className={`${styles.btn} ${styles.primary}`}
                      onClick={changePassword}
                      disabled={savingPwd}
                    >
                      {savingPwd ? 'Updating…' : 'Change password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Filters */}
          <section className={styles.filtersCard}>
            <div className={styles.filtersRow}>
              <div className={styles.group}>
                <div className={styles.groupLabel}>Quick range</div>
                {['today', 'yesterday', '48h', '7d', '30d', 'all'].map(r => (
                  <button
                    key={r}
                    className={`${styles.chip} ${
                      range === r ? styles.chipActive : ''
                    }`}
                    onClick={() => setRange(r)}
                  >
                    {r === '48h'
                      ? 'Last 48h'
                      : r === '7d'
                      ? '7 days'
                      : r === '30d'
                      ? '30 days'
                      : r}
                  </button>
                ))}
              </div>

              <div className={styles.group}>
                <div className={styles.groupLabel}>Status</div>
                {['all', 'pending', 'paid', 'shipped', 'cancelled'].map(s => (
                  <button
                    key={s}
                    className={`${styles.chip} ${
                      statusFilter === s ? styles.chipActive : ''
                    }`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className={styles.group} style={{ marginLeft: 'auto' }}>
                <input
                  className={styles.search}
                  placeholder='Search orders…'
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.toggleBtn} ${
                      view === 'cards' ? styles.on : ''
                    }`}
                    onClick={() => setView('cards')}
                    title='Cards view'
                  >
                    Cards
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${
                      view === 'table' ? styles.on : ''
                    }`}
                    onClick={() => setView('table')}
                    title='Table view'
                  >
                    Table
                  </button>
                </div>
                <button className={styles.exportBtn} onClick={exportCSV}>
                  Export CSV
                </button>
              </div>
            </div>
          </section>

          {/* Orders */}
          <section className={styles.ordersCard}>
            <div className={styles.ordersHead}>
              <h3 className={styles.sectionTitle}>My orders</h3>
              {!loading && (
                <div className={styles.hint}>
                  {filtered.length} of {orders.length} shown
                </div>
              )}
            </div>

            {loading ? (
              <div className={styles.skeletons}>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                No orders for this filter{' '}
                <button
                  className={styles.link}
                  onClick={() => {
                    setRange('all');
                    setStatusFilter('all');
                    setQ('');
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : view === 'table' ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Items</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(o => {
                      const items = itemsCache[o.order_id] || [];
                      const deck = items.slice(0, 3);
                      const more = Math.max(0, items.length - deck.length);
                      const isPending =
                        String(o.status || '').toLowerCase() === 'pending';
                      return (
                        <tr key={o.order_id}>
                          <td>#{o.order_id}</td>
                          <td>
                            <button
                              className={styles.deckBtn}
                              onClick={() => openModal(o.order_id)}
                              title='View items'
                            >
                              <div className={styles.thumbDeck}>
                                {deck.map((it, i) => {
                                  const src =
                                    normalizeImageUrl(it.image_url || '') ||
                                    FALLBACK_IMG;
                                  return (
                                    <span className={styles.thumbChip} key={i}>
                                      <img
                                        src={src}
                                        alt=''
                                        onError={e =>
                                          (e.currentTarget.src = FALLBACK_IMG)
                                        }
                                      />
                                    </span>
                                  );
                                })}
                                {more > 0 && (
                                  <span className={styles.thumbMoreMini}>
                                    +{more}
                                  </span>
                                )}
                                {deck.length === 0 && (
                                  <span className={styles.thumbChip}>
                                    <img src={FALLBACK_IMG} alt='' />
                                  </span>
                                )}
                              </div>
                            </button>
                          </td>
                          <td>{formatDateTime(o.order_date)}</td>
                          <td>
                            <span
                              className={`${styles.status} ${
                                styles[o.status || 'pending']
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td>{o.items_count ?? '—'}</td>
                          <td>{money(o.total_amount)}</td>
                          <td className={styles.cellActions}>
                            <Link
                              className={`${styles.btn} ${styles.light}`}
                              to={`/invoice/${o.order_id}`}
                            >
                              View
                            </Link>
                            <a
                              className={`${styles.btn} ${styles.light}`}
                              href={`/api/orders/${o.order_id}/invoice`}
                              target='_blank'
                              rel='noreferrer'
                            >
                              Print
                            </a>
                            <button
                              className={`${styles.btn} ${styles.primary}`}
                              onClick={() => emailInvoice(o.order_id)}
                            >
                              Email
                            </button>
                            {isPending && (
                              <button
                                className={`${styles.btn} ${styles.light}`}
                                onClick={() => cancelOrder(o.order_id)}
                                disabled={cancellingId === o.order_id}
                                title='Cancel this order'
                              >
                                {cancellingId === o.order_id
                                  ? 'Cancelling…'
                                  : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.dayStack}>
                {grouped.map(({ day, list }) => {
                  const dayTotal = list.reduce(
                    (s, o) => s + Number(o.total_amount || 0),
                    0,
                  );
                  const items = list.reduce(
                    (s, o) => s + Number(o.items_count || 0),
                    0,
                  );
                  return (
                    <div key={day} className={styles.dayBlock}>
                      <div className={styles.dayHead}>
                        <div className={styles.dayTitle}>
                          {new Date(day).toLocaleDateString()}
                        </div>
                        <div className={styles.dayMeta}>
                          <span>{list.length} orders</span>
                          <span>• {items} items</span>
                          <span>• {money(dayTotal)}</span>
                        </div>
                      </div>

                      <div className={styles.ordersGrid}>
                        {list.map(o => {
                          const steps = ['pending', 'paid', 'shipped'];
                          const idx = Math.max(
                            0,
                            steps.indexOf(o.status || 'pending'),
                          );
                          const pct = ((idx + 1) / steps.length) * 100;
                          const its = itemsCache[o.order_id] || [];
                          const deck = its.slice(0, 3);
                          const more = Math.max(0, its.length - deck.length);
                          const isPending =
                            String(o.status || '').toLowerCase() === 'pending';

                          return (
                            <div key={o.order_id} className={styles.orderCard}>
                              <button
                                className={styles.deckBtn}
                                onClick={() => openModal(o.order_id)}
                                aria-label={`View items of order #${o.order_id}`}
                              >
                                <div className={styles.thumbDeck}>
                                  {deck.map((it, i) => {
                                    const src =
                                      normalizeImageUrl(it.image_url || '') ||
                                      FALLBACK_IMG;
                                    return (
                                      <span
                                        className={styles.thumbChip}
                                        key={i}
                                      >
                                        <img
                                          src={src}
                                          alt=''
                                          onError={e =>
                                            (e.currentTarget.src = FALLBACK_IMG)
                                          }
                                        />
                                      </span>
                                    );
                                  })}
                                  {deck.length === 0 && (
                                    <span className={styles.thumbChip}>
                                      <img src={FALLBACK_IMG} alt='' />
                                    </span>
                                  )}
                                  {more > 0 && (
                                    <span className={styles.thumbMoreMini}>
                                      +{more}
                                    </span>
                                  )}
                                </div>
                              </button>

                              <div className={styles.orderTop}>
                                <div className={styles.orderId}>
                                  Order #{o.order_id}
                                </div>
                                <span
                                  className={`${styles.status} ${
                                    styles[o.status || 'pending']
                                  }`}
                                >
                                  {o.status}
                                </span>
                              </div>

                              <div className={styles.orderMeta}>
                                <div>
                                  <div className={styles.metaLabel}>Date</div>
                                  <div className={styles.metaValue}>
                                    {formatDateTime(o.order_date)}
                                  </div>
                                </div>
                                <div>
                                  <div className={styles.metaLabel}>Items</div>
                                  <div className={styles.metaValue}>
                                    {o.items_count ?? '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className={styles.metaLabel}>Total</div>
                                  <div className={styles.total}>
                                    {money(o.total_amount)}
                                  </div>
                                </div>
                              </div>

                              <div className={styles.orderProgress}>
                                <div className={styles.orderTrack} />
                                <div
                                  className={styles.orderBar}
                                  style={{ width: `${pct}%` }}
                                />
                                <div className={styles.stepLabels}>
                                  <span>Pending</span>
                                  <span>Paid</span>
                                  <span>Shipped</span>
                                </div>
                              </div>

                              <div className={styles.actions}>
                                <Link
                                  className={`${styles.btn} ${styles.light}`}
                                  to={`/invoice/${o.order_id}`}
                                >
                                  View invoice
                                </Link>
                                <a
                                  className={`${styles.btn} ${styles.light}`}
                                  href={`/api/orders/${o.order_id}/invoice`}
                                  target='_blank'
                                  rel='noreferrer'
                                >
                                  Download / Print
                                </a>
                                <button
                                  className={`${styles.btn} ${styles.primary}`}
                                  onClick={() => emailInvoice(o.order_id)}
                                >
                                  Email invoice
                                </button>
                                {isPending && (
                                  <button
                                    className={`${styles.btn} ${styles.light}`}
                                    onClick={() => cancelOrder(o.order_id)}
                                    disabled={cancellingId === o.order_id}
                                  >
                                    {cancellingId === o.order_id
                                      ? 'Cancelling…'
                                      : 'Cancel'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ==== ITEMS MODAL ==== */}
          {modal.open && (
            <div
              className={styles.modal}
              role='dialog'
              aria-modal='true'
              onClick={closeModal}
            >
              <div
                className={styles.modalCard}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className={styles.modalClose}
                  onClick={closeModal}
                  aria-label='Close'
                >
                  ×
                </button>
                <div className={styles.modalHead}>
                  <div className={styles.modalTitle}>
                    Order #{modal.orderId}
                  </div>
                  {(() => {
                    const od = orders.find(x => x.order_id === modal.orderId);
                    return (
                      <div className={styles.modalMeta}>
                        <span>{od ? formatDateTime(od.order_date) : ''}</span>
                        {od && <span>• {money(od.total_amount)}</span>}
                      </div>
                    );
                  })()}
                </div>

                {modal.loading ? (
                  <div style={{ padding: 16 }}>Loading items…</div>
                ) : (
                  <div className={styles.itemsGrid}>
                    {(itemsCache[modal.orderId] || []).map((it, i) => {
                      const src =
                        normalizeImageUrl(it.image_url || '') || FALLBACK_IMG;
                      return (
                        <div className={styles.itemCard} key={i}>
                          <div className={styles.itemImg}>
                            <img
                              src={src}
                              alt={it.product_name || 'Item'}
                              onError={e =>
                                (e.currentTarget.src = FALLBACK_IMG)
                              }
                            />
                          </div>
                          <div className={styles.itemInfo}>
                            <div className={styles.itemName}>
                              {it.product_name || 'Product'}
                            </div>
                            <div className={styles.itemMeta}>
                              {it.color || '—'} • {it.size || '—'} • x
                              {it.quantity}
                            </div>
                            <div className={styles.itemPrice}>
                              {money(
                                (
                                  Number(it.unit_price || 0) *
                                  Number(it.quantity || 0)
                                ).toFixed
                                  ? Number(it.unit_price || 0) *
                                      Number(it.quantity || 0)
                                  : it.line_total,
                              )}
                            </div>
                            {it.product_id && (
                              <div className={styles.itemActions}>
                                <Link
                                  className={styles.itemLink}
                                  to={`/product/${it.product_id}`}
                                  onClick={closeModal}
                                >
                                  View product →
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={styles.modalFoot}>
                  <Link
                    className={`${styles.btn} ${styles.light}`}
                    to={`/invoice/${modal.orderId}`}
                    onClick={closeModal}
                  >
                    View invoice
                  </Link>
                  <a
                    className={`${styles.btn} ${styles.light}`}
                    href={`/api/orders/${modal.orderId}/invoice`}
                    target='_blank'
                    rel='noreferrer'
                  >
                    Download / Print
                  </a>
                  <button
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={() => emailInvoice(modal.orderId)}
                  >
                    Email invoice
                  </button>
                  {(() => {
                    const od = orders.find(x => x.order_id === modal.orderId);
                    const canCancel =
                      od && String(od.status || '').toLowerCase() === 'pending';
                    return canCancel ? (
                      <button
                        className={`${styles.btn} ${styles.light}`}
                        onClick={() => cancelOrder(modal.orderId)}
                        disabled={cancellingId === modal.orderId}
                      >
                        {cancellingId === modal.orderId
                          ? 'Cancelling…'
                          : 'Cancel order'}
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
