# 🚀 Deploy Now - Action Checklist

## Current Status

- ✅ Frontend: https://maanchitra.in (LIVE)
- ✅ Backend: https://historical-timeline-a223.onrender.com (LIVE)
- ⚠️ CORS: Needs update for frontend domain

## Immediate Actions Required

### 1. Update CORS on Render (CRITICAL) ⚡

**Go to Render Dashboard:**

1. Navigate to: https://dashboard.render.com
2. Select your service: `historical-timeline-a223`
3. Click **Environment** tab
4. Find or add `CORS_ORIGIN` variable
5. Set value to: `https://maanchitra.in,https://www.maanchitra.in`
6. Click **Save Changes**
7. **Restart** the service (Manual Deploy button or Restart)

**Why this is important:**
Without correct CORS settings, your frontend at maanchitra.in **cannot** communicate with the backend API. Users will see CORS errors in browser console.

### 2. Deploy Updated Code to Render

```bash
# Commit all changes
git add .
git commit -m "Production ready: Health checks, CORS fix, proper error handling"
git push origin main
```

Then on Render:

- Auto-deploy will trigger (if enabled)
- Or click "Manual Deploy" → "Deploy latest commit"

### 3. Verify Everything Works

**Test from browser:**

1. Open https://maanchitra.in
2. Open browser DevTools (F12)
3. Go to Console tab
4. Should see: `Using production API: https://historical-timeline-a223.onrender.com/api`
5. Try to login or subscribe
6. Should NOT see any CORS errors

**Test API directly:**

```bash
# Health check
curl https://historical-timeline-a223.onrender.com/api/health

# Should return:
# {"status":"healthy","timestamp":"...","environment":"production","mongodb":"connected"}
```

## Environment Variables Checklist

Make sure these are set on Render:

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=your_mongodb_atlas_connection_string`
- [ ] `JWT_SECRET=your_secure_random_secret`
- [ ] `CORS_ORIGIN=https://maanchitra.in,https://www.maanchitra.in` ⚡ CRITICAL
- [ ] `RAZORPAY_KEY_ID=your_key` (if using payments)
- [ ] `RAZORPAY_KEY_SECRET=your_secret` (if using payments)

## Common Issues & Quick Fixes

### Issue: CORS errors in browser console

```
Access to fetch at 'https://historical-timeline-a223.onrender.com/api/...'
from origin 'https://maanchitra.in' has been blocked by CORS policy
```

**Fix:**

1. Set `CORS_ORIGIN=https://maanchitra.in,https://www.maanchitra.in` on Render
2. Restart Render service
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: 404 errors for API endpoints

**Fix:**

1. Deploy latest code to Render
2. Check Render logs for errors
3. Verify routes exist in server.js

### Issue: Authentication not working

**Fix:**

1. Ensure `JWT_SECRET` is set on Render
2. Check that token is being sent in Authorization header
3. Verify MongoDB is connected (check /api/health endpoint)

## Files Updated

- [server/.env.example](server/.env.example) - Updated CORS example
- [PRODUCTION_CONFIG.md](PRODUCTION_CONFIG.md) - Updated with maanchitra.in domain
- [server/server.js](server/server.js) - Added health checks, improved error handling
- [client/js/config.js](client/js/config.js) - Points to Render backend

## Next Steps After Deployment

1. Monitor Render logs for any errors
2. Test all features on https://maanchitra.in
3. Check MongoDB connection is stable
4. Verify payment flow (if applicable)
5. Set up monitoring/alerts (optional)

---

**Priority:** Update CORS_ORIGIN on Render NOW, then deploy code
**Time:** ~5 minutes
**Impact:** Required for frontend-backend communication
