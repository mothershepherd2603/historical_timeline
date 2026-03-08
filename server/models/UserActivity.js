const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    // User information
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for guest/unauthenticated users
    },
    username: {
        type: String,
        default: null
    },
    
    // Activity details
    activity_type: {
        type: String,
        required: true,
        enum: [
            // Authentication activities
            'register', 'login', 'logout', 'login_failed', 'token_expired',
            
            // Profile activities
            'view_profile', 'update_profile', 'change_password',
            
            // Content viewing
            'view_events', 'view_event_detail', 'view_periods', 'view_period_detail',
            'search_events', 'filter_events',
            
            // Media activities
            'view_media', 'view_media_detail', 'access_media_proxy',
            
            // Infrastructure activities
            'view_infrastructure', 'view_infrastructure_detail',
            
            // Subscription activities
            'view_subscription_plans', 'check_subscription_status',
            'create_subscription_order', 'verify_payment', 'subscription_activated',
            'cancel_subscription', 'subscription_expired',
            
            // Admin activities
            'admin_view_users', 'admin_view_subscriptions', 'admin_view_stats',
            'admin_create_period', 'admin_update_period', 'admin_delete_period',
            'admin_create_event', 'admin_update_event', 'admin_delete_event',
            'admin_create_infrastructure', 'admin_update_infrastructure', 'admin_delete_infrastructure',
            'admin_upload_media', 'admin_delete_media',
            
            // Error/Security activities
            'unauthorized_access', 'forbidden_access', 'invalid_token',
            'api_error', 'validation_error'
        ]
    },
    
    action: {
        type: String,
        required: true // Human-readable description of the action
    },
    
    // Request details
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: true
    },
    
    endpoint: {
        type: String,
        required: true
    },
    
    // IP and location tracking
    ip_address: {
        type: String,
        default: null
    },
    
    user_agent: {
        type: String,
        default: null
    },
    
    // Request parameters and body (sanitized)
    query_params: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    request_body: {
        type: mongoose.Schema.Types.Mixed,
        default: null // Sensitive fields like passwords should be removed
    },
    
    route_params: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Response details
    status_code: {
        type: Number,
        required: true
    },
    
    success: {
        type: Boolean,
        default: true
    },
    
    error_message: {
        type: String,
        default: null
    },
    
    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {} // For storing activity-specific data
    },
    
    // Resource references
    resource_type: {
        type: String,
        enum: ['event', 'period', 'media', 'infrastructure', 'subscription', 'user', 'plan', null],
        default: null
    },
    
    resource_id: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Performance tracking
    response_time_ms: {
        type: Number,
        default: null
    },
    
    // Session information
    session_id: {
        type: String,
        default: null
    },
    
    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient querying
userActivitySchema.index({ user_id: 1, timestamp: -1 });
userActivitySchema.index({ activity_type: 1, timestamp: -1 });
userActivitySchema.index({ endpoint: 1, timestamp: -1 });
userActivitySchema.index({ ip_address: 1, timestamp: -1 });
userActivitySchema.index({ success: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 90 days (optional)
// userActivitySchema.index({ created_at: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
