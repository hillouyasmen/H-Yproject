import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Link } from "react-router-dom";
import api from "../api";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Account.module.css";

export default function Account() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [uRes, bsRes] = await Promise.all([
        api.get(`/users/${user.user_id}`),
        api.get("/bodyshapes"),
      ]);
      setMe(uRes.data);
      setShapes(Array.isArray(bsRes.data) ? bsRes.data : []);
    })();
  }, [user]);

  if (!user) return <div className="card">Please login</div>;
  if (!me) return <div className="card">Loading…</div>;

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        username: me.username,
        email: me.email,
        phone: me.phone,
        address: me.address,
        birth_date: me.birth_date || null,
        bodyshape_id: me.bodyshape_id || null,
      };
      await api.put(`/users/${user.user_id}`, payload);
      notify.success("Saved");
    } catch {
      notify.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onChangePwd = async (e) => {
    e.preventDefault();
    const old_password = e.target.old.value.trim();
    const new_password = e.target.newp.value.trim();
    if (!old_password || new_password.length < 6) {
      return notify.error("Min password length is 6");
    }
    try {
      setPwdSaving(true);
      const { data } = await api.put(`/users/${user.user_id}/password`, {
        old_password,
        new_password,
      });
      if (data?.ok) {
        notify.success("Password updated");
        e.target.reset();
      } else notify.error("Couldn’t change password");
    } catch {
      notify.error("Couldn’t change password");
    } finally {
      setPwdSaving(false);
    }
  };

  const sendCard = async () => {
    try {
      const { data } = await api.post(`/users/${user.user_id}/card-email`, {});
      if (data?.ok) notify.success("Member card sent to your email");
      else notify.error("Failed to send member card");
    } catch {
      notify.error("Failed to send member card");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Account settings</h2>
          <div className={styles.hint}>
            Keep your details up-to-date.{" "}
            <Link to="/profile">Back to profile</Link>
          </div>
        </div>
        <button className={styles.cardBtn} onClick={sendCard}>
          Email my member card
        </button>
      </div>

      <div className={styles.grid}>
        <form className={styles.card} onSubmit={onSave}>
          <div className={styles.cardTitle}>Profile</div>
          <div className={styles.row}>
            <label>Username</label>
            <input
              value={me.username || ""}
              onChange={(e) => setMe({ ...me, username: e.target.value })}
            />
          </div>
          <div className={styles.row}>
            <label>Email</label>
            <input
              type="email"
              value={me.email || ""}
              onChange={(e) => setMe({ ...me, email: e.target.value })}
            />
          </div>
          <div className={styles.twoCols}>
            <div className={styles.row}>
              <label>Phone</label>
              <input
                value={me.phone || ""}
                onChange={(e) => setMe({ ...me, phone: e.target.value })}
              />
            </div>
            <div className={styles.row}>
              <label>Birth date</label>
              <input
                type="date"
                value={me.birth_date || ""}
                onChange={(e) => setMe({ ...me, birth_date: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.row}>
            <label>Address</label>
            <input
              value={me.address || ""}
              onChange={(e) => setMe({ ...me, address: e.target.value })}
            />
          </div>
          <div className={styles.row}>
            <label>Bodyshape</label>
            <select
              value={me.bodyshape_id || ""}
              onChange={(e) =>
                setMe({ ...me, bodyshape_id: e.target.value || null })
              }
            >
              <option value="">—</option>
              {shapes.map((s) => (
                <option key={s.bodyshape_id} value={s.bodyshape_id}>
                  {s.shape_name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.actions}>
            <button className={styles.primary} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <form className={styles.card} onSubmit={onChangePwd}>
          <div className={styles.cardTitle}>Security</div>
          <div className={styles.row}>
            <label>Current password</label>
            <input name="old" type="password" placeholder="••••••••" />
          </div>
          <div className={styles.row}>
            <label>New password</label>
            <input name="newp" type="password" placeholder="At least 6 chars" />
          </div>
          <div className={styles.actions}>
            <button className={styles.ghost} type="reset">
              Reset
            </button>
            <button className={styles.primary} disabled={pwdSaving}>
              {pwdSaving ? "Updating…" : "Update password"}
            </button>
          </div>
          <div className={styles.tiny}>
            Forgot password? <Link to="/forgot">Recover it</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
