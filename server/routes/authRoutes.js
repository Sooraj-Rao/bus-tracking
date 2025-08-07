const express = require('express');
const router = express.Router();
const User = require('../models/user');
const OTP = require('../models/otp');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; // Get JWT secret from .env

// Utility to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Middleware to protect user routes (optional, but good practice for user-specific data)
const protectUserRoute = (req, res, next) => {
    const token = req.headers['x-auth-token'];

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// Register User - Step 1: Send OTP
router.post('/register', async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Generate OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10); // Hash OTP for storage

        // Save OTP to database, replacing any existing one for this email
        await OTP.findOneAndUpdate(
            { email },
            { otp: hashedOtp, createdAt: Date.now() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Send OTP via email
        const subject = 'Your OTP for BusTracker Pro Registration';
        const html = `
            <h2>Hello ${userName},</h2>
            <p>Thank you for registering with BusTracker Pro!</p>
            <p>Your One-Time Password (OTP) for email verification is:</p>
            <h3 style="color: #3498db; font-size: 1.5rem;">${otp}</h3>
            <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;
        await sendEmail(email, subject, html);

        res.status(200).json({ message: 'OTP sent to your email for verification.' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.', error: error.message });
    }
});

// Register User - Step 2: Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
    try {
        const { userName, email, password, otp } = req.body;

        const storedOtpRecord = await OTP.findOne({ email });

        if (!storedOtpRecord) {
            return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
        }

        const isOtpValid = await bcrypt.compare(otp, storedOtpRecord.otp);

        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // OTP is valid and not expired, proceed with user registration
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            userName,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        // Delete the OTP record after successful verification
        await OTP.deleteOne({ email });

        // Generate JWT for the newly registered user
        const token = jwt.sign({ id: newUser._id, email: newUser.email, userName: newUser.userName }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Registration successful! You can now log in.', token, user: { id: newUser._id, userName: newUser.userName, email: newUser.email } });
    } catch (error) {
        console.error('Error verifying OTP or registering user:', error);
        res.status(500).json({ message: 'Registration failed. Please try again.', error: error.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT for the logged-in user
        const token = jwt.sign({ id: user._id, email: user.email, userName: user.userName }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful!', token, user: { id: user._id, userName: user.userName, email: user.email } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Login failed. Please try again.', error: error.message });
    }
});

// Get current user (for AuthContext to verify token)
router.get('/me', protectUserRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
