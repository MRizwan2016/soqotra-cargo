// IMPORT PACKAGES
const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({
  secret: "soqotra_secret_key",
  resave: false,
  saveUninitialized: true
}));

app.get("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// ==============================
// DASHBOARD STATS API
// ==============================

app.get("/api/stats", checkAuth, (req, res) => {

  const sql = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered,
      SUM(CASE WHEN status = 'IN TRANSIT' THEN 1 ELSE 0 END) AS transit
    FROM shipments
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error loading stats" });
    }

    res.json(result[0]);
  });

});

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

  if (username === "admin" && password === "1234") {
    req.session.user = username;
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
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

/* ========================
   API SHIPMENTS
======================== */
      
app.get("/api/shipments", checkAuth, (req, res) => {

  const sql = "SELECT * FROM shipments ORDER BY created_at DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching shipments" });
    }

    res.json(results);
  });

});

// ==========================
//   API UPDATE STATUS
// ========================== 
app.put("/api/update-status", checkAuth, (req, res) => {

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

function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// ======================
// TRACKING API
// ======================

app.get("/api/track/:trackingNumber", (req, res) => {

  const trackingNumber = req.params.trackingNumber;

  const sql = "SELECT * FROM shipments WHERE LOWER(tracking_number) = LOWER(?)";

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

app.get("/api/shipments", checkAuth, (req, res) => {

  const sql = "SELECT * FROM shipments ORDER BY created_at DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching shipments" });
    }

    res.json(results);
  });

});

// ========================
// DELETE SHIPMENT
// ========================
app.delete("/api/delete/:id", checkAuth, (req, res) => {

  const id = req.params.id;

  const sql = "DELETE FROM shipments WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting shipment" });
    }

    res.json({ message: "Shipment deleted successfully 🗑️" });
  });

});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
