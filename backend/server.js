const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// 🔥 Middleware
app.use(express.json());

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: true
}));

// 🔥 Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// 🔥 MySQL connection
const db = mysql.createConnection({
  host: "YOUR_HOST",
  user: "YOUR_USER",
  password: "YOUR_PASSWORD",
  database: "YOUR_DATABASE"
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});


// ==========================
// AUTH MIDDLEWARE
// ==========================
function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}


// ==========================
// LOGIN API
// ==========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.user = username;
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});


// ==========================
// LOGOUT
// ==========================
app.get("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});


// ==========================
// ADD SHIPMENT
// ==========================
app.post("/api/add-shipment", checkAuth, (req, res) => {
  const { tracking_number, shipper_name, consignee_name, status } = req.body;

  const sql = `
    INSERT INTO shipments (tracking_number, shipper_name, consignee_name, status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [tracking_number, shipper_name, consignee_name, status], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "DB Error" });
    }

    res.json({ success: true });
  });
});


// ==========================
// GET SHIPMENTS
// ==========================
app.get("/api/shipments", checkAuth, (req, res) => {
  const sql = "SELECT * FROM shipments ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


// ==========================
// TRACK API (PUBLIC)
// ==========================
app.get("/api/track/:trackingNumber", (req, res) => {
  const trackingNumber = req.params.trackingNumber;

  const sql = `
    SELECT * FROM shipments
    WHERE LOWER(tracking_number) = LOWER(?)
  `;

  db.query(sql, [trackingNumber], (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "Tracking not found" });
    }

    res.json(result[0]);
  });
});


// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
