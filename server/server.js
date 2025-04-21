// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Modular route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');
const orderDetailRoutes = require('./routes/orderDetail'); // Renamed variable for clarity
const ordersRoutes = require('./routes/orders');
const supplierRoutes = require('./routes/suppliers');
const reportRoutes = require('./routes/reports'); 
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/order-detail', orderDetailRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes); 

// Test route
app.get('/api/test', (req, res) => res.json({ message: 'Server is running!' }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});