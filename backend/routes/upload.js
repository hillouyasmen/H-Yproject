<<<<<<< HEAD
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
=======
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// إعدادات multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    // اسم عشوائي مع الوقت
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// رفع صورة واحدة فقط
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // رابط الصورة الجديدة
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

module.exports = router;
>>>>>>> 96d5d4fa470c5e3711e74096bc067efa4f6df75d
