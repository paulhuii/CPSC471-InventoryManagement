
const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

// GET all orders with JOIN to get product_name
router.get('/', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products (product_name)')
    .order('orderid', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: error.message });
  }

 
  const formatted = data.map(o => ({
    ...o,
    product_name: o.products?.product_name || 'Unknown'
  }));

  res.json(formatted);
});

// POST a new order
router.post('/', authenticateToken, async (req, res) => {
  const { productid, quantity, price, supplier } = req.body;
  if (!productid || !quantity || !price || !supplier) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{ productid, quantity, price, supplier }])
    .select();

  if (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ error: error.message });
  }

  await supabase
    .from('products')
    .update({ current_stock: supabase.raw(`current_stock + ${quantity}`) })
    .eq('productid', productid);

  res.status(201).json(data[0]);
});

module.exports = router;
