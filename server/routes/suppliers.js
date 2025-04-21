// server/routes/suppliers.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken, isAdmin } = require("../middleware/auth"); 

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

  // --- Validation ---
  if (!supplier_name) {
    return res.status(400).json({ error: "Supplier name is required." });
  }
  if (!contact) return res.status(400).json({ error: "Contact is required." });
  if (!email) return res.status(400).json({ error: "Email is required." });
  if (!address) return res.status(400).json({ error: "Address is required." });


  try {
    //  ---
    const { data: existingSupplier, error: checkError } = await supabase
      .from("suppliers")
      .select("supplierid")
      .ilike("supplier_name", supplier_name) 
      .maybeSingle(); 

    if (checkError) {
        console.error("Error checking for existing supplier:", checkError);
        
        return res.status(500).json({ error: "Database error checking supplier." });
    }

    if (existingSupplier) {
      return res.status(409).json({ 
           error: `Supplier "${supplier_name}" already exists.`
        });
    }

    // --- Insert new supplier ---
    const { data: newSupplier, error: insertError } = await supabase
      .from("suppliers")
      .insert([{ supplier_name, contact, email, address }])
      .select() 
      .single(); 

    if (insertError) {
      console.error("Error inserting supplier:", insertError);
      return res.status(500).json({ error: "Failed to add new supplier." });
    }

  
    res.status(201).json(newSupplier); // Return the newly created supplier object

  } catch(err) {
      // Catch any unexpected errors during the process
      console.error("Unexpected error during supplier creation:", err);
      res.status(500).json({ error: "An unexpected server error occurred." });
  }
});

module.exports = router;