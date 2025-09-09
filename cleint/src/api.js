// src/api.js
import axios from "axios";
import { notify } from "./components/Notifications.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const saved = localStorage.getItem("auth");
  if (saved) {
    try {
      const { token } = JSON.parse(saved);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    if (status === 401) notify.error("Please login to continue");
    else if (status === 403) notify.error("You don't have permission");
    else notify.error(msg);

    return Promise.reject(error);
  }
);

export default api;
