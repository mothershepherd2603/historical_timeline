# AWS S3 Configuration Guide

## ⚠️ URGENT: AWS Console Configuration Required

Your diagnostic results show media is **still not accessible**. This means the AWS S3 bucket needs configuration.

### ✅ Already Done:

- Backend code updated with `ACL: 'public-read'`

### ❌ Still Needed (Do This Now):

You **MUST** configure AWS S3 bucket settings below ⬇️

---

## Method 1: Bucket Policy (RECOMMENDED - Easier)

This is simpler than enabling ACLs. Do this first:

### Step 1: Add Bucket Policy

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on bucket: **historical-timeline**
3. Go to **Permissions** tab
4. Scroll to **Bucket policy** → Click **Edit**
5. Paste this **EXACTLY**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::historical-timeline/media/*"
    }
  ]
}
```

6. Click **Save changes**

### Step 2: Unblock Policy-Based Public Access

1. Still in **Permissions** tab
2. Click **Edit** under "Block public access (bucket settings)"
3. **Uncheck ONLY this one:**
   - ❌ Block public access to buckets and objects granted through **new** public bucket or access point policies
4. **Keep these checked:**
   - ✅ Block public access to buckets and objects granted through **any** public bucket or access point policies
   - ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
5. Click **Save changes**
6. Type **confirm** when prompted

### Step 3: Configure CORS

1. Still in **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **Save changes**

### ✅ Test Immediately

1. Go back to your Admin Panel → Media tab
2. Click **Test URL** on any media
3. Should now show: ✅ **Accessible**

---

## Method 2: ACL-Based Access (Alternative)

If Method 1 doesn't work, try this:

## 2. AWS S3 Console Configuration (Required)

### Step 1: Unblock Public Access

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Select bucket: `historical-timeline`
3. Go to **Permissions** tab
4. Click **Edit** under "Block public access (bucket settings)"
5. **Uncheck** the following:
   - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
6. **Keep checked** (for security):
   - ✅ Block public access to buckets and objects granted through new public bucket or access point policies
   - ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies
7. Click **Save changes**
8. Type `confirm` when prompted

### Step 2: Configure CORS (Required for Browser Access)

1. In the same bucket, go to **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **Save changes**

### Step 3: Optional - Bucket Policy for Extra Security

If you want to ensure only the `media/*` folder is public:

1. Go to **Permissions** → **Bucket Policy**
2. Click **Edit**
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadMediaOnly",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::historical-timeline/media/*"
    }
  ]
}
```

4. Click **Save changes**

## 3. Testing

### Test Existing Media

After configuring AWS S3:

1. Go to your Admin Panel → Media tab
2. Use the **S3 URL Diagnostics** tool
3. Test any existing media URL
4. Should now show: ✅ **Accessible**

### Test New Uploads

1. Upload a new media file through the admin panel
2. The URL should be immediately accessible
3. Open the URL in a new browser tab - image should display

### Manual S3 URL Test

Open this URL in your browser (replace with your actual file):

```
https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/YOUR_FILE.jpg
```

**Expected Result:** Image displays (not "Access Denied" XML)

## 4. Fix Existing Media URLs

If you have existing media with private ACLs, you need to update them:

### Option A: Re-upload (Recommended)

Delete and re-upload existing media through the admin panel.

### Option B: Bulk ACL Update Script

Run this script to update ACLs on existing files:

```javascript
// updateMediaACLs.js
const AWS = require("aws-sdk");
const Media = require("./models/Media");
const mongoose = require("mongoose");
require("dotenv").config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function updateACLs() {
  await mongoose.connect(process.env.MONGODB_URI);

  const mediaFiles = await Media.find({ s3_key: { $exists: true } });
  console.log(`Found ${mediaFiles.length} media files`);

  for (const media of mediaFiles) {
    try {
      await s3
        .putObjectAcl({
          Bucket: media.bucket || process.env.AWS_BUCKET_NAME,
          Key: media.s3_key,
          ACL: "public-read",
        })
        .promise();
      console.log(`✅ Updated: ${media.s3_key}`);
    } catch (err) {
      console.error(`❌ Failed: ${media.s3_key}`, err.message);
    }
  }

  await mongoose.connection.close();
  console.log("Done!");
}

updateACLs();
```

Run: `node updateMediaACLs.js`

## 5. Production Considerations

### Current Implementation: Public Read ACL

- **Pros:** Simple, fast, works immediately
- **Cons:** Anyone with URL can access (but URLs are hard to guess)
- **Use Case:** Good for public-facing historical content

### Alternative: Pre-Signed URLs (More Secure)

If you need to restrict access in the future:

1. Remove `ACL: 'public-read'` from upload
2. Use the `getSignedUrl()` function in `utils/s3Upload.js`
3. Generate temporary URLs on-demand
4. Update frontend to fetch signed URLs from API

**Example API endpoint:**

```javascript
app.get("/api/media/:id/signed-url", authenticateToken, async (req, res) => {
  const media = await Media.findById(req.params.id);
  const signedUrl = getSignedUrl(media.s3_key, 3600); // Valid for 1 hour
  res.json({ url: signedUrl });
});
```

## 6. Environment Variables

Ensure these are set in your `.env` file:

```env
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=historical-timeline
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## 7. Troubleshooting

### 🚨 Diagnostic Shows All Failed?

If you see:

```
Image Load: ❌ Failed to load as image
Fetch (no-cors): ❌ Failed to fetch
Fetch (CORS): ❌ CORS blocked
```

**This means AWS S3 is NOT configured yet.** You must do **Method 1** above.

#### Quick Fix Checklist:

1. ✅ Did you add the **Bucket Policy**? (Method 1, Step 1)
2. ✅ Did you **unblock policy-based public access**? (Method 1, Step 2)
3. ✅ Did you configure **CORS**? (Method 1, Step 3)
4. ✅ Did you click **Save changes** after each step?

After completing ALL steps, test again immediately.

### Still Getting "Access Denied"?

1. **Verify Bucket Policy is Active:**
   - S3 Console → `historical-timeline` → **Permissions** → **Bucket policy**
   - Should see the JSON policy from Method 1
   - Check the `Resource` line matches: `"arn:aws:s3:::historical-timeline/media/*"`

2. **Verify Public Access Settings:**
   - S3 Console → `historical-timeline` → **Permissions** → **Block public access**
   - At least ONE option must be unchecked (preferably the "new public bucket policies" one)

3. **Verify CORS is Set:**
   - S3 Console → `historical-timeline` → **Permissions** → **CORS**
   - Should show the JSON configuration with `GET` in `AllowedMethods`

4. **Test Directly in Browser:**
   - Copy your media URL (e.g., `https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/123_file.jpg`)
   - Open in a **new incognito/private window**
   - Should display the image, NOT show XML error

5. **Test with curl:**
   ```bash
   curl -I https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/YOUR_FILE.jpg
   ```

   - Should return `HTTP/1.1 200 OK`
   - If `403 Forbidden` → Bucket policy not applied correctly

### CORS Errors in Browser Console?

- Ensure CORS is configured (Step 3)
- Check that `AllowedOrigins` includes `"*"` for testing
- Clear browser cache and test again

## Summary

✅ **Completed:**

- Backend code updated to use `ACL: 'public-read'`

⚠️ **Required Actions:**

1. Configure AWS S3 bucket permissions (Step 1)
2. Configure CORS (Step 2)
3. Test media access
4. (Optional) Update existing media ACLs if needed

After completing these steps, all new media uploads will be publicly accessible via their S3 URLs.
