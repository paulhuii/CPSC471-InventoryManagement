
const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken, isAdmin } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      supplier: supplierid (supplier_name),
      order_detail (
        unit_price,
        requested_quantity,
        order_unit,
        orders (order_status, delivered_date)
      )
    `)
  .eq("is_active", true);

  if (error) return res.status(500).json({ error: error.message });

  const updated = data.map(product => {
    const delivered = (product.order_detail || []).filter(
      od => od.orders?.order_status === "delivered"
    );
    const latest = delivered.sort(
      (a, b) => new Date(b.orders?.delivered_date) - new Date(a.orders?.delivered_date)
    )[0];

    return {
      ...product,
      case_price: latest?.unit_price ?? null,
      case_quantity: latest?.requested_quantity ?? null,
      order_unit: latest?.order_unit ?? null
    };
  });

  res.json(updated);
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
  const productid = parseInt(req.params.id, 10);

  // add a check to prevent deleting if pending orders exist
  const { data: orderDetails, error: fetchError } = await supabase
    .from("order_detail")
    .select("orderid, orders (order_status)")
    .eq("productid", productid);

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  const hasPending = orderDetails.some(
    (od) => od.orders?.order_status && od.orders.order_status !== "delivered"
  );

  if (hasPending) {
    return res.status(400).json({
      error: "Cannot delete product with active or pending orders.",
    });
  }

  //setting is_active to false
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("productid", productid)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Product archived successfully" });
});


router.get("/restock", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
  .from("products")
  .select(`
    *,
    supplier: supplierid (supplier_name),
    order_detail (
      unit_price,
      requested_quantity,
      order_unit,
      orders (order_status, delivered_date)
    )
  `)
  .eq("is_active", true); 


  if (error) {
    console.error("Error fetching restock recommendations:", error); 
    return res.status(500).json({ error: error.message });
  }

  const filtered = data.filter(
    product => product.current_stock < product.min_quantity
  );

  res.json(filtered);
});

router.post("/:productid/add-stock", authenticateToken, isAdmin, async (req, res) => {
  const productid = parseInt(req.params.productid, 10);
  const { quantity } = req.body;

  if (isNaN(productid)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  if (!Number.isFinite(quantity)) {
    return res.status(400).json({ error: "Invalid or missing quantity" });
  }

  const { data: currentData, error: fetchError } = await supabase
    .from("products")
    .select("current_stock")
    .eq("productid", productid)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!currentData)
    return res.status(404).json({ error: "Product not found" });

  const newStock = currentData.current_stock + quantity;

  const { data, error } = await supabase
    .from("products")
    .update({ current_stock: newStock })
    .eq("productid", productid)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data[0]);
});

module.exports = router;