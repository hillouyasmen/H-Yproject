// src/utils/media.js
const API_BASE =
  import.meta.env?.VITE_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:5000";

export function normalizeImageUrl(value) {
  if (!value)
    return "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";

  const v0 = String(value).trim().replace(/\\/g, "/");

  if (/^(https?:)?\/\//i.test(v0) || v0.startsWith("data:")) return v0;
  if (v0.startsWith("file:/")) {
    return "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?q=80&w=1200&auto=format&fit=crop";
  }

  const m = v0.match(/uploads\/([^?#]+)$/i);
  if (m) return `${API_BASE}/uploads/${m[1]}`;

  if (v0.startsWith("/uploads/")) return `${API_BASE}${v0}`;
  if (v0.startsWith("uploads/")) return `${API_BASE}/${v0}`;

  return `${API_BASE}/uploads/${v0}`;
}
