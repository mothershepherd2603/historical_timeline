# API 404 Error - Diagnosis and Fix

## Issue

Getting 404 error for: `POST https://historical-timeline-a223.onrender.com/api/subscribe/create-order`

## Root Cause Analysis

### ✅ What We Verified (All Working):

1. Route exists in [server/server.js](server/server.js#L313)
2. API endpoint responds correctly (returns 401 for unauthenticated requests)
3. Other API endpoints work fine (`/api/periods`, `/api/health`)

### ❌ Likely Causes:

1. **Stale deployment on Render** - Code changes not deployed
2. **Server not restarted** - Old code still running
3. **Build cache** - Render using cached version

## Changes Made

### 1. Improved Authentication Middleware

- Changed from `res.sendStatus(401)` to proper JSON responses
- Better error messages for debugging

### 2. Added Health Check Endpoints

- `/health` - Basic server health
- `/api/health` - API health with MongoDB status

### 3. Added Request Logging

- All requests are now logged with timestamp and path
- Helps debug routing issues

### 4. Added 404 Handler

- Custom 404 handler for undefined API routes
- Provides detailed error information

### 5. Added Global Error Handler

- Catches all unhandled errors
- Prevents server crashes

## How to Fix the 404 Error

### Option 1: Redeploy on Render (Recommended)

1. **Push changes to Git:**

   ```bash
   git add .
   git commit -m "Add health checks and improve error handling"
   git push origin main
   ```

2. **Trigger Render deployment:**

   - Go to Render Dashboard → Your Service
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or wait for auto-deployment if configured

3. **Verify deployment:**
   - Check Render logs for "Server running on port XXXX"
   - Test health endpoint: `https://historical-timeline-a223.onrender.com/api/health`

### Option 2: Restart Render Service

1. Go to Render Dashboard
2. Select your service
3. Click "Restart" button
4. Wait for service to come back online

### Option 3: Clear Build Cache

1. Go to Render Dashboard → Your Service → Settings
2. Scroll to "Build & Deploy"
3. Click "Clear build cache"
4. Trigger a new deployment

## Verification Steps

### 1. Test Health Endpoint

```bash
curl https://historical-timeline-a223.onrender.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T...",
  "environment": "production",
  "mongodb": "connected"
}
```

### 2. Test Subscribe Endpoint (No Auth)

```bash
curl -X POST https://historical-timeline-a223.onrender.com/api/subscribe/create-order \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly"}'
```

Expected response:

```json
{
  "error": "Authentication required"
}
```

Status should be **401** (not 404!)

### 3. Check Render Logs

In Render Dashboard → Your Service → Logs, you should see:

```
Server running on port 10000
Environment: production
CORS Origin: *
MongoDB URI: mongodb+srv://...
```

And request logs like:

```
2026-01-14T12:34:56.789Z - POST /api/subscribe/create-order
```

## Common Issues & Solutions

### Still Getting 404?

1. **Check you're hitting the right URL:**

   - ✅ `https://historical-timeline-a223.onrender.com/api/subscribe/create-order`
   - ❌ `https://historical-timeline-a223.onrender.com/subscribe/create-order` (missing `/api`)

2. **Verify deployment status:**

   - Check Render dashboard shows "Live" status
   - Look for green checkmark on latest deploy

3. **Check client config:**

   - Open browser console
   - Look for: "Using production API: https://historical-timeline-a223.onrender.com/api"

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

### Getting CORS Errors?

Make sure `CORS_ORIGIN` environment variable is set on Render:

- Set to `*` for testing (allows all origins)
- Set to your frontend domain for production: `https://yourdomain.com`

## Next Steps

1. **Deploy the updated code to Render**
2. **Set environment variables** (if not already set):

   - `NODE_ENV=production`
   - `MONGODB_URI=your_connection_string`
   - `JWT_SECRET=your_secret_key`
   - `CORS_ORIGIN=*` (or your domain)

3. **Test the endpoints** using the test script:

   ```bash
   node test-api.js
   ```

4. **Monitor Render logs** for any errors during requests

## Files Modified

- [server/server.js](server/server.js) - Added health checks, logging, better error handling
- [test-api.js](test-api.js) - Created test script for API verification
- This diagnostic guide

---

**Status:** Code fixed locally, needs deployment to Render
**Priority:** Redeploy to Render to apply fixes
