require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const User = require('./models/User');

// Enable mongoose debugging
mongoose.set('debug', true);

const app = express();

// Connect to MongoDB with logging
console.log('Starting server...');
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
connectDB()
    .then(() => console.log('MongoDB connection successful'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
    next();
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            email,
            password: hashedPassword,
            role: 'user' // Default role
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Protected Routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Routes
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inventory Routes (protected)
app.get('/api/inventory', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching products...'); // Debug log
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Sending products data:', data); // Debug log
        res.json(data || []);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            Product_name,
            case_quantity,
            order_unit,
            case_price,
            current_stock,
            max_quantity,
            min_quantity,
            expiration,
            categoryID,
            supplierID,
            UserID
        } = req.body;

        const { data, error } = await supabase
            .from('Products')
            .insert([{
                Product_name,
                case_quantity,
                order_unit,
                case_price,
                current_stock,
                max_quantity,
                min_quantity,
                expiration,
                categoryID,
                supplierID,
                UserID
            }]);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            Product_name,
            case_quantity,
            order_unit,
            case_price,
            current_stock,
            max_quantity,
            min_quantity,
            expiration,
            categoryID,
            supplierID,
            UserID
        } = req.body;

        const { data, error } = await supabase
            .from('Products')
            .update({
                Product_name,
                case_quantity,
                order_unit,
                case_price,
                current_stock,
                max_quantity,
                min_quantity,
                expiration,
                categoryID,
                supplierID,
                UserID
            })
            .eq('productID', req.params.id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('Products')
            .delete()
            .eq('productID', req.params.id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoints
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.json({ message: 'Database connected successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.get('/api/test-supabase', async (req, res) => {
    try {
        console.log('Testing Supabase connection...');
        console.log('Supabase URL exists:', !!process.env.SUPABASE_URL);
        console.log('Supabase ANON KEY exists:', !!process.env.SUPABASE_ANON_KEY);

        const { data, error } = await supabase
            .from('Products')
            .select('count');

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        res.json({
            message: 'Supabase connection successful',
            data
        });
    } catch (error) {
        console.error('Supabase connection error:', error);
        res.status(500).json({
            error: error.message,
            details: error
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});