const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');

router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username)
    return res.status(400).json({ error: 'All fields required' });

  const { data: existingUser } = await supabase
    .from('users')
    .select('userid')
    .or(`email.eq.${email},username.eq.${username}`)
    .maybeSingle();

  if (existingUser) return res.status(400).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ email, username, password: hashedPassword, role: 'user' })
    .select('userid, email, username, role')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create user' });

  const token = jwt.sign({ userId: newUser.userid }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({ token, user: newUser });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.userid }, process.env.JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

module.exports = router;

