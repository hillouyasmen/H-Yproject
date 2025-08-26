// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // تنظيف auth القديم دون توكن
  useEffect(() => {
    try {
      const saved = localStorage.getItem("auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.user) setUser(parsed.user);
        if (!parsed?.token) localStorage.removeItem("auth");
      }
    } catch {
      localStorage.removeItem("auth");
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await api.post("/users/login", { username, password });
      if (data?.ok && data?.user) {
        setUser(data.user);
        localStorage.setItem(
          "auth",
          JSON.stringify({ user: data.user, token: data.token || null })
        );
        return { ok: true, user: data.user };
      }
      return { ok: false, message: data?.message || "Login failed" };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
      return { ok: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch {}
    setUser(null);
    localStorage.removeItem("auth");
  };

  const value = { user, setUser, loading, isAuthed: !!user, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
