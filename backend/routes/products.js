// backend/routes/products.js
import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

// helper: تحقّق العضوية لإرجاع member_price تلقائيًا لو أرسلت user_id
async function getMemberPlan(user_id) {
  if (!user_id) return null;
  const [[row]] = await pool.query(
    `SELECT plan
       FROM memberships
      WHERE user_id=? AND status='active'
        AND NOW() BETWEEN start_date AND end_date
      ORDER BY end_date DESC
      LIMIT 1`,
    [user_id]
  );
  return row?.plan || null;
}
function pctForPlan(plan) {
  const ANY = Number(process.env.MEMBER_PERCENT || 12);
  const M = Number(process.env.MEMBER_MONTHLY_PERCENT || ANY);
  const Y = Number(process.env.MEMBER_YEARLY_PERCENT || Math.max(ANY, M));
  if (!plan) return 0;
  if (String(plan).toLowerCase() === "monthly") return M;
  if (String(plan).toLowerCase() === "yearly") return Y;
  // trial وغيره
  return ANY;
}

/** GET /api/products
 *  q, bodyshape_id, category_id|cat_id, limit, user_id, member
 *
 */
r.get("/", async (req, res) => {
  try {
    const { q, bodyshape_id, category_id, cat_id, limit, user_id, member } =
      req.query;

    // هل نعتبره عضو؟
    let plan = null;
    if (user_id) plan = await getMemberPlan(user_id);
    const forceMember =
      String(member || "") === "1" || String(member || "") === "true";
    const isMember = forceMember || !!plan;
    const pct = isMember ? pctForPlan(plan || "any") : 0;

    const params = [];
    const where = ["1=1"];
    if (q) {
      where.push(
        "(p.product_name LIKE ? OR p.description LIKE ? OR c.category_name LIKE ?)"
      );
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const cat = category_id || cat_id;
    if (cat) {
      where.push("p.category_id = ?");
      params.push(cat);
    }
    if (bodyshape_id) {
      where.push("p.bodyshape_id = ?");
      params.push(bodyshape_id);
    }

    const [rows] = await pool.query(
      `
      SELECT
        p.product_id, p.product_name, p.image_url,
        p.category_id, p.supplier_id, p.bodyshape_id,
        c.category_name, s.supplier_name, b.shape_name,
        MIN(v.price) AS price
      FROM products p
      LEFT JOIN variations v   ON v.product_id = p.product_id
      LEFT JOIN categories c   ON c.category_id = p.category_id
      LEFT JOIN suppliers  s   ON s.supplier_id  = p.supplier_id
      LEFT JOIN bodyshapes b   ON b.bodyshape_id = p.bodyshape_id
      WHERE ${where.join(" AND ")}
      GROUP BY p.product_id
      ORDER BY p.product_id DESC
      ${limit ? "LIMIT ?" : ""}
      `,
      limit ? [...params, Number(limit)] : params
    );

    const out = rows.map((r) => {
      const base = r.price != null ? Number(r.price) : null;
      const member_price =
        isMember && base != null
          ? Number((base * (1 - pct / 100)).toFixed(2))
          : null;

      return {
        ...r,
        price: base,
        member_price,
      };
    });

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "list_products_failed" });
  }
});

/** GET /api/products/:id —(
r.get("/:id", async (req, res) => {
  try {
    const [[product]] = await pool.query(
      "SELECT * FROM products WHERE product_id=?",
      [req.params.id]
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: "get_product_failed" });
  }
});

/** POST /api/products — 
r.post("/", async (req, res) => {
  try {
    const {
      category_id,
      supplier_id,
      bodyshape_id,
      product_name,
      description,
      rating,
      image_url,
    } = req.body;
    const [rs] = await pool.query(
      `INSERT INTO products(category_id,supplier_id,bodyshape_id,product_name,description,rating,image_url)
       VALUES (?,?,?,?,?,?,?)`,
      [
        category_id || null,
        supplier_id || null,
        bodyshape_id || null,
        product_name,
        description || null,
        rating || null,
        image_url || null,
      ]
    );
    res.json({ product_id: rs.insertId, product_name });
  } catch (e) {
    res.status(500).json({ error: "create_product_failed" });
  }
});

/** PUT /api/products/:id — */
r.put("/:id", async (req, res) => {
  try {
    const {
      category_id,
      supplier_id,
      bodyshape_id,
      product_name,
      description,
      rating,
      image_url,
    } = req.body;
    await pool.query(
      `UPDATE products
          SET category_id=?, supplier_id=?, bodyshape_id=?, product_name=?, description=?, rating=?, image_url=?
        WHERE product_id=?`,
      [
        category_id || null,
        supplier_id || null,
        bodyshape_id || null,
        product_name,
        description || null,
        rating || null,
        image_url || null,
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "update_product_failed" });
  }
});

/** DELETE /api/products/:id — */
r.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE product_id=?", [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "delete_product_failed" });
  }
});

export default r;
