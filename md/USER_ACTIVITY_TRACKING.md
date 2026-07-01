# User Activity Tracking System

## Overview

A comprehensive user activity tracking system has been implemented to monitor and record all user interactions with the Historical Timeline Web Application in detail.

## Features

### 1. Comprehensive Activity Logging

- **Authentication Activities**: Login, logout, registration, failed attempts
- **Profile Activities**: View profile, update profile, changes
- **Content Viewing**: Events, periods, media, infrastructure browsing
- **Search & Filter**: Event searches, filtered queries
- **Subscription Activities**: View plans, check status, create orders, payment verification
- **Admin Actions**: All CRUD operations on periods, events, media, infrastructure
- **Error Tracking**: Validation errors, unauthorized access, API errors

### 2. Detailed Data Capture

Each activity log captures:

- **User Information**: User ID, username (or null for guests)
- **Activity Details**: Type, action description, success/failure
- **Request Details**: HTTP method, endpoint, query parameters, request body (sanitized)
- **Network Details**: IP address, user agent
- **Response Details**: Status code, error messages
- **Performance**: Response time in milliseconds
- **Context**: Resource type/ID, session ID, metadata

### 3. Security & Privacy

- **Sensitive Data Protection**: Passwords, tokens, and secrets are automatically redacted
- **Guest Tracking**: Anonymous users are tracked with null user_id
- **Session Tracking**: Activities grouped by user and date for session analysis

## Database Model

### UserActivity Schema

```javascript
{
  user_id: ObjectId,           // User reference (null for guests)
  username: String,            // Username for quick lookup
  activity_type: String,       // Enum of activity types
  action: String,              // Human-readable description
  method: String,              // GET, POST, PUT, DELETE
  endpoint: String,            // API endpoint path
  ip_address: String,          // Client IP
  user_agent: String,          // Browser/client info
  query_params: Mixed,         // URL query parameters
  request_body: Mixed,         // Request body (sanitized)
  route_params: Mixed,         // URL route parameters
  status_code: Number,         // HTTP response status
  success: Boolean,            // Success/failure flag
  error_message: String,       // Error details if failed
  metadata: Mixed,             // Activity-specific data
  resource_type: String,       // Type of resource (event, period, etc.)
  resource_id: Mixed,          // ID of the resource
  response_time_ms: Number,    // Response time
  session_id: String,          // Session identifier
  timestamp: Date,             // Activity timestamp
  created_at: Date            // Record creation time
}
```

### Indexes

- `user_id + timestamp` - Fast user activity queries
- `activity_type + timestamp` - Activity type analysis
- `endpoint + timestamp` - Endpoint usage tracking
- `ip_address + timestamp` - IP-based security monitoring
- `success + timestamp` - Error rate analysis

## Activity Types

### Authentication

- `register` - User registration
- `login` - Successful login
- `logout` - User logout
- `login_failed` - Failed login attempt
- `token_expired` - Expired token usage

### Profile Management

- `view_profile` - Profile viewing
- `update_profile` - Profile updates
- `change_password` - Password changes

### Content Viewing

- `view_events` - Events list viewing
- `view_event_detail` - Individual event viewing
- `view_periods` - Periods list viewing
- `search_events` - Event searches/filtering
- `view_media` - Media browsing
- `view_infrastructure` - Infrastructure viewing

### Subscriptions

- `view_subscription_plans` - Plans page view
- `check_subscription_status` - Status checks
- `create_subscription_order` - Payment order creation
- `verify_payment` - Payment verification
- `subscription_activated` - Subscription activation
- `cancel_subscription` - Subscription cancellation

### Admin Actions

- `admin_view_users` - User management
- `admin_view_subscriptions` - Subscription management
- `admin_view_stats` - Analytics viewing
- `admin_create_*` - Create operations
- `admin_update_*` - Update operations
- `admin_delete_*` - Delete operations

### Errors

- `unauthorized_access` - Unauthorized access attempts
- `forbidden_access` - Forbidden operations
- `invalid_token` - Invalid token usage
- `api_error` - Server errors
- `validation_error` - Validation failures

## Admin Analytics Endpoints

### 1. Activity Logs

**GET** `/api/admin/activity/logs`

Query all activity logs with filters.

**Query Parameters:**

- `user_id` - Filter by user
- `activity_type` - Filter by activity type
- `success` - Filter by success/failure (true/false)
- `start_date` - Filter from date
- `end_date` - Filter to date
- `limit` - Results limit (default: 100)
- `skip` - Pagination offset

**Example:**

```bash
GET /api/admin/activity/logs?activity_type=login&success=false&limit=50
```

### 2. Activity Statistics

**GET** `/api/admin/activity/stats`

Get aggregated statistics for a time period.

**Query Parameters:**

- `days` - Number of days to analyze (default: 7)

**Response:**

```json
{
  "period_days": 7,
  "total_activities": 1523,
  "unique_users": 45,
  "total_errors": 23,
  "daily_stats": [...]
}
```

### 3. User Activity History

**GET** `/api/admin/activity/user/:userId`

Get detailed activity history for a specific user.

**Query Parameters:**

- `days` - History period (default: 30)
- `limit` - Recent activities limit (default: 50)

**Example:**

```bash
GET /api/admin/activity/user/507f1f77bcf86cd799439011?days=7&limit=20
```

