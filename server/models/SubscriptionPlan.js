const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    plan_type: {
        type: String,
        required: true,
        enum: ['monthly', 'yearly', 'quarterly', 'lifetime'],
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration_days: {
        type: Number,
        required: true,
        min: 1
    },
    features: {
        type: [String],
        default: []
    },
    is_recommended: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update the updated_at timestamp before saving
subscriptionPlanSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
