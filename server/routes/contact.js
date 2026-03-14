const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const ContactQuery = require('../models/ContactQuery');

// --- Rate limiter: max 5 submissions per IP per 15 minutes ---
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many requests. Please wait before submitting again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const VALID_SUBJECTS = [
    'general', 'technical', 'subscription', 'refund',
    'content', 'privacy', 'legal', 'other',
];

// --- Validation middleware ---
const validateContact = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Invalid email format.')
        .isLength({ max: 255 }).withMessage('Email must be at most 255 characters.')
        .normalizeEmail(),

    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required.')
        .isIn(VALID_SUBJECTS).withMessage('Invalid subject value.'),

    body('message')
        .trim()
        .notEmpty().withMessage('Message is required.')
        .isLength({ min: 10, max: 5000 }).withMessage('Message must be 10–5000 characters.'),
];

// --- POST /api/contact ---
router.post('/', contactLimiter, validateContact, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const details = {};
        errors.array().forEach((e) => {
            details[e.path] = e.msg;
        });
        return res.status(400).json({ error: 'Validation failed', details });
    }

    const { name, email, subject, message } = req.body;
    const ipAddress = req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    try {
        const query = await ContactQuery.create({
            name,
            email,
            subject,
            message,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        return res.status(201).json({
            message: 'Contact query received successfully.',
            id: query._id,
        });
    } catch (err) {
        console.error('Contact form error:', err);
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

module.exports = router;
