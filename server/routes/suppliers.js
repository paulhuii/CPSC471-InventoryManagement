// routes/suppliers.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken } = require("../middleware/auth");

// GET /api/suppliers
router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("suppliers").select("*");

  if (error) {
    console.error("Error fetching suppliers:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// POST /api/suppliers
router.post("/", authenticateToken, async (req, res) => {
  const { supplier_name, contact, email, address } = req.body;

  if (!supplier_name || !contact || !email || !address) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert([{ supplier_name, contact, email, address }])
    .select()
    .single();

  if (error) {
    console.error("Error inserting supplier:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;
