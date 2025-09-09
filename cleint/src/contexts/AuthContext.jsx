// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import { notify } from "../components/Notifications.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // حمل auth من التخزين واضبط الهيدر
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("auth") || "null");
      if (saved?.user && saved?.token) {
        setUser(saved.user);
        setToken(saved.token);
        api.defaults.headers.common.Authorization = `Bearer ${saved.token}`;
      }
    } catch {}
    setReady(true);
  }, []);

  const saveAuth = (nextUser, nextToken) => {
    setUser(nextUser || null);
    setToken(nextToken || null);
    if (nextToken) {
      api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
    } else {
      try {
        delete api.defaults.headers.common.Authorization;
      } catch {}
    }
    if (nextUser && nextToken) {
      localStorage.setItem(
        "auth",
        JSON.stringify({ user: nextUser, token: nextToken })
      );
    } else {
      localStorage.removeItem("auth");
    }
  };

  const login = async (identifier, password) => {
    const idTrim = String(identifier || "").trim();
    const id = idTrim.includes("@") ? idTrim.toLowerCase() : idTrim;
    try {
      const { data } = await api.post("/users/login", {
        identifier: id,
        password,
      });
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
  const register = async (payload) => {
    const { data } = await api.post("/users", payload);
    if (data?.ok && data.user && data.token) {
      saveAuth(data.user, data.token);
      notify?.success?.("Account created ✓");
      return data.user;
    }
    throw new Error(data?.error || "Registration failed");
  };

  const logout = () => {
    saveAuth(null, null);
    notify?.info?.("Logged out");
  };

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout, setUser }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ✅ hook مطلوب في كل الصفحات
export const useAuth = () => useContext(AuthContext);

// (اختياري) default لو في import افتراضي قديم
export default AuthProvider;
