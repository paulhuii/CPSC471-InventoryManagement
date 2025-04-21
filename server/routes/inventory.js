
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
  const productid = parseInt(req.params.id, 10);
  const updatedFields = req.body; 
  const userid = req.user.userid; // Get userid from authenticated user

  if (isNaN(productid)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    // --- Fetch the Old Quantity ---
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("current_stock")
      .eq("productid", productid)
      .single();

    if (fetchError) {
      console.error("Error fetching current stock:", fetchError);
      return res.status(500).json({ error: "Failed to fetch product before update." });
    }
    if (!currentProduct) {
      return res.status(404).json({ error: "Product not found." });
    }
    const old_quantity = currentProduct.current_stock;

    // ---  Perform the Stock Update ---
    const { data: updatedData, error: updateError } = await supabase
      .from("products")
      .update(updatedFields) 
      .eq("productid", productid)
      .select() 
      .single();

    if (updateError) {
      console.error("Error updating product:", updateError);
      return res.status(500).json({ error: updateError.message });
    }
    if (!updatedData) {
        return res.status(404).json({ error: "Product not found after update attempt." });
    }

    // 
    const new_quantity = updatedData.current_stock; 

    //
    if (updatedFields.hasOwnProperty('current_stock') && new_quantity !== old_quantity) {
      const quantity_changed = new_quantity - old_quantity;

      const { error: transactionError } = await supabase
        .from("inventory_transaction")
        .insert({
          userid: userid,
          productid: productid,
          transaction_date: new Date(), // Use current server time
          quantity_changed: quantity_changed,
          old_quantity: old_quantity,
          new_quantity: new_quantity,
          transaction_type: 'manual_update' 
        });

      if (transactionError) {
        console.error("Failed to log inventory transaction:", transactionError);
      }
    }

    res.json(updatedData); // Return the updated product data

  } catch (err) {
      console.error("Unexpected error in PUT /inventory/:id:", err);
      res.status(500).json({ error: "An unexpected server error occurred." });
  }
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
  const { quantity: quantityToAdd } = req.body; // Rename for clarity
  const userid = req.user.userid; // Get userid

  if (isNaN(productid)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }
  if (typeof quantityToAdd !== 'number' || quantityToAdd <= 0) { // Ensure quantity is positive
    return res.status(400).json({ error: "Invalid or missing quantity (must be a positive number)" });
  }

  try {
    // Fetch the Old Quantity ---
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("current_stock")
      .eq("productid", productid)
      .single();

    if (fetchError) {
        console.error("Error fetching current stock:", fetchError);
        return res.status(500).json({ error: "Failed to fetch product before adding stock." });
    }
    if (!currentProduct) {
        return res.status(404).json({ error: "Product not found." });
    }
    const old_quantity = currentProduct.current_stock;

    // Perform the Stock Update ---
    const new_quantity = old_quantity + quantityToAdd; // Calculate new stock

    const { data: updatedData, error: updateError } = await supabase
      .from("products")
      .update({ current_stock: new_quantity }) // Update with calculated value
      .eq("productid", productid)
      .select()
      .single();

    if (updateError) {
        console.error("Error adding stock:", updateError);
        return res.status(500).json({ error: updateError.message });
    }
     if (!updatedData) {
        return res.status(404).json({ error: "Product not found after stock update attempt." });
    }

    // Log Transaction ---
    const { error: transactionError } = await supabase
      .from("inventory_transaction")
      .insert({
        userid: userid,
        productid: productid,
        transaction_date: new Date(),
        quantity_changed: quantityToAdd,
        old_quantity: old_quantity,
        new_quantity: new_quantity,
        transaction_type: 'order_received' 
      });

    if (transactionError) {
      console.error("Failed to log inventory transaction for stock add:", transactionError);
    }

    res.json(updatedData); 

  } catch (err) {
      console.error("Unexpected error in POST /inventory/:productid/add-stock:", err);
      res.status(500).json({ error: "An unexpected server error occurred." });
  }
});

module.exports = router;