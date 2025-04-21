const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

// GET enriched order details
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

// 
router.post('/', authenticateToken, async (req, res) => {
  const { orderid, items } = req.body;

  if (!orderid || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid orderid/items' });
  }

  const rows = items.map(item => ({
    orderid,
    productid: item.productid,
    supplierid: item.supplierid,
    unit_price: item.unit_price,
    requested_quantity: item.requested_quantity,
    order_unit: item.order_unit,
    received_quantity: 0,
    received_date: null
  }));

  const { data, error } = await supabase
    .from('order_detail')
    .insert(rows)
    .select(`*, products (product_name), suppliers (supplier_name)`);

  if (error) {
    console.error('Error inserting order details:', error);
    return res.status(500).json({ error: error.message });
  }

  const enriched = data.map(row => ({
    ...row,
    product_name: row.products?.product_name || 'Unknown',
    supplier_name: row.suppliers?.supplier_name || 'Unknown'
  }));

  res.status(201).json(enriched);
});

// 
router.post('/bulk', authenticateToken, async (req, res) => {
  const orderDetails = req.body;

  if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
    return res.status(400).json({ error: 'No order details provided' });
  }

  const rows = orderDetails.map(item => ({
    orderid: item.orderid,
    productid: item.productid,
    supplierid: item.supplierid,
    unit_price: item.unit_price,
    requested_quantity: item.requested_quantity,
    order_unit: item.order_unit,
    received_quantity: 0,
    received_date: null
  }));

  const { data, error } = await supabase
    .from('order_detail')
    .insert(rows)
    .select(`*, products (product_name), suppliers (supplier_name)`);

  if (error) {
    console.error('Error in /bulk insert:', error);
    return res.status(500).json({ error: error.message });
  }

  const enriched = data.map(row => ({
    ...row,
    product_name: row.products?.product_name || 'Unknown',
    supplier_name: row.suppliers?.supplier_name || 'Unknown'
  }));

  res.status(201).json(enriched);
});

module.exports = router;
