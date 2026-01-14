# API Connection Troubleshooting

## Current Error Analysis

### Error 1: Favicon 404

✅ **FIXED** - Added favicon.svg to client folder

### Error 2: API Connection Refused

❌ **Issue**: Frontend trying to connect to `http://localhost:3000/api/events`
This means either:

1. You're testing locally and backend server is not running
2. You're on production (maanchitra.in) but config.js has wrong URL

## Quick Fixes

### If Testing Locally:

1. **Start the backend server:**

   ```powershell
   cd server
   npm install
   npm start
   ```

2. **Open browser:**
   - Go to http://localhost:3000
   - API should work now

### If Deployed on maanchitra.in:

**Step 1: Verify Backend URL**

Open browser console (F12) on https://maanchitra.in and check:

- If you see "Using production API: https://api.maanchitra.in/api" - config is correct
- If you see "Using development API: http://localhost:3000/api" - something is wrong

**Step 2: Update config.js Based on Your Setup**

Edit `client/js/config.js` and uncomment the correct production URL:

**Option A - Backend on subdomain (Hostinger Node.js app):**

```javascript
production: 'https://api.maanchitra.in/api',
```

**Option B - Backend in subfolder (Hostinger):**

```javascript
production: 'https://maanchitra.in/server/api',
```

**Option C - Backend on Render or other service:**

```javascript
production: 'https://your-app-name.onrender.com/api',
```

**Step 3: Test Backend Directly**

Open browser and try to access your backend:

- https://api.maanchitra.in/api/periods
- OR https://maanchitra.in/server/api/periods
- OR https://your-app.onrender.com/api/periods

You should see JSON data. If you get an error:

- 404 = Wrong URL or backend not deployed
- 500 = Backend error (check logs)
- Connection refused = Backend not running

**Step 4: Check Backend is Running**

**On Hostinger:**

1. Log in to hPanel
2. Go to Advanced → Node.js
3. Check your app status shows "Running"
4. If not, click "Start" or "Restart"
5. Check logs for errors

**On Render:**

1. Log in to Render dashboard
2. Check your service status
3. View logs for errors

**Step 5: Verify CORS Settings**

Check backend `.env` file has:

```
CORS_ORIGIN=https://maanchitra.in
```

If using subdomain for API, might need:

```
CORS_ORIGIN=https://maanchitra.in,https://api.maanchitra.in
```

## Current Configuration Status

✅ Favicon added to fix 404 error
✅ config.js updated with console logging
✅ config.js set to use: `https://api.maanchitra.in/api`

## Next Steps

1. **Upload updated files to Hostinger:**

   - favicon.svg
   - index.html
   - admin.html
   - js/config.js

2. **Check backend URL in browser:**

   - Visit: https://api.maanchitra.in/api/periods
   - Should return JSON data

3. **If backend URL doesn't work:**

   - Check if backend is deployed
   - Verify subdomain is created
   - Check Node.js app is running

4. **Update config.js if needed:**
   - Change production URL to match your actual setup
   - Re-upload config.js

## Testing Checklist

- [ ] Favicon loads (no 404 in console)
- [ ] Backend URL returns JSON: https://api.maanchitra.in/api/periods
- [ ] Frontend console shows "Using production API: ..."
- [ ] Events load on timeline
- [ ] No CORS errors in console
- [ ] Login/register works
- [ ] Admin panel accessible

## Quick Debug Commands

### Check what URL is being used:

1. Open browser console (F12)
2. Type: `window.API_CONFIG.getBaseUrl()`
3. Should return your production URL

### Check if backend is accessible:

```javascript
fetch("https://api.maanchitra.in/api/periods")
  .then((r) => r.json())
  .then((d) => console.log(d))
  .catch((e) => console.error(e));
```

## Still Having Issues?

1. **Check browser console** for exact error messages
2. **Check backend logs** in Hostinger or Render
3. **Verify MongoDB** connection in backend
4. **Test backend** URL directly in browser
5. **Check CORS** settings in backend

---

**Most Common Solution:**
The backend URL in `config.js` doesn't match where your backend is actually deployed. Update it to the correct URL and re-upload.
