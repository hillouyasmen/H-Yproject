// backend/middleware/auth.js
import jwt from "jsonwebtoken";
const { JWT_SECRET = "devsecret" } = process.env;

export function attachUser(req, _res, next) {
  try {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (m) {
      const decoded = jwt.verify(m[1], JWT_SECRET);
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        username: decoded.username,
      };
    }
  } catch {}
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}
