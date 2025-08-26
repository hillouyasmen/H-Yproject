// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Register.module.css";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "customer",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const { register } = useAuth();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validEmail = /\S+@\S+\.\S+/.test(form.email);
  const strongPw = form.password.length >= 6;
  const canSubmit = form.username.trim() && validEmail && strongPw && !loading;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      notify.success(
        "Account created! Check your email for a welcome message."
      );
      navigate("/login");
    } catch (e) {
      notify.error("Registration failed");
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.fxAurora} aria-hidden />
      <div className={styles.card}>
        <h2 className={styles.title}>Create an account</h2>

        <form className={styles.form} onSubmit={submit} noValidate>
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={onChange}
            autoComplete="username"
            required
          />

          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.input}
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
            aria-invalid={form.email ? (!validEmail).toString() : undefined}
          />
          {!validEmail && form.email && (
            <div className={styles.err}>Please enter a valid email.</div>
          )}

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <div className={styles.pwWrap}>
            <input
              id="password"
              className={styles.input}
              type={showPw ? "text" : "password"}
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className={styles.togglePw}
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              title={showPw ? "Hide" : "Show"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {!strongPw && form.password && (
            <div className={styles.err}>
              Password must be at least 6 characters.
            </div>
          )}

          <button className={styles.primaryBtn} disabled={!canSubmit}>
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        <div className={styles.links}>
          <Link className={styles.link} to="/login">
            Already have an account?
          </Link>
        </div>
      </div>
    </section>
  );
}
