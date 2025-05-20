const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // ← غيّرها إذا عندك كلمة مرور
  database: "hy_project",
});

db.connect((err) => {
  if (err) throw err;
  console.log("you contectd in database ");
});

module.exports = db;
