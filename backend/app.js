// backend/app.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { attachUser } from "./middleware/auth.js";

dotenv.config();

const app = express();
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONT_ORIGIN,
    credentials: true,
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"], // مهم للتوكن
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// يقرأ الـ JWT ويملأ req.user
app.use(attachUser);

// static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
import bodyshapes from "./routes/bodyshapes.js";
import users from "./routes/users.js";
import categories from "./routes/categories.js";
import suppliers from "./routes/suppliers.js";
import products from "./routes/products.js";
import variations from "./routes/variations.js";
import orders from "./routes/orders.js";
import upload from "./routes/upload.js";
import authReset from "./routes/authReset.js";
import club from "./routes/club.js";
import payments from "./routes/payments.js";
import events from "./routes/events.js";
import contactRouter from "./routes/contact.js";
import cart from "./routes/cart.js"; // ✅ جديد

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/bodyshapes", bodyshapes);
app.use("/api/users", users);
app.use("/api/categories", categories);
app.use("/api/suppliers", suppliers);
app.use("/api/products", products);
app.use("/api/variations", variations);
app.use("/api/orders", orders);
app.use("/api/upload", upload);
app.use("/api/club", club);
app.use("/api/payments", payments);
app.use("/api/events", events);
app.use("/api/contact", contactRouter);
app.use("/api/cart", cart); // ✅ يمنع 404 /cart/add

// 404 + error handlers
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || err.statusCode || 500)
    .json({ message: err.message || "Internal server error" });
});

const port = process.env.PORT || 5000;
const server = app.listen(port, () =>
  console.log(`API running at http://localhost:${port}`)
);

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  server.close(() => process.exit(0));
});
