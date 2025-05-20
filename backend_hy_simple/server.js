const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const usersRoutes = require("./routes/users");

const app = express();

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(bodyParser.json());
app.use("/api/users", usersRoutes);

app.listen(5000, () => {
  console.log("✅ Server running at http://localhost:5000");
});
