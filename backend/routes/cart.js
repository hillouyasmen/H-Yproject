// backend/routes/cart.js
import { Router } from "express";
const r = Router();

// POST /api/cart/add
r.post("/add", (req, res) => {
  const { product_id, color, size, quantity } = req.body || {};
  if (!product_id || !color || !size || !Number(quantity)) {
    return res.status(400).json({ ok: false, message: "Invalid payload" });
  }

  return res.json({ ok: true });
});

export default r;
