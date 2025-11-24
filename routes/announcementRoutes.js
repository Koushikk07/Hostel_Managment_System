const express = require("express");
const router = express.Router();
const db = require("../db"); // your db connection

// Get all announcements
router.get("/", (req, res) => {
  db.query("SELECT * FROM announcements ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).send("Error fetching announcements");
    res.json(results);
  });
});

// Add new announcement (Admin only)
router.post("/add", (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).send("All fields required");

  db.query(
    "INSERT INTO announcements (title, message) VALUES (?, ?)",
    [title, message],
    (err, result) => {
      if (err) return res.status(500).send("Error adding announcement");
      res.send("Announcement added successfully");
    }
  );
});

module.exports = router;