### 4. Suspicious Activity Detection

**GET** `/api/admin/activity/suspicious`

Detect suspicious patterns like:

- Multiple failed login attempts
- Abnormally high request rates
- Unusual access patterns

**Query Parameters:**

- `hours` - Detection window (default: 24)

**Response:**

```json
{
  "period_hours": 24,
  "suspicious_patterns": [
    {
      "_id": {
        "user_id": "...",
        "ip_address": "192.168.1.1",
        "activity_type": "login_failed"
      },
      "count": 15,
      "failures": 15
    }
  ]
}
```

### 5. Activity Breakdown

**GET** `/api/admin/activity/breakdown`

Get activity counts grouped by type.

**Query Parameters:**

- `days` - Analysis period (default: 7)

**Response:**

```json
{
  "period_days": 7,
  "breakdown": [
    {
      "activity_type": "view_events",
      "count": 532,
      "success_count": 530,
      "error_count": 2,
      "unique_user_count": 42,
      "success_rate": 99.62
    }
  ]
}
```

## User Profile Activity

**GET** `/api/profile/activity`

Users can view their own recent activity.

**Query Parameters:**

- `limit` - Number of activities (default: 20)

**Authentication:** Required

## Usage Examples

### Backend Implementation

Activity logging is already integrated into all routes. No manual calls needed for standard endpoints.

For custom logging:

```javascript
const { logActivity } = require("./utils/activityLogger");

// In any route handler
await logActivity({
  req,
  activity_type: "custom_action",
  action: "Description of what happened",
  status_code: 200,
  success: true,
  metadata: {
    custom_field: "value",
    count: 5,
  },
  resource_type: "event",
  resource_id: eventId,
});
```

### Querying Activities

```javascript
const UserActivity = require("./models/UserActivity");

// Get all login attempts in last 24 hours
const logins = await UserActivity.find({
  activity_type: "login",
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
}).sort({ timestamp: -1 });

// Get user's failed actions
const failures = await UserActivity.find({
  user_id: userId,
  success: false,
}).limit(10);

// Get most active users
const activeUsers = await UserActivity.aggregate([
  { $match: { user_id: { $ne: null } } },
  { $group: { _id: "$user_id", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

## Performance Considerations

### 1. Asynchronous Logging

Activity logging is non-blocking and doesn't slow down API responses.

### 2. Indexes

Multiple indexes ensure fast queries even with millions of records.

### 3. Optional TTL

Uncomment the TTL index in the schema to auto-delete old logs:

```javascript
// In UserActivity.js
userActivitySchema.index({ created_at: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
```

### 4. Data Sanitization

Sensitive fields are automatically redacted to save space and protect privacy.

## Analytics Use Cases

### Security Monitoring

- Detect brute force login attempts
- Identify suspicious IP addresses
- Track unauthorized access attempts
- Monitor unusual activity patterns

### User Behavior Analysis

- Understand feature usage
- Track user journeys
- Identify drop-off points
- Measure engagement

### Performance Tracking

- Monitor response times
- Identify slow endpoints
- Track error rates
- Detect performance degradation

### Business Intelligence

- Subscription conversion rates
- Content popularity
- User retention metrics
- Feature adoption rates

## Data Retention

By default, all activity logs are retained indefinitely. Consider:

1. **Enable TTL**: Auto-delete logs after 90 days
2. **Archive Old Data**: Export to cold storage periodically
3. **Aggregate Historical Data**: Keep summaries, delete raw logs
4. **Selective Retention**: Keep critical events longer

## Security & Compliance

### Data Protection

- Passwords are automatically redacted
- Personal data can be filtered
- IP addresses are stored for security
- User agent helps identify automated attacks

### GDPR Compliance

Users can request:

- Export of their activity data
- Deletion of their activity data

Implement endpoints:

```javascript
// Export user data
GET /api/profile/activity/export

// Delete user data (GDPR right to be forgotten)
DELETE /api/profile/activity
```

## Monitoring & Alerts

Consider setting up alerts for:

- High error rates (>5% in 1 hour)
- Failed login spikes (>10 failures from one IP)
- Unusual admin activity
- Performance degradation (avg response time >1000ms)

## Future Enhancements

1. **Real-time Dashboard**: Live activity monitoring
2. **Advanced Analytics**: Machine learning for anomaly detection
3. **Export Functionality**: CSV/JSON export of activity data
4. **Webhooks**: Real-time notifications for critical events
5. **Activity Replay**: Reconstruct user sessions
6. **Geolocation**: Track user locations via IP
7. **Device Fingerprinting**: Identify unique devices

## Testing

To test the activity tracking system:

```bash
# 1. Register a new user
POST /api/register
# Check UserActivity for 'register' activity

# 2. Login
POST /api/login
# Check for 'login' activity

# 3. View events
GET /api/events
# Check for 'view_events' activity

# 4. Check admin stats
GET /api/admin/activity/stats
# Verify stats are calculated correctly
```

## Summary

The user activity tracking system provides comprehensive visibility into all user interactions with the application. It captures detailed information about every action, enabling security monitoring, behavioral analysis, and business intelligence while protecting user privacy through automatic data sanitization.

All major user-facing endpoints now automatically log activities, and admin endpoints provide powerful analytics capabilities for monitoring and analyzing usage patterns.
