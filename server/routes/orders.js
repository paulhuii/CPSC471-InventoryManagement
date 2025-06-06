// routes/orders.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken } = require("../middleware/auth");

// GET /api/orders/pending
router.get("/pending", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        orderid,
        order_date,
        order_status,
        total_amount,
        suppliers (supplier_name),
        order_detail (
          productid,
          requested_quantity,
          unit_price,
          products (productid, product_name)
        )
      `
    )
    .eq("order_status", "pending")
    .order("orderid", { ascending: false });

  if (error) {
    console.error("Error fetching pending orders:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// GET /api/orders/processing
router.get("/processing", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
            orderid, order_date, order_status, total_amount,
            order_detail (
              requested_quantity, unit_price,
              products (
                productid,
                product_name,
                supplier:suppliers!supplierid ( supplier_name )
              )
            )
          `
    )
    .eq("order_status", "processing")
    .order("order_date", { ascending: false });

  if (error) {
    console.error("Error fetching processing orders:", error.message);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch processing orders" });
  }
  res.json(data);
});

// GET /api/orders/delivered
router.get("/delivered", authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
            orderid, order_date, delivered_date, total_amount,
            order_detail (
              requested_quantity, unit_price,
              products (               
                product_name,
                supplier:supplierid (supplier_name)
              )
            )
          `
    )
    .eq("order_status", "delivered")
    .order("delivered_date", { ascending: false, nullsFirst: false })
    .order("orderid", { ascending: false });

  if (error) {
    console.error("Error fetching delivered orders:", error.message);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch delivered orders" });
  }

  res.json(data);
});

// POST /api/orders
router.post("/", authenticateToken, async (req, res) => {
  const { order_date, total_amount, supplierid, userid } = req.body;

  if (!order_date || total_amount === undefined || !supplierid || !userid) {
    return res.status(400).json({
      error:
        "Missing required fields (order_date, total_amount, supplierid, userid)",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can place orders." });
  }

  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        order_date,
        total_amount,
        supplierid,
        userid,
        order_status: "pending",
      },
    ])
    .select();

  if (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

// PUT /api/orders/:orderid/status
router.put("/:orderid/status", authenticateToken, async (req, res) => {
  const { orderid } = req.params;
  const { order_status } = req.body;
  const updates = { order_status };

  if (
    !["pending", "processing", "delivered", "cancelled"].includes(order_status)
  ) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  if (order_status === "delivered") {
    updates.delivered_date = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("orderid", orderid)
    .select();

  if (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

module.exports = router;
