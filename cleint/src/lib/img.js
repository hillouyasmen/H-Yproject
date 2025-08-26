// src/lib/img.js
export const normalizeImageUrl = (u) => {
  if (u == null || u === "") return null;

  const origin = (
    import.meta.env.VITE_FILES_ORIGIN || "http://localhost:5000"
  ).replace(/\/+$/, "");
  const s = String(u).trim().replace(/\\/g, "/");

  // روابط مكتملة أو بيانات
  if (
    /^(https?:)?\/\//i.test(s) ||
    s.startsWith("data:") ||
    s.startsWith("blob:")
  )
    return s;

  // يبدأ بـ /uploads
  if (s.startsWith("/uploads/")) return `${origin}${s}`;

  // يحتوي uploads/ في أي مكان (مع دعم مجلدات فرعية و querystring)
  const m = s.match(/(?:^|\/)uploads\/([^?]+?)(?:$|\?)/i);
  if (m) return `${origin}/uploads/${m[1]}`;

  // يبدأ بـ uploads/
  if (s.startsWith("uploads/")) return `${origin}/${s}`;

  // اسم ملف فقط
  return `${origin}/uploads/${s.split("/").pop()}`;
};
