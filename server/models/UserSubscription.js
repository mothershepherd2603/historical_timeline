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
    plan_type: {
        type: String,
        required: true,
        enum: ['monthly', 'yearly', 'quarterly', 'lifetime'],
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
        trim: true
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
    amount_paid: {
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
    payment_history: [{
        razorpay_order_id: String,
        razorpay_payment_id: String,
        amount_paid: Number,
        paid_at: {
            type: Date,
            default: Date.now
        }
    }],
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
userSubscriptionSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
