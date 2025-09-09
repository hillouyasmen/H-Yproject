import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../components/Notifications.jsx";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token");
  const nav = useNavigate();

  // request reset state
  const [email, setEmail] = useState("");

  // set new password state
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  useEffect(() => {
    // optional: validate token by pinging backend (not required)
  }, [token]);

  const request = async (e) => {
    e.preventDefault();
    if (!email) return notify.error("Enter your email");
    await api.post("/auth/request-reset", { email });
    notify.success("If the email exists, a reset link was sent");
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!pwd || pwd.length < 6)
      return notify.error("Password must be at least 6 chars");
    if (pwd !== pwd2) return notify.error("Passwords do not match");
    try {
      await api.post("/auth/reset", { token, password: pwd });
      notify.success("Password updated. Please login.");
      nav("/login");
    } catch {
      // interceptor will show error
    }
  };

  if (!token) {
    // Request link
    return (
      <div className="card" style={{ maxWidth: 460, margin: "0 auto" }}>
        <h2 className="sectionTitle">Reset your password</h2>
        <p style={{ color: "var(--muted)" }}>
          Enter your email and we’ll send you a reset link.
        </p>
        <form onSubmit={request}>
          <input
            className="input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginTop: 8 }}
          />
          <button className="btn" style={{ marginTop: 12 }}>
            Send reset link
          </button>
        </form>
      </div>
    );
  }

  // Set new password
  return (
    <div className="card" style={{ maxWidth: 460, margin: "0 auto" }}>
      <h2 className="sectionTitle">Set a new password</h2>
      <form onSubmit={submitNew}>
        <input
          className="input"
          type="password"
          placeholder="New password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          style={{ marginTop: 8 }}
        />
        <input
          className="input"
          type="password"
          placeholder="Repeat new password"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          style={{ marginTop: 8 }}
        />
        <button className="btn" style={{ marginTop: 12 }}>
          Update password
        </button>
      </form>
      <div style={{ color: "var(--muted)", marginTop: 10 }}>
        Token will expire soon—complete the reset promptly.
      </div>
    </div>
  );
}
