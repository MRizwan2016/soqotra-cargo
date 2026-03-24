// IMPORT PACKAGES
const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */

const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

/* =========================
   SERVE FRONTEND FILES
========================= */

// Serve static files (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, "../frontend")));

// Root page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Explicit pages (fix for Render issue)
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

/* =========================
   LOGIN API
========================= */

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length > 0) {
      res.json({ message: "Login successful" });
    } else {
      res.json({ message: "Invalid credentials" });
    }
  });
});

/* =========================
   DASHBOARD API
========================= */

app.get("/api/dashboard", (req, res) => {

  const sqlTotal = "SELECT COUNT(*) AS total FROM shipments";
  const sqlDelivered = "SELECT COUNT(*) AS delivered FROM shipments WHERE status = 'DELIVERED'";
  const sqlTransit = "SELECT COUNT(*) AS transit FROM shipments WHERE status = 'IN TRANSIT' OR status IS NULL";

  db.query(sqlTotal, (err, totalResult) => {
    if (err) return res.status(500).send(err);

    db.query(sqlDelivered, (err, deliveredResult) => {
      if (err) return res.status(500).send(err);

      db.query(sqlTransit, (err, transitResult) => {
        if (err) return res.status(500).send(err);

        res.json({
          total: totalResult[0].total,
          delivered: deliveredResult[0].delivered,
          transit: transitResult[0].transit
        });
      });
    });
  });
});

/* ==========================
API UPDATE STATUS
========================== */
app.put("/api/update-status", (req, res) => {

  const { tracking_number, status } = req.body;

  const sql = `
    UPDATE shipments
    SET status = ?
    WHERE tracking_number = ?
  `;

  db.query(sql, [status, tracking_number], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating status" });
    }

    if (result.affectedRows === 0) {
      return res.json({ message: "Tracking not found ❌" });
    }

    res.json({ message: "Status updated successfully ✅" });
  });
});

/* =========================
   TRACKING API
========================= */

app.get("/api/track/:trackingNumber", (req, res) => {

  const trackingNumber = req.params.trackingNumber;

  const sql = "SELECT * FROM shipments WHERE tracking_number = ?";

  db.query(sql, [trackingNumber], (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "Tracking not found" });
    }

    res.json(result[0]);
  });
});

/* =========================
   ADD SHIPMENT
========================= */

app.post("/api/add-shipment", (req, res) => {

  const { tracking_number, shipper_name, consignee_name, status } = req.body;

  const sql = `
    INSERT INTO shipments (tracking_number, shipper_name, consignee_name, status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [tracking_number, shipper_name, consignee_name, status], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error saving shipment" });
    }

    res.json({ message: "Shipment added successfully ✅" });
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
