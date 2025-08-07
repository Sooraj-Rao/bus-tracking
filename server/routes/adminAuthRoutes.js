const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const dotenv = require('dotenv');
dotenv.config();


const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            
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


router.use((req, res, next) => {
    const token = req.headers['x-auth-token']; 

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) {
            req.admin = decoded; 
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Not an admin token.' });
        }
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
});

module.exports = router;
