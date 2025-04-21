const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken, isAdmin } = require("../middleware/auth");

router.get("/profile", authenticateToken, (req, res) => {
  res.json(req.user);
});

router.get("/", authenticateToken, isAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("userid, email, username, role")
    .eq("is_active", true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put("/:id/role", authenticateToken, isAdmin, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body;
  if (!["admin", "user"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("userid", userId)
    .select("userid, email, username, role")
    .eq("is_active", true)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    console.log("Attempting to nullify and delete user:", userId);

    // 1. Nullify userid in order_detail (if needed)
    const { data: orders, error: ordersFetchErr } = await supabase
      .from("orders")
      .select("orderid")
      .eq("userid", userId);

    if (ordersFetchErr) {
      throw new Error("Failed to fetch user orders: " + ordersFetchErr.message);
    }

    const orderIds = (orders || []).map((o) => o.orderid);

    if (orderIds.length > 0) {
      const { error: orderDetailsErr } = await supabase
        .from("order_detail")
        .update({ userid: null }) // if order_detail has userid
        .in("orderid", orderIds); // if you want to clear by orderid instead

      if (orderDetailsErr) {
        console.error(
          "Failed to nullify order_detail.userid:",
          orderDetailsErr.message
        );
        // optional: don't throw, continue
      }
    }

    // 2. Nullify userid in orders
    const { error: ordersUpdateErr } = await supabase
      .from("orders")
      .update({ userid: null })
      .eq("userid", userId);

    if (ordersUpdateErr) {
      throw new Error(
        "Failed to nullify orders.userid: " + ordersUpdateErr.message
      );
    }

    // 3. Nullify userid in products
    const { error: productsUpdateErr } = await supabase
      .from("products")
      .update({ userid: null })
      .eq("userid", userId);

    if (productsUpdateErr) {
      throw new Error(
        "Failed to nullify products.userid: " + productsUpdateErr.message
      );
    }

    // 4. Delete from admin_managers
    const { error: adminMgrErr } = await supabase
      .from("admin_managers")
      .delete()
      .eq("userid", userId);

    if (adminMgrErr) {
      throw new Error(
        "Failed to delete from admin_managers: " + adminMgrErr.message
      );
    }

    // 5. Soft delete user
    const { error: deactivateError } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("userid", userId);

    if (deactivateError) {
      return res.status(500).json({ error: deactivateError.message });
    }

    console.log("Successfully deleted user:", userId);
    res.status(204).send();
  } catch (err) {
    console.error("Manual delete failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
