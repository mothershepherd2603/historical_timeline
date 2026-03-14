const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 255,
        },
        subject: {
            type: String,
            required: true,
            enum: ['general', 'technical', 'subscription', 'refund', 'content', 'privacy', 'legal', 'other'],
        },
        message: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 5000,
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
        },
        ip_address: {
            type: String,
            default: null,
        },
        user_agent: {
            type: String,
            default: null,
        },
        resolved_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Indexes for admin listing
contactQuerySchema.index({ created_at: -1 });
contactQuerySchema.index({ status: 1 });

module.exports = mongoose.model('ContactQuery', contactQuerySchema);
