const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('userid, email, username, role');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/:id/role', authenticateToken, isAdmin, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('userid', userId)
    .select('userid, email, username, role')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;

