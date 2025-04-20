const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken, isAdmin } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("products").select(`
      *,
      supplier: supplierid (
        supplier_name
      )
    `);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .insert([req.body])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { data, error } = await supabase
    .from("products")
    .update(req.body)
    .eq("productid", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { error, count } = await supabase
    .from("products")
    .delete({ count: "exact" })
    .eq("productid", id);
  if (error) return res.status(500).json({ error: error.message });
  if (count === 0) return res.status(404).json({ error: "Product not found" });
  res.json({ message: "Product deleted successfully" });
});

// GET /api/inventory/restock
router.get("/restock", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("products").select(`
      *,
      supplier: supplierid (
        supplier_name
      )
    `);

  if (error) {
    console.error("Error fetching restock recommendations:", error);
    return res.status(500).json({ error: error.message });
  }

  // Filter in JS: only return items that are below their min_quantity
  const filtered = data.filter(
    (product) => product.current_stock < product.min_quantity
  );

  res.json(filtered);
});

module.exports = router;
