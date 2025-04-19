// routes/suppliers.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*');

  if (error) {
    console.error('Error fetching suppliers:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;
