const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    payment_method: {
        type: String,
        default: 'razorpay',
        trim: true
    },
    payment_amount: {
        type: Number,
        min: 0
    },
    payment_id: {
        type: String,
        trim: true
    },
    order_id: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
