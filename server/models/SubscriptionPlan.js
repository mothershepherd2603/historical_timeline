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
    is_active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
