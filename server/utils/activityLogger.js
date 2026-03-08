const UserActivity = require('../models/UserActivity');

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body) {
    if (!body) return null;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'password_hash', 'current_password', 'new_password', 
                            'confirm_password', 'token', 'secret', 'api_key', 'razorpay_signature'];
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Extract IP address from request
 */
function getIPAddress(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
}

/**
 * Generate session ID from user and timestamp
 */
function generateSessionId(userId, timestamp) {
    if (!userId) return null;
    return `${userId}_${new Date(timestamp).toISOString().split('T')[0]}`;
}

/**
 * Log user activity to database
 * @param {Object} options - Activity logging options
 * @returns {Promise<Object>} Created activity log
 */
async function logActivity(options) {
    try {
        const {
            req,
            activity_type,
            action,
            status_code = 200,
            success = true,
            error_message = null,
            metadata = {},
            resource_type = null,
            resource_id = null,
            response_time_ms = null
        } = options;
        
        // Extract user info
        const user_id = req.user?.id || null;
        const username = req.user?.username || null;
        
        // Create activity log
        const activityLog = new UserActivity({
            user_id,
            username,
            activity_type,
            action,
            method: req.method,
            endpoint: req.originalUrl || req.url,
            ip_address: getIPAddress(req),
            user_agent: req.headers['user-agent'] || null,
            query_params: Object.keys(req.query || {}).length > 0 ? req.query : null,
            request_body: sanitizeRequestBody(req.body),
            route_params: Object.keys(req.params || {}).length > 0 ? req.params : null,
            status_code,
            success,
            error_message,
            metadata,
            resource_type,
            resource_id,
            response_time_ms,
            session_id: generateSessionId(user_id, Date.now()),
            timestamp: new Date()
        });
        
        // Save asynchronously without blocking the response
        activityLog.save().catch(err => {
            console.error('Failed to log activity:', err.message);
        });
        
        return activityLog;
    } catch (err) {
        console.error('Activity logging error:', err.message);
        return null;
    }
}

/**
 * Express middleware to automatically log all requests
 */
function activityLoggingMiddleware(activity_type, action) {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        // Store the original res.json and res.send
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        
        // Track if response was sent
        let responseSent = false;
        
        // Override res.json
        res.json = function(data) {
            if (!responseSent) {
                responseSent = true;
                const responseTime = Date.now() - startTime;
                
                logActivity({
                    req,
                    activity_type,
                    action,
                    status_code: res.statusCode,
                    success: res.statusCode < 400,
                    error_message: res.statusCode >= 400 ? (data?.error || data?.message) : null,
                    metadata: res.statusCode < 400 ? { response_preview: JSON.stringify(data).substring(0, 200) } : {},
                    response_time_ms: responseTime
                });
            }
            
            return originalJson(data);
        };
        
        // Override res.send
        res.send = function(data) {
            if (!responseSent) {
                responseSent = true;
                const responseTime = Date.now() - startTime;
                
                logActivity({
                    req,
                    activity_type,
                    action,
                    status_code: res.statusCode,
                    success: res.statusCode < 400,
                    response_time_ms: responseTime
                });
            }
            
            return originalSend(data);
        };
        
        next();
    };
}

/**
 * Get activity statistics for a user
 */
async function getUserActivityStats(userId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const activities = await UserActivity.aggregate([
            {
                $match: {
                    user_id: userId,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$activity_type',
                    count: { $sum: 1 },
                    last_activity: { $max: '$timestamp' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        return activities;
    } catch (err) {
        console.error('Error fetching user activity stats:', err);
        return [];
    }
}

/**
 * Get recent activities for a user
 */
async function getRecentUserActivities(userId, limit = 20) {
    try {
        return await UserActivity.find({ user_id: userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .select('-request_body -user_agent')
            .lean();
    } catch (err) {
        console.error('Error fetching recent activities:', err);
        return [];
    }
}

/**
 * Get system-wide activity statistics (admin)
 */
async function getSystemActivityStats(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const stats = await UserActivity.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                        activity_type: '$activity_type'
                    },
                    count: { $sum: 1 },
                    unique_users: { $addToSet: '$user_id' },
                    errors: {
                        $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    date: '$_id.date',
                    activity_type: '$_id.activity_type',
                    count: 1,
                    unique_user_count: { $size: '$unique_users' },
                    errors: 1
                }
            },
            {
                $sort: { '_id.date': -1, count: -1 }
            }
        ]);
        
        return stats;
    } catch (err) {
        console.error('Error fetching system activity stats:', err);
        return [];
    }
}

/**
 * Detect suspicious activity patterns
 */
async function detectSuspiciousActivity(userId = null, hours = 24) {
    try {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        
        const matchQuery = { timestamp: { $gte: startDate } };
        if (userId) matchQuery.user_id = userId;
        
        // Find patterns like: too many failed logins, rapid requests, etc.
        const suspiciousPatterns = await UserActivity.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        user_id: '$user_id',
                        ip_address: '$ip_address',
                        activity_type: '$activity_type'
                    },
                    count: { $sum: 1 },
                    failures: {
                        $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
                    }
                }
            },
            {
                $match: {
                    $or: [
                        { failures: { $gt: 5 } }, // More than 5 failures
                        { count: { $gt: 100 } }   // More than 100 requests
                    ]
                }
            }
        ]);
        
        return suspiciousPatterns;
    } catch (err) {
        console.error('Error detecting suspicious activity:', err);
        return [];
    }
}

module.exports = {
    logActivity,
    activityLoggingMiddleware,
    getUserActivityStats,
    getRecentUserActivities,
    getSystemActivityStats,
    detectSuspiciousActivity,
    sanitizeRequestBody,
    getIPAddress
};
