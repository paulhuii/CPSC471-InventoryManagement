const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

// GET enriched order details with product and supplier names
router.get('/', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('order_detail')
    .select(`
      *,
      products (product_name),
      suppliers (supplier_name)
    `)
    .order('orderid', { ascending: false });

  if (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: error.message });
  }

  const formatted = data.map(row => ({
    ...row,
    product_name: row.products?.product_name || 'Unknown',
    supplier_name: row.suppliers?.supplier_name || 'Unknown'
  }));

  res.json(formatted);
});

// POST a new order detail
router.post('/', authenticateToken, async (req, res) => {
  const {
    productid,
    supplierid,
    unit_price,
    requested_quantity
  } = req.body;

  if (!productid || !supplierid || !unit_price || !requested_quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Optional: You can auto-generate orderid with a serial in the database
  const { data, error } = await supabase
    .from('order_detail')
    .insert([{
      productid,
      supplierid,
      unit_price,
      requested_quantity,
      received_quantity: 0,
      received_date: null
    }])
    .select(`
      *,
      products (product_name),
      suppliers (supplier_name)
    `);

  if (error) {
    console.error('Error inserting order detail:', error);
    return res.status(500).json({ error: error.message });
  }

  const inserted = {
    ...data[0],
    product_name: data[0]?.products?.product_name || 'Unknown',
    supplier_name: data[0]?.suppliers?.supplier_name || 'Unknown'
  };

  res.status(201).json(inserted);
});

module.exports = router;
