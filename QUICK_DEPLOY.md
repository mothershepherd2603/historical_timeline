# Quick Deployment Steps for maanchitra.in (Hostinger)

## Step 1: Set Up MongoDB Atlas (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up and create a free cluster
3. Create database user with password
4. Add IP: 0.0.0.0/0 (Allow from anywhere)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/historical_timeline?retryWrites=true&w=majority
   ```

## Step 2: Seed Your Database Locally (3 minutes)

1. Create `server/.env` file:

   ```env
   MONGODB_URI=<your_connection_string_from_step1>
   JWT_SECRET=any_random_long_string_here
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://maanchitra.in
   ```

2. Run in PowerShell:
   ```powershell
   cd server
   npm install
   npm run seed
   ```

## Step 3: Log in to Hostinger (2 minutes)

1. Go to https://hpanel.hostinger.com
2. Log in with your credentials
3. Select your hosting plan for maanchitra.in

## Step 4: Set Up Node.js Application (5 minutes)

**If your plan supports Node.js:**

1. Go to "Advanced" → "Node.js"
2. Click "Create Application"
3. Configure:
   - **Application Mode:** Production
   - **Application Root:** `server` or `api`
   - **Application URL:** Create subdomain `api.maanchitra.in` first (go to Domains → Subdomains)
   - **Application Startup File:** `server.js`
   - **Node.js Version:** Latest LTS (18.x recommended)
4. Click "Create"

**If Node.js is not available:**

- Skip to Alternative Backend Deployment (Step 8)

## Step 5: Upload Backend Files (10 minutes)

**Using File Manager:**

1. Go to "Files" → "File Manager"
2. Navigate to `server` or `api` folder (created by Node.js app)
3. Upload all files from your local `server` folder:
   - `server.js`
   - `package.json`
   - `models/` folder (all files)
   - `seed.js`
   - Other server files
   - **Do NOT upload .env yet**

**Or Using FTP (FileZilla):**

1. Get FTP credentials from "Files" → "FTP Accounts"
2. Connect with FileZilla
3. Upload all server files to the server folder

## Step 6: Configure Environment Variables (3 minutes)

1. In File Manager, navigate to server folder
2. Create new file: `.env`
3. Add your environment variables:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/historical_timeline?retryWrites=true&w=majority
   JWT_SECRET=your_random_secret_key
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://maanchitra.in
   ```
4. Save the file

## Step 7: Install Dependencies & Start Backend (5 minutes)

1. Go to "Advanced" → "Node.js"
2. Find your application
3. Click "Run NPM Install" (installs dependencies)
4. Wait for completion
5. Click "Start" or "Restart"
6. Verify status shows "Running"

**Your backend is now live at:** `https://api.maanchitra.in`

## Step 8: Upload Frontend Files (5 minutes)

1. In File Manager, navigate to `public_html`
2. Upload all files from your `client` folder:
   - `index.html`
   - `admin.html`
   - `css/` folder
   - `js/` folder
   - `assets/` folder
3. Your structure should be:
   ```
   public_html/
   ├── index.html
   ├── admin.html
   ├── css/
   ├── js/
   ├── assets/
   └── server/ (or api/)
   ```

## Step 9: Update API Configuration (2 minutes)

1. In File Manager, edit `public_html/js/config.js`
2. Update line 4:
   ```javascript
   production: 'https://api.maanchitra.in/api',
   ```
3. Save the file

## Step 10: Configure SSL (5 minutes)

1. Go to "Security" → "SSL"
2. Select `maanchitra.in`
3. Click "Install SSL"
4. Choose "Free SSL" (Let's Encrypt)
5. Wait 5-15 minutes for activation
6. Enable "Force HTTPS" redirect

## Step 11: Test Your Site (5 minutes)

1. Visit https://maanchitra.in
2. Test registration and login
3. Browse historical events
4. Test timeline and map features
5. Visit admin panel: https://maanchitra.in/admin.html
   - Login: admin / admin123
   - **Change password immediately!**
6. Test subscription (Razorpay test mode)

---

## Alternative: Backend on Render (If No Node.js Support)

**If Hostinger doesn't support Node.js:**

1. **Deploy Backend to Render:**

   - Push code to GitHub
   - Go to https://render.com
   - Create Web Service from GitHub repo
   - Root Directory: `server`
   - Add environment variables
   - Deploy and get URL: `https://your-app.onrender.com`

2. **Upload Frontend to Hostinger:**
   - Upload `client` folder to `public_html`
   - Edit `js/config.js` with Render URL:
     ```javascript
     production: 'https://your-app.onrender.com/api',
     ```

---

## Troubleshooting

**Node.js app won't start?**

- Check logs in hPanel → Node.js → Your App → Logs
- Verify .env file exists with correct values
- Run "NPM Install" again

**Site not loading?**

- Check all files uploaded to `public_html`
- Verify `index.html` is in root
- Clear browser cache
- Check SSL is active

**API errors?**

- Verify API URL in `client/js/config.js`
- Test API directly: `https://api.maanchitra.in/api/periods`
- Check browser console for errors
- Ensure backend is running

**Database errors?**

- Verify MongoDB connection string in `.env`
- Check MongoDB Atlas has 0.0.0.0/0 in IP whitelist

## Important URLs to Save

- **Frontend:** https://maanchitra.in
- **Backend API:** https://api.maanchitra.in (or your Render URL)
- **MongoDB:** https://cloud.mongodb.com
- **Hostinger hPanel:** https://hpanel.hostinger.com

## Costs (Hostinger Setup)

- **Hostinger Business:** ₹150-300/month
- **MongoDB Atlas:** FREE (512MB)
- **Domain:** Included with Hostinger or ₹1000/year
- **Total:** ~₹150-300/month

---

**Total Time:** ~45 minutes (excluding DNS propagation)

---

Need help? Check DEPLOYMENT_GUIDE.md for detailed instructions.
