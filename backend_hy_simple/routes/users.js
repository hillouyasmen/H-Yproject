const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

// הרשמה
router.post("/register", async (req, res) => {
  const { username, password, full_name, email, phone_number } = req.body;

  if (!username || !password || !full_name || !email || !phone_number) {
    return res.status(400).json({ message: "נא למלא את כל השדות" });
  }

  try {
    const [existingUser] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "שם המשתמש כבר קיים" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, password, full_name, email, phone_number) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name, email, phone_number]
    );

    res.status(201).json({ success: true, message: "ההרשמה הצליחה" });
  } catch (err) {
    console.error("שגיאה בהרשמה:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});

module.exports = router;
