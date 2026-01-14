# Production Configuration Complete ✅

## Server Configuration

**Production Server URL:** https://historical-timeline-a223.onrender.com
**Frontend URL:** https://maanchitra.in

### Changes Made:

1. **Client Configuration** ([client/js/config.js](client/js/config.js))

   - Updated production API URL to: `https://historical-timeline-a223.onrender.com/api`
   - Automatic environment detection remains active

2. **Server CORS Configuration** ([server/server.js](server/server.js))

   - Enhanced CORS to support multiple origins
   - Configured to read from environment variable `CORS_ORIGIN`
   - Supports comma-separated multiple origins

3. **Server Port Configuration**
   - Uses `PORT` environment variable (Render will provide this)
   - Falls back to 3000 for local development

## Required Environment Variables on Render

Set these in your Render dashboard (Dashboard → Your Service → Environment):

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret_key
CORS_ORIGIN=https://maanchitra.in,https://www.maanchitra.in
RAZORPAY_KEY_ID=your_razorpay_key_id (if using payments)
RAZORPAY_KEY_SECRET=your_razorpay_secret (if using payments)
```

### Important Notes:

- **CORS_ORIGIN**: Set this to your frontend domain(s). Use `*` temporarily for testing, but specify exact domain(s) for production security
  - Single domain: `https://maanchitra.in`
  - Multiple domains: `https://maanchitra.in,https://www.maanchitra.in`
- **JWT_SECRET**: Generate a strong random key (minimum 32 characters)

  ```bash
  # Generate a secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **MONGODB_URI**: Use MongoDB Atlas or your MongoDB provider connection string

## Deployment Steps:

### 1. Deploy Backend to Render ✅

**Status:** Deployed  
**URL:** https://historical-timeline-a223.onrender.com

### 2. Deploy Frontend ✅

**Status:** Deployed  
**URL:** https://maanchitra.in

### 3. Configure Environment Variables on Render

- Go to Render Dashboard → Your Service → Environment
- **CRITICAL:** Set `CORS_ORIGIN=https://maanchitra.in,https://www.maanchitra.in`
- Add all other required environment variables listed above
- **Restart the service** after updating

### 4. Testing Production Configuration

### Test API Endpoint:

```bash
curl https://historical-timeline-a223.onrender.com/api/health
```

### Test from Frontend:

1. Deploy frontend to your hosting service
2. Open browser developer console
3. Check that API requests go to: `https://historical-timeline-a223.onrender.com/api`
4. Verify no CORS errors appear

## Local Development:

The application still works locally:

- Backend runs on: `http://localhost:3000`
- Frontend automatically detects localhost and uses local API
- No changes needed for local development workflow

## Security Checklist:

- [ ] Strong JWT_SECRET configured
- [ ] CORS_ORIGIN set to specific domain (not \*)
- [ ] MongoDB connection uses authentication
- [ ] Environment variables set (not hardcoded)
- [ ] HTTPS enabled (automatic on Render)

## Common Issues:

### CORS Errors:

- Ensure CORS_ORIGIN matches your frontend domain exactly
- Include protocol: `https://` (not just `domain.com`)
- Check for trailing slashes

### API Not Responding:

- Verify Render service is running
- Check environment variables are set
- Review Render logs for errors

### Authentication Issues:

- Ensure JWT_SECRET is set and consistent
- Check token is being sent in Authorization header
- Verify token hasn't expired (24h validity)

---

**Status:** Ready for Production ✅
**Last Updated:** January 14, 2026
