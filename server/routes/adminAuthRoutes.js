const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For comparing hashed passwords if needed, though for .env it's direct comparison
const dotenv = require('dotenv');
dotenv.config();

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Validate against .env credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Generate JWT
            const token = jwt.sign({ isAdmin: true, email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ message: 'Admin login successful!', token });
        } else {
            return res.status(401).json({ message: 'Invalid admin credentials.' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal server error during admin login.', error: error.message });
    }
});

// Middleware to protect admin routes (optional, but good practice)
router.use((req, res, next) => {
    const token = req.headers['x-auth-token']; // Or from cookies, etc.

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) {
            req.admin = decoded; // Attach admin info to request
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Not an admin token.' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
});

module.exports = router;
