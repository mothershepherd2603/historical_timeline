# AWS S3 Configuration Guide

## 1. Backend Code Fix ✅ COMPLETED

The backend has been updated to upload files with `ACL: 'public-read'` permission.

**File Updated:** `utils/s3Upload.js`

- Added `ACL: 'public-read'` to upload parameters
- Added `getSignedUrl()` helper function for future pre-signed URL support

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

### Still Getting "Access Denied"?

1. **Check ACL on specific file:**
   - Go to S3 Console → your bucket → find the file
   - Click file → **Permissions** tab
   - Under "Access control list (ACL)" should show: `Everyone (public access)` with Read permission

2. **Check bucket public access settings:**
   - Must allow ACLs (Step 1 above)

3. **Check CORS:**
   - Required for browser access (Step 2 above)

4. **Test with curl:**
   ```bash
   curl -I https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/YOUR_FILE.jpg
   ```
   Should return `HTTP/1.1 200 OK`, not `403 Forbidden`

### CORS Errors in Browser Console?

- Ensure CORS is configured (Step 2)
- Check that `AllowedOrigins` includes your frontend domain
- Use `["*"]` for development, specific domains for production

## Summary

✅ **Completed:**

- Backend code updated to use `ACL: 'public-read'`

⚠️ **Required Actions:**

1. Configure AWS S3 bucket permissions (Step 1)
2. Configure CORS (Step 2)
3. Test media access
4. (Optional) Update existing media ACLs if needed

After completing these steps, all new media uploads will be publicly accessible via their S3 URLs.
