# Media Fetching Troubleshooting Guide

## Current Configuration Applied ✓

You've applied:

- ✓ Bucket Policy for public read access to `media/*`
- ✓ CORS configuration with your origins

## Common Issues & Solutions

### Issue 1: Block Public Access Settings

**Most Common Problem!** AWS Block Public Access settings can override your bucket policy.

**Fix:**

1. Go to AWS S3 Console → `historical-timeline` bucket
2. Click **Permissions** tab
3. Scroll to **Block public access (bucket settings)**
4. Click **Edit**
5. **UNCHECK** this setting:
   - ❌ Block public access to buckets and objects granted through **new** public bucket or access point policies
6. You can keep these checked for security:
   - ✓ Block public access to buckets and objects granted through **any** public bucket or access point policies
   - ✓ Block public and cross-account access to buckets and objects through any public bucket or access point policies

**Important:** If all 4 checkboxes are checked, your bucket policy won't work!

### Issue 2: Browser Console Errors

Check your browser's Developer Console (F12) for specific errors:

**Error: "Access to XMLHttpRequest/fetch has been blocked by CORS policy"**

- **Cause:** CORS not properly configured or origin mismatch
- **Fix:** Verify CORS configuration includes your exact origin
- Add to CORS AllowedOrigins:
  ```json
  "http://127.0.0.1:5500"
  ```

**Error: "403 Forbidden"**

- **Cause 1:** Block Public Access is enabled
  - Fix: See Issue 1 above
- **Cause 2:** Bucket policy not applied correctly
  - Fix: Re-apply bucket policy and click "Save changes"
- **Cause 3:** Files don't have correct path prefix
  - Fix: Ensure files are in `media/` folder (e.g., `media/images/file.jpg`)

**Error: "404 Not Found"**

- **Cause:** File doesn't exist or URL is wrong
- **Fix:**
  1. Check if file exists in S3 bucket
  2. Verify URL format matches: `https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/FILENAME.jpg`
  3. Check database URLs are correct (run `node verifyMediaURLs.js`)

### Issue 3: Incorrect Media URLs in Database

Media URLs must be in the correct format:

**Correct Format:**

```
https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/123_image.jpg
```

**Incorrect Formats:**

```
❌ http://historical-timeline.s3... (missing https)
❌ s3://historical-timeline/media/... (S3 URI, not HTTP URL)
❌ /media/images/123_image.jpg (relative path)
❌ historical-timeline/media/... (missing protocol and domain)
```

**Fix:**
Run the verification script:

```bash
node verifyMediaURLs.js
```

This will show you the actual URLs in your database.

### Issue 4: Cache Issues

**Symptoms:** Files work in incognito mode but not in regular browser

**Fix:**

1. Clear browser cache (Ctrl+Shift+Delete)
2. Or test in incognito/private mode
3. Or hard refresh (Ctrl+F5)

### Issue 5: Wrong Region in URL

**Check:** Your bucket is in `ap-south-1` region (Mumbai)

**Verify URL format:**

```
https://historical-timeline.s3.ap-south-1.amazonaws.com/media/...
```

Not:

```
❌ https://historical-timeline.s3.amazonaws.com/media/...
```

## Step-by-Step Verification

### Step 1: Test Direct S3 Access

1. Run verification script:

   ```bash
   node verifyMediaURLs.js
   ```

2. Copy one of the URLs shown

3. Open it directly in your browser

4. **Expected:** Image/video loads successfully
   **If it fails:** Note the error (403 Forbidden, 404 Not Found, etc.)

### Step 2: Check Browser Console

1. Open your index.html in browser
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Look for errors (red text)
5. Go to **Network** tab
6. Refresh page
7. Look for failed requests (red entries)
8. Click on a failed media request to see:
   - Status code (403, 404, etc.)
   - Headers
   - Response

### Step 3: Verify AWS Settings

Run this checklist in AWS S3 Console:

**Bucket Overview:**

- [ ] Bucket name: `historical-timeline`
- [ ] Region: `ap-south-1`

**Permissions Tab:**

- [ ] Block public access: At least one setting is OFF
- [ ] Bucket policy: Applied and saved
- [ ] CORS: Configured and saved
- [ ] ACLs: Disabled (recommended)

**Objects:**

- [ ] Files exist in `media/images/` or `media/videos/` folder
- [ ] File paths match URLs in database

### Step 4: Test with curl

Test from command line:

```powershell
# Replace with your actual file URL
curl -I https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/YOUR_FILE.jpg
```

**Expected response:**

```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Access-Control-Allow-Origin: *
```

**If you get 403:**

- Block Public Access is enabled, OR
- Bucket policy not applied

**If you get 404:**

- File doesn't exist at that path
- Check file name and folder structure

## Quick Fix Commands

### Test a media URL:

```powershell
node verifyMediaURLs.js
```

### Check MongoDB connection:

```powershell
node -p "require('dotenv').config(); process.env.MONGODB_URI"
```

### Verify environment variables:

```powershell
cat .env
```

## Still Not Working?

### Report These Details:

1. **Browser Console Error:**
   - Exact error message
   - Failed request URL
   - Status code

2. **Sample Media URL from Database:**

   ```bash
   node verifyMediaURLs.js
   ```

   Copy the output

3. **AWS Settings:**
   - Screenshot of Block Public Access settings
   - Confirm bucket policy is saved
   - Confirm CORS is saved

4. **Test Results:**
   - Does URL work when opened directly in browser?
   - Does URL work in incognito mode?
   - What's the curl response?

## Alternative Solution: CloudFront CDN

If you prefer not to make S3 directly accessible, you can use CloudFront:

**Benefits:**

- Better performance (CDN caching)
- More secure (no direct S3 access)
- Custom domain support
- HTTPS by default

**Setup:**

1. Create CloudFront distribution
2. Point origin to S3 bucket
3. Configure Origin Access Identity (OAI)
4. Update media URLs in database
5. Remove public bucket policy

Let me know if you want to implement CloudFront instead.
