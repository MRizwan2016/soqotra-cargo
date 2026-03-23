// IMPORT PACKAGES
const express = require("express");
const cors = require("cors");
const path = require("path");

// CREATE APP
const app = express();
app.use(cors());
app.use(express.json());

// 📊 DASHBOARD DATA
// ROOT
app.get("/", (req, res) => {
  res.send("🚀 Cargo API Running");
});
// Serve frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// Load index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
// DASHBOARD API
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
// DATABASE CONNECTION
const mysql = require("mysql2");

const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect(err => {
  if (err) {
    console.error("DB Connection Error:", err);
  } else {
    console.log("Connected to MySQL ✅");
  }
});

// CONNECT DB
db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// TEST API
app.get("/", (req, res) => {
  res.send("🚀 Cargo API Running");
});


// ✅ CREATE SHIPMENT
app.post("/api/shipments", (req, res) => {

  const {
    invoice_no,
    shipper_name,
    consignee_name,
    origin_country,
    destination_country,
    total_weight,
    total_cbm
  } = req.body;

  const sql = `
    INSERT INTO shipments 
    (invoice_no, shipper_name, consignee_name, origin_country, destination_country, total_weight, total_cbm, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    invoice_no,
    shipper_name,
    consignee_name,
    origin_country,
    destination_country,
    total_weight,
    total_cbm,
    "IN TRANSIT"
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error inserting data");
    }

    res.send("✅ Shipment added successfully");
  });

});


// ✅ GET SINGLE SHIPMENT
app.get("/api/shipments/:invoice_no", (req, res) => {

  const { invoice_no } = req.params;

  const sql = "SELECT * FROM shipments WHERE invoice_no = ?";

  db.query(sql, [invoice_no], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error fetching data");
    }

    if (result.length === 0) {
      return res.status(404).send("❌ Shipment not found");
    }

    res.json(result[0]);
  });

});


// ✅ GET ALL SHIPMENTS
app.get("/api/shipments", (req, res) => {

  const sql = "SELECT * FROM shipments ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error fetching shipments");
    }

    res.json(results);
  });

});


// ✅ UPDATE STATUS
app.put("/api/shipments/:invoice_no", (req, res) => {

  const { invoice_no } = req.params;
  const { status } = req.body;

  const sql = "UPDATE shipments SET status = ? WHERE invoice_no = ?";

  db.query(sql, [status, invoice_no], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error updating status");
    }

    res.send("✅ Status updated successfully");
  });

});

// 🔐 LOGIN API
app.post("/api/login", (req, res) => {

  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error");
    }

    if (result.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    res.json({ message: "Login successful" });
  });

});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
