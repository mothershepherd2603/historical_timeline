const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const ContactQuery = require('../models/ContactQuery');

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// --- GET /api/admin/contact-queries?status=open&page=1&limit=20 ---
router.get('/', async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip  = (page - 1) * limit;

        const filter = {};
        if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const [queries, total] = await Promise.all([
            ContactQuery.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id name email subject message status created_at resolved_at'),
            ContactQuery.countDocuments(filter),
        ]);

        return res.json({
            queries: queries.map((q) => ({
                id: q._id,
                name: q.name,
                email: q.email,
                subject: q.subject,
                message: q.message,
                status: q.status,
                created_at: q.created_at,
                resolved_at: q.resolved_at,
            })),
            total,
            page,
            limit,
        });
    } catch (err) {
        console.error('Admin contact queries error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- PATCH /api/admin/contact-queries/:id ---
const validateStatusUpdate = [
    body('status')
        .notEmpty().withMessage('Status is required.')
        .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}.`),
];

router.patch('/:id', validateStatusUpdate, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.mapped() });
    }

    try {
        const update = { status: req.body.status };
        if (req.body.status === 'resolved' || req.body.status === 'closed') {
            update.resolved_at = new Date();
        }

        const updated = await ContactQuery.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        ).select('_id name email subject status resolved_at created_at');

        if (!updated) {
            return res.status(404).json({ error: 'Query not found.' });
        }

        return res.json({ message: 'Status updated.', query: { id: updated._id, ...updated.toObject() } });
    } catch (err) {
        console.error('Admin update contact query error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- DELETE /api/admin/contact-queries/:id ---
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await ContactQuery.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: 'Query not found.' });
        }

        return res.json({ message: 'Contact query deleted successfully.' });
    } catch (err) {
        console.error('Admin delete contact query error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
