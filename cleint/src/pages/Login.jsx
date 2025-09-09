// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import styles from "../styles/Login.module.css";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    const res = await login(identifier, password);
    if (res.ok) {
      notify.success("Welcome!");
      if (res.user) nav(res.user.role === "admin" ? "/admin" : "/");
    } else {
      notify.error(res.message || "Invalid credentials");
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.fxAurora} aria-hidden />
      <div className={styles.card}>
        <h2 className={styles.title}>Login</h2>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label} htmlFor="identifier">
            Username or Email
          </label>
          <input
            id="identifier"
            className={styles.input}
            placeholder="username or you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button className={styles.primaryBtn}>Login</button>
        </form>

        <div className={styles.links}>
          <Link className={styles.link} to="/reset">
            Forgot password?
          </Link>
          <span className={styles.dot}>·</span>
          <Link className={styles.link} to="/register">
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
