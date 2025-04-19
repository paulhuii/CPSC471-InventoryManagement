// routes/orders.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

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
