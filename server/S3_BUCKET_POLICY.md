# S3 Bucket Configuration for Public Media Access

## Problem

Your S3 bucket has ACLs disabled, which is the recommended security setting. This means we need to use a **bucket policy** instead to make media files publicly readable.

## Solution: Apply Bucket Policy

### Step 1: Go to AWS S3 Console

1. Log in to AWS Console
2. Navigate to S3
3. Click on your bucket: `historical-timeline`
4. Go to the **Permissions** tab

### Step 2: Add Bucket Policy

1. Scroll down to **Bucket policy**
2. Click **Edit**
3. Paste the following policy:

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

4. Click **Save changes**

### Step 3: Configure CORS (Cross-Origin Resource Sharing)

1. In the S3 bucket, go to the **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste the following CORS configuration:

**Option 1: Allow All Origins (Recommended - Simpler)**

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

**Option 2: Specific Origins Only**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "https://maanchitra.in",
      "https://www.maanchitra.in",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5500"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**IMPORTANT:** Do NOT add trailing slashes to origins (e.g., ~~"https://maanchitra.in/"~~)

5. Click **Save changes** and **wait 1-2 minutes** for changes to propagate

### Step 4: Verify Block Public Access Settings

1. In the **Permissions** tab, check **Block public access (bucket settings)**
2. Make sure **"Block public access to buckets and objects granted through new public bucket or access point policies"** is **OFF**
3. You can keep the other settings ON for security

### What This Does

**Bucket Policy:**

- Allows **public read access** only to files in the `media/` folder
- All other files in the bucket remain private
- More secure than using ACLs
- No need to update ACLs on existing files

**CORS Configuration:**

- Allows your frontend (maanchitra.in) to load media files directly from S3
- Permits GET and HEAD requests from specified origins
- Required for images/videos to load in the browser
- Includes localhost for development testing

### Alternative: Use Pre-Signed URLs (More Secure)

If you prefer not to make media publicly accessible, you can use pre-signed URLs instead. This requires:

1. Removing the bucket policy
2. Updating the API to generate pre-signed URLs for each media file
3. Frontend changes to handle temporary URLs

Let me know if you want to implement pre-signed URLs instead.

## Verification

After applying the bucket policy:

1. Try accessing a media URL directly in your browser
2. You should see the image/video without errors
3. All users (logged in or not) should be able to view media

## Security Notes

- This makes files in `media/*` publicly readable
- Files are still protected from public writes/deletes
- Only affects the `media/` folder prefix
- Other folders in the bucket remain private
