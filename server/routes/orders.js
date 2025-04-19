// routes/orders.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

router.get('/pending', authenticateToken, async (req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        orderid,
        order_date,
        order_status,
        total_amount,
        suppliers (supplier_name),
        order_detail (
          requested_quantity,
          unit_price,
          products (product_name)
        )
      `)
      .eq('order_status', 'pending')
      .order('orderid', { ascending: false });
  
    if (error) {
      console.error('Error fetching pending orders:', error);
      return res.status(500).json({ error: error.message });
    }
  
    res.json(data);
  });

// POST /api/orders
router.post('/', authenticateToken, async (req, res) => {
    const { order_date, total_amount, supplierid, userid } = req.body;
  
    if (!order_date || total_amount === undefined || !supplierid || !userid) {
      return res.status(400).json({ error: 'Missing required fields (order_date, total_amount, supplierid, userid)' });
    }
  
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_date,
          total_amount,
          supplierid,
          userid,
          order_status: 'pending'
        }
      ])
      .select();
  
    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: error.message });
    }
  
    res.status(201).json(data[0]);
  });

module.exports = router;
