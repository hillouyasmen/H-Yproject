// backend/routes/upload.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const r = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const up = multer({ storage });

/**
 * POST /api/upload
 * returns: { url: "http://localhost:5000/uploads/<file>", path: "/uploads/<file>", filename: "<file>" }
 */
r.post("/", up.single("image"), (req, res) => {
  const filename = req.file.filename;
  const pathPart = `/uploads/${filename}`;
  const publicUrl = `${req.protocol}://${req.get("host")}${pathPart}`;
  res.json({ url: publicUrl, path: pathPart, filename });
});

export default r;
