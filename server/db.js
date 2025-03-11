// server/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection string format check:', process.env.MONGODB_URI.includes('mongodb+srv://'));

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log(`MongoDB Connected: \${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection error details:', {
            message: error.message,
            code: error.code,
            errorLabels: error.errorLabelSet ? Array.from(error.errorLabelSet) : [],
            reason: error.reason ? {
                type: error.reason.type,
                setName: error.reason.setName,
                servers: error.reason.servers ? Array.from(error.reason.servers.keys()) : []
            } : null
        });
        process.exit(1);
    }
};

module.exports = connectDB;