// backend/middleware/auth.js (ESM)
import jwt from "jsonwebtoken";

export function attachUser(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.user = {
      user_id: payload.sub,
      role: payload.role,
      username: payload.username,
    };
  } catch {
    // تجاهل التوكين غير الصالح
  }
  next();
}
