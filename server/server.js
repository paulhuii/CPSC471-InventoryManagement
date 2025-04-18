// server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Removed mongoose, connectDB, User model imports

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supabase with Service Key for backend operations
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use Service Key on the server
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
        // Fetch user from Supabase using the userid from the token
        const { data: user, error } = await supabase
            .from('users')
            .select('userid, email, username, role') // Select necessary fields, exclude password
            .eq('userid', decoded.userId) // Ensure JWT payload uses 'userId' matching the key used during signing
            .single(); // Expect only one user

        if (error || !user) {
            console.error('Token verification error or user not found:', error);
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user; // Attach Supabase user data to the request
        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    // req.user should now be populated by authenticateToken with Supabase data
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
    next();
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    try {
        // Add username to required fields
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required.' });
        }

        // Check if user already exists (by email or username)
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('userid')
            .or(`email.eq.${email},username.eq.${username}`) // Check for email OR username collision
            .maybeSingle(); // Might find one or none

        if (checkError) {
            console.error('Error checking existing user:', checkError);
            return res.status(500).json({ error: 'Database error checking user' });
        }

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user in Supabase 'users' table
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email,
                username,
                password: hashedPassword,
                role: 'user' // Default role
            })
            .select('userid, email, username, role') // Select the data to return
            .single(); // Expecting the single inserted row back

        if (insertError || !newUser) {
            console.error('Error creating user:', insertError);
            return res.status(500).json({ error: 'Failed to create user' });
        }

        // Create token using the Supabase userid
        const token = jwt.sign(
            { userId: newUser.userid }, // Use Supabase 'userid' as 'userId' in the token
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: { // Return data consistent with login response
                id: newUser.userid,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists in Supabase
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('userid, email, username, password, role') // Select password for comparison
            .eq('email', email)
            .single(); // Expect exactly one user or error

        if (findError || !user) {
            // Log the specific error for debugging but send generic message to client
            console.error('Login - User find error or not found:', findError);
            return res.status(400).json({ error: 'Invalid credentials' }); // More secure message
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' }); // More secure message
        }

        // Create token using Supabase userid
        const token = jwt.sign(
            { userId: user.userid }, // Use Supabase 'userid' as 'userId' in the token
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Exclude password from the response
        const userResponse = {
            id: user.userid,
            email: user.email,
            username: user.username,
            role: user.role
        };

        res.json({
            token,
            user: userResponse
        });
    } catch (error) {
         // Catch potential bcrypt errors or others
        console.error('Login error:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

// --- Protected User Routes ---
app.get('/api/users/profile', authenticateToken, (req, res) => {
    // req.user is already populated by authenticateToken with Supabase data (excluding password)
    // No need for another database call here
    res.json(req.user);
});

// --- Admin Routes ---
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Fetch all users from Supabase, excluding password
        const { data: users, error } = await supabase
            .from('users')
            .select('userid, email, username, role'); // Exclude password

        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        res.json(users || []); // Return users or empty array
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

app.put('/api/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const userIdToUpdate = parseInt(req.params.id, 10); // Ensure ID is an integer

        if (isNaN(userIdToUpdate)) {
             return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (!role || (role !== 'admin' && role !== 'user')) {
             return res.status(400).json({ error: 'Invalid role specified' });
        }

        // Update user role in Supabase
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ role })
            .eq('userid', userIdToUpdate)
            .select('userid, email, username, role') // Return the updated user data
            .single(); // Expecting one row to be updated

        if (error) {
            console.error(`Error updating role for user ${userIdToUpdate}:`, error);
            // Check if error indicates user not found (e.g., PostgREST error code P0001 or count 0)
             if (error.code === 'PGRST116' || !updatedUser) { // PGRST116: JSON object requested, multiple (or zero) rows returned
                 return res.status(404).json({ error: 'User not found' });
             }
            return res.status(500).json({ error: 'Failed to update user role' });
        }

         if (!updatedUser) { // Handle cases where update didn't find the user but didn't throw specific error
            return res.status(404).json({ error: 'User not found' });
        }


        res.json(updatedUser);
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});

// --- Inventory Routes (protected) ---
// These routes already use Supabase, so they should be fine.
// Double-check table names ('products' vs 'Products') - ensure consistency!
// Let's assume 'products' is correct based on GET /api/inventory
app.get('/api/inventory', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching products...'); // Debug log
        const { data, error } = await supabase
            .from('products') // Assuming 'products' is the correct table name
            .select('*');

        if (error) {
            console.error('Supabase error fetching inventory:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Sending products data:', data); // Debug log
        res.json(data || []);
    } catch (error) {
        console.error('Server error fetching inventory:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Destructure expected fields for a product
        const {
            product_name, // Check casing consistency with your DB schema
            case_quantity,
            order_unit,
            case_price,
            current_stock,
            max_quantity,
            min_quantity,
            expiration,
            categoryid,
            supplierid,
            // UserID // Removed - not typically needed directly on product, maybe inferred?
        } = req.body;

        const { data, error } = await supabase
            .from('products') // Use consistent table name 'products'
            .insert([{
                product_name,
                case_quantity,
                order_unit,
                case_price,
                current_stock,
                max_quantity,
                min_quantity,
                expiration,
                categoryid,
                supplierid,
                // UserID, // Removed
            }])
            .select(); // Select inserted data to return

        if (error) {
            console.error('Supabase error adding inventory:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data); // Use 201 for created resource
    } catch (error) {
        console.error('Server error adding inventory:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
             return res.status(400).json({ error: 'Invalid product ID format' });
        }

        const {
            product_name, // Check casing
            case_quantity,
            order_unit,
            case_price,
            current_stock,
            max_quantity,
            min_quantity,
            expiration,
            categoryid,
            supplierid,
            // UserID // Removed
        } = req.body;

         // Check your products table schema for the primary key name (e.g., 'productID' or 'id')
        const primaryKeyColumn = 'productID'; // <<< CHANGE THIS if your PK column name is different

        const { data, error } = await supabase
            .from('products') // Use consistent table name
            .update({
                product_name,
                case_quantity,
                order_unit,
                case_price,
                current_stock,
                max_quantity,
                min_quantity,
                expiration,
                categoryid,
                supplierid,
                
            })
            .eq(primaryKeyColumn, productId) // Match on the correct primary key column
            .select(); // Select updated data

        if (error) {
            console.error(`Supabase error updating inventory ${productId}:`, error);
             if (error.code === 'PGRST116') { // Check if update affected 0 rows
                 return res.status(404).json({ error: 'Product not found' });
             }
            return res.status(500).json({ error: error.message });
        }
         if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(data[0]); // Return the first (and only) updated item
    } catch (error) {
        console.error(`Server error updating inventory ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
         const productId = parseInt(req.params.id, 10);
         if (isNaN(productId)) {
             return res.status(400).json({ error: 'Invalid product ID format' });
         }

         // Check your products table schema for the primary key name
        const primaryKeyColumn = 'productID'; // <<< CHANGE THIS if your PK column name is different

        const { error, count } = await supabase
            .from('products') // Use consistent table name
            .delete({ count: 'exact' }) // Request the count of deleted rows
            .eq(primaryKeyColumn, productId); // Match on the correct primary key column

        if (error) {
            console.error(`Supabase error deleting inventory ${productId}:`, error);
            return res.status(500).json({ error: error.message });
        }

        if (count === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' }); // Send 200 OK
    } catch (error) {
        console.error(`Server error deleting inventory ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});


// --- Test endpoints ---
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Removed /api/test-db

app.get('/api/test-supabase', async (req, res) => {
    try {
        console.log('Testing Supabase connection (using service key)...');
        // Test by trying to read from the users table (requires service key or proper RLS)
        const { count, error } = await supabase
            .from('users') // Test against the users table
            .select('*', { count: 'exact', head: true }); // Just get the count, not data

        if (error) {
            console.error('Supabase connection test error:', error);
            throw error;
        }

        res.json({
            message: 'Supabase connection successful (tested reading users table)',
            user_count: count // Return the count
        });
    } catch (error) {
        console.error('Supabase connection test failed:', error);
        res.status(500).json({
            error: 'Supabase connection failed',
            details: error.message
        });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Supabase URL configured: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
    // Do not log keys!
});