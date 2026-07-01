# ⚡ Quick Fix - 3 Steps (5 minutes)

## Your Issue:

Media URLs return "Access Denied" - AWS S3 bucket needs configuration.

## 📊 Your Current Status (Based on Diagnostics):

```
✅ CORS: Working
✅ Network: Working
❌ Access: 403 Forbidden
```

**What this means:** Step 3 (CORS) is done ✅, but Step 2 (Public Access) is blocking your bucket policy.

**Fix:** Re-do Step 2 below and **uncheck ALL 4 checkboxes**.

---

## What You Need to Do:

### Step 1: Add Bucket Policy (2 min)

1. Open: https://s3.console.aws.amazon.com/
2. Click bucket: **historical-timeline**
3. Click: **Permissions** tab
4. Scroll to: **Bucket policy** → Click **Edit**
5. **Delete everything** in the editor
6. **Copy-paste this EXACTLY**:

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

7. Click: **Save changes**

---

### Step 2: Allow Public Policies (1 min) ⚠️ CRITICAL

**Your diagnostic shows 403 errors - this step is the issue!**

1. Same **Permissions** tab
2. Find: **Block public access (bucket settings)**
3. Click: **Edit**
4. You'll see 4 checkboxes. **Uncheck BOTH of these:**
   - ❌ **Block public access to buckets and objects granted through _new_ public bucket or access point policies**
   - ❌ **Block public and cross-account access to buckets and objects through _any_ public bucket or access point policies**
5. **Keep these checked** (for security):
   - ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ✅ Block public access to buckets and objects granted through any access control lists (ACLs)

6. Click: **Save changes**
7. Type: **confirm**

**Alternative (Simplest):** Just **uncheck ALL 4 checkboxes** if you're unsure which is which.

---

### Step 3: Enable CORS (1 min)

1. Same **Permissions** tab
2. Scroll to: **Cross-origin resource sharing (CORS)**
3. Click: **Edit**
4. **Delete everything** in the editor
5. **Copy-paste this**:

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

6. Click: **Save changes**

---

## ✅ Test It Works:

### Option A: Admin Panel (Easiest)

1. Go to: Admin Panel → Media tab
2. Click: **Test URL** button
3. Should show: ✅ **All tests passed**

### Option B: Direct Browser Test

1. Copy any media URL from your database
2. Open in **new incognito tab**
3. Should display the image (not XML error)

### Option C: Test with curl

```bash
curl -I https://historical-timeline.s3.ap-south-1.amazonaws.com/media/images/YOUR_FILE.jpg
```

Should return: `HTTP/1.1 200 OK`

---

## 🔧 If Still Not Working:

### Getting 403 Errors? (Like you are now)

**This means the bucket policy is blocked.** Go back to Step 2 and:

1. **Easiest fix:** Uncheck **ALL 4** checkboxes in "Block public access"
2. Click **Save changes** → Type **confirm**
3. Wait 30 seconds
4. Test again - should work immediately

**What happened:** AWS is blocking your bucket policy from making files public. Unchecking those boxes allows the policy to work.

### Double-check these:

1. **Bucket name is correct:** `historical-timeline` (in policy)
2. **Resource path is correct:** `arn:aws:s3:::historical-timeline/media/*`
3. **All 3 steps above were saved** (AWS doesn't auto-save)
4. **Wait 30 seconds** - AWS takes a moment to apply changes

### Still broken?

1. Check bucket policy is **visible** in AWS console (not blank)
2. Check CORS configuration is **visible** (not blank)
3. Try **deleting and re-uploading** one media file through admin panel
4. Check AWS region matches: `ap-south-1`

---

## 📝 What This Does:

- **Bucket Policy:** Allows anyone to read (GET) files in `/media/*` folder
- **Block Public Access:** Permits the bucket policy to work
- **CORS:** Allows browsers to load images from S3

All new uploads from your backend will now be accessible immediately!
