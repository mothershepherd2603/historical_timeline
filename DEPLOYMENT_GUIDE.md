# Deployment Guide for Historical Timeline Web Application

## Prerequisites

1. **Hostinger Hosting Account** with Node.js support (Business or higher plan)
2. **Domain**: maanchitra.in (can be managed through Hostinger)
3. **MongoDB Atlas** account (free tier available - for database)
4. **Razorpay** account for payments
5. **FTP Client** (FileZilla recommended) or use Hostinger File Manager

---

## Part 1: Set Up MongoDB Atlas (Cloud Database)

### Step 1.1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (Free M0 tier is sufficient for starting)

### Step 1.2: Configure Database

1. **Create Database User:**

   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `timeline_admin` (or your choice)
   - Generate a strong password and save it
   - User Privileges: "Read and write to any database"

2. **Whitelist IP Addresses:**

   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs for better security

3. **Get Connection String:**

   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Select "Node.js" driver
   - Copy the connection string, it looks like:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   - Replace `<username>` and `<password>` with your database user credentials
   - Add database name: `historical_timeline`

   Final connection string:

   ```
   mongodb+srv://timeline_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/historical_timeline?retryWrites=true&w=majority
   ```

### Step 1.3: Seed the Database

1. Create a `.env` file in the `server` folder:

   ```bash
   MONGODB_URI=mongodb+srv://timeline_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/historical_timeline?retryWrites=true&w=majority
   JWT_SECRET=your_strong_random_jwt_secret_key_here
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://maanchitra.in
   ```

2. Install dependencies and seed the database:
   ```powershell
   cd server
   npm install
   npm run seed
   ```

---

## Part 2: Deploy to Hostinger

### Step 2.1: Check Your Hostinger Plan

1. **Log in to Hostinger hPanel** (https://hpanel.hostinger.com)
2. **Verify Node.js Support:**
   - Go to "Advanced" → "Node.js"
   - If available, you can host both frontend and backend
   - If not available, you'll need to upgrade or host backend elsewhere (see Alternative Backend Hosting below)

### Step 2.2: Set Up Node.js Application (Backend)

1. **Access Node.js Manager:**

   - In hPanel, go to "Advanced" → "Node.js"
   - Click "Create Application"

2. **Configure Application:**

   - **Application Mode:** Production
   - **Application Root:** `server` (or create a new folder like `api`)
   - **Application URL:** `api.maanchitra.in` (create subdomain first)
   - **Application Startup File:** `server.js`
   - **Node.js Version:** Select latest LTS (16.x or 18.x)
   - Click "Create"

3. **Create API Subdomain:**
   - Go to "Domains" → "maanchitra.in" → "Subdomains"
   - Create subdomain: `api.maanchitra.in`
   - Point it to a folder (e.g., `public_html/api`)

### Step 2.3: Upload Backend Files

**Option A: Using File Manager (Easier)**

1. Go to hPanel → "Files" → "File Manager"
2. Navigate to the `server` or `api` folder (as configured in Node.js app)
3. Upload all files from your local `server` folder:
   - `server.js`
   - `package.json`
   - `models/` folder
   - `seed.js`
   - `generateEvents.js`
   - `addCurrentAffairs.js`
   - All other server files
4. **Do NOT upload** `.env` file yet (we'll create it on the server)

**Option B: Using FTP (Recommended for Large Files)**

1. **Get FTP Credentials:**

   - Go to hPanel → "Files" → "FTP Accounts"
   - Create new FTP account or use existing one
   - Note: Hostname, Username, Password, Port (21)

2. **Connect with FileZilla:**

   - Host: `ftp.maanchitra.in` (or provided hostname)
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21
   - Click "Quickconnect"

3. **Upload Files:**
   - Navigate to the `server` or `api` folder on remote
   - Upload all server files from local machine
   - Maintain folder structure

### Step 2.4: Configure Environment Variables

1. **Access File Manager** in hPanel
2. Navigate to your server folder
3. **Create `.env` file:**
   - Click "New File" → `.env`
   - Edit the file and add:
   ```env
   MONGODB_URI=mongodb+srv://timeline_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/historical_timeline?retryWrites=true&w=majority
   JWT_SECRET=your_strong_random_jwt_secret_key_here
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://maanchitra.in
   ```
   - Save the file

**Security Note:** Make sure `.env` is in `.gitignore` and not accessible via web

### Step 2.5: Install Dependencies and Start Node.js App

1. **Access SSH (if available):**

   - Go to hPanel → "Advanced" → "SSH Access"
   - Enable SSH and note credentials
   - Connect using PuTTY (Windows) or Terminal (Mac/Linux):
     ```bash
     ssh u123456789@your-server-ip
     ```

2. **Navigate to Server Folder:**

   ```bash
   cd domains/maanchitra.in/public_html/server
   # or wherever you uploaded files
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Seed Database:**

   ```bash
   npm run seed
   ```

5. **Start Application via Node.js Manager:**
   - Go back to hPanel → "Node.js"
   - Find your application
   - Click "Start" or "Restart"

**Alternative (if no SSH):**

- Use hPanel → "Node.js" → Your App → "Run NPM Install"
- This will automatically install dependencies

### Step 2.6: Deploy Frontend

1. **Upload Frontend Files:**

   - In hPanel File Manager, navigate to `public_html`
   - Upload all files from your `client` folder:
     - `index.html`
     - `admin.html`
     - `css/` folder
     - `js/` folder
     - `assets/` folder
   - Your structure should look like:
     ```
     public_html/
     ├── index.html
     ├── admin.html
     ├── css/
     ├── js/
     ├── assets/
     └── server/ (or api/)
     ```

2. **Update API Configuration:**
   - Edit `public_html/js/config.js`
   - Update production URL:
     ```javascript
     production: 'https://api.maanchitra.in/api',
     // or if backend is in subfolder:
     production: 'https://maanchitra.in/server/api',
     ```

### Step 2.7: Configure Domain

1. **Point Domain to Hostinger:**

   - If domain is registered elsewhere:
     - Get Hostinger nameservers from hPanel
     - Update nameservers at your domain registrar
   - If domain is with Hostinger:
     - Already configured automatically

2. **SSL Certificate (HTTPS):**
   - Go to hPanel → "Security" → "SSL"
   - Select your domain (maanchitra.in)
   - Click "Install SSL"
   - Choose "Free SSL" (Let's Encrypt)
   - Wait 5-15 minutes for activation
   - Enable "Force HTTPS" redirect

### Alternative: Backend Hosting (If Hostinger doesn't support Node.js)

If your Hostinger plan doesn't include Node.js support, you can:

**Option 1: Deploy Backend to Render (Free)**

1. **Prepare Backend:**

   - Push your `server` folder to GitHub

2. **Deploy to Render:**
   - Go to https://render.com and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** historical-timeline-api
     - **Root Directory:** server
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance Type:** Free
3. **Add Environment Variables:**

   - Add all variables from your `.env` file
   - Deploy and get URL: `https://your-app.onrender.com`

4. **Upload Frontend to Hostinger:**
   - Upload `client` folder to `public_html` on Hostinger
   - Update `js/config.js` to point to Render backend URL

---

## Part 3: Testing and Verification

### Step 3.1: Test the Application

1. **Visit Your Site:**

   - Go to https://maanchitra.in
   - Verify homepage loads correctly

2. **Test User Functions:**

   - Register a new account
   - Login with credentials
   - Browse historical events
   - Test timeline navigation
   - Check map functionality

3. **Test Admin Panel:**

   - Go to https://maanchitra.in/admin.html
   - Login with admin credentials (username: admin, password: admin123)
   - **Important:** Change default admin password immediately
   - Test adding/editing events
   - Verify period management

4. **Test Subscription:**
   - Try subscription flow
   - Use Razorpay test mode first
   - Verify payment integration

### Step 3.2: Check Backend API

1. **Test API Endpoints:**

   - Visit `https://api.maanchitra.in/api/periods` (or your backend URL)
   - Should return JSON data
   - If you see data, backend is working!

2. **Check Logs:**
   - In Hostinger hPanel → "Node.js" → Your App → "Logs"
   - Check for any errors

### Step 3.3: Monitor Performance

1. **Check Node.js Status:**

   - hPanel → "Node.js" → Make sure app shows "Running"

2. **Database Connection:**
   - MongoDB Atlas → Metrics
   - Verify connections are being made

---

## Part 4: Post-Deployment Configuration

### Step 4.1: Security Hardening

1. **Change Default Admin Password:**

   - Login to admin panel
   - Create new admin account with strong password
   - Delete or disable default admin account

2. **Secure .env File:**

   - Make sure `.env` is not accessible via web
   - Create `.htaccess` in server folder:
     ```apache
     <Files ".env">
         Order allow,deny
         Deny from all
     </Files>
     ```

3. **Enable Firewall (if available):**

   - hPanel → "Security" → "ModSecurity"
   - Enable for your domain

4. **MongoDB Security:**
   - Update IP whitelist to specific IPs instead of 0.0.0.0/0
   - Get Hostinger server IP from hPanel

### Step 4.2: Performance Optimization

1. **Enable Caching:**

   - hPanel → "Advanced" → "Cache Manager"
   - Enable for your domain

2. **Enable Cloudflare (Optional):**

   - hPanel → "Advanced" → "Cloudflare"
   - Enable for better CDN and security

3. **Optimize Images:**
   - Compress images in `assets` folder
   - Use WebP format where possible

### Step 4.3: Backup Setup

1. **Enable Automatic Backups:**

   - hPanel → "Files" → "Backups"
   - Enable automatic backups

2. **MongoDB Backups:**
   - MongoDB Atlas → Clusters → "Backup"
   - Enable Cloud Backup (free tier has limited backup)

---

## Part 5: Troubleshooting

### Common Issues and Solutions

**Issue 1: Node.js App Won't Start**

- **Solution:**
  - Check logs in hPanel → "Node.js" → Your App → "Logs"
  - Verify `.env` file exists and has correct values
  - Run "NPM Install" again from Node.js manager
  - Check Node.js version compatibility

**Issue 2: CORS Errors**

- **Solution:**
  - Verify `CORS_ORIGIN` in `.env` matches your domain exactly
  - Update to: `CORS_ORIGIN=https://maanchitra.in`
  - Restart Node.js app

**Issue 3: Database Connection Failed**

- **Solution:**
  - Verify MongoDB connection string in `.env`
  - Check MongoDB Atlas IP whitelist
  - Ensure database user has correct permissions
  - Test connection string locally first

**Issue 4: Frontend Not Loading**

- **Solution:**
  - Check all files uploaded to `public_html`
  - Verify `index.html` is in root of `public_html`
  - Clear browser cache
  - Check SSL certificate is active

**Issue 5: API Calls Failing**

- **Solution:**
  - Verify API URL in `client/js/config.js`
  - Test API directly: `https://api.maanchitra.in/api/periods`
  - Check browser console for actual error
  - Ensure backend is running

**Issue 6: SSL Not Working**

- **Solution:**
  - Wait 15-30 minutes after installation
  - Reinstall SSL certificate
  - Contact Hostinger support if persistent

**Issue 7: Permission Errors**

- **Solution:**
  - Set folder permissions to 755
  - Set file permissions to 644
  - Use File Manager → Right Click → "Change Permissions"

---

## Part 6: Maintenance and Updates

### Regular Maintenance Tasks

1. **Weekly:**

   - Check application logs for errors
   - Monitor website uptime
   - Verify backups are running

2. **Monthly:**

   - Update Node.js dependencies: `npm update`
   - Review MongoDB usage in Atlas
   - Check Razorpay transaction logs
   - Update content (add new events)

3. **Quarterly:**
   - Review and update security patches
   - Optimize database queries
   - Clean up old logs
   - Review user feedback

### Updating the Application

1. **To Update Code:**

   - Edit files locally
   - Upload changed files via FTP or File Manager
   - If `server.js` or `package.json` changed:
     - Run "NPM Install" in Node.js manager
     - Restart the application

2. **To Update Dependencies:**
   - SSH into server
   - Navigate to server folder
   - Run `npm update`
   - Restart Node.js app

---

## Part 7: Scaling Considerations

### When to Upgrade

**Consider upgrading when:**

- Node.js app crashes frequently
- Response times exceed 2-3 seconds
- Monthly visitors exceed 10,000
- Database size exceeds free tier limit (512MB)

### Upgrade Options

1. **Hostinger:**

   - Upgrade to higher Business plan
   - Consider VPS for more control
   - Enable Hostinger CDN

2. **MongoDB:**

   - Upgrade to M10 tier (~$0.08/hour)
   - Enable automated backups
   - Add read replicas

3. **Additional Services:**
   - Add Redis for caching
   - Use separate API server
   - Implement load balancing

---

## Part 8: Cost Breakdown

### Monthly Costs (Approximate)

**Minimum Setup:**

- Hostinger Business Plan: ₹150-300/month
- MongoDB Atlas: FREE (M0 - 512MB)
- Domain (maanchitra.in): ~₹1000/year
- Razorpay: Transaction fees only (2% + GST)
- **Total: ~₹150-300/month + ₹1000/year domain**

**Production Setup (High Traffic):**

- Hostinger VPS: ₹500-1500/month
- MongoDB Atlas M10: ~₹6000/month ($75/month)
- CDN/Cloudflare Pro: ₹1500/month ($20/month)
- **Total: ~₹8000-9000/month**

---

## Part 9: Support and Resources

### Hostinger Support

- **Help Center:** https://support.hostinger.com
- **Live Chat:** Available 24/7 in hPanel
- **Tutorials:** https://www.hostinger.com/tutorials

### MongoDB Atlas Support

- **Documentation:** https://docs.atlas.mongodb.com
- **Community:** https://www.mongodb.com/community/forums

### Additional Resources

- **Node.js Docs:** https://nodejs.org/docs
- **Express.js Guide:** https://expressjs.com/guide
- **Razorpay Docs:** https://razorpay.com/docs

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database seeded with initial data
- [ ] Hostinger Node.js application created (or backend on Render)
- [ ] Backend files uploaded to Hostinger
- [ ] `.env` file created with all variables
- [ ] npm dependencies installed
- [ ] Node.js application started successfully
- [ ] Frontend files uploaded to public_html
- [ ] API URL configured in config.js
- [ ] Domain pointed to Hostinger
- [ ] SSL certificate installed and active
- [ ] HTTPS redirect enabled
- [ ] Website loads at https://maanchitra.in
- [ ] User registration works
- [ ] User login works
- [ ] Events display correctly
- [ ] Admin panel accessible
- [ ] Default admin password changed
- [ ] Razorpay test payment works
- [ ] Backups enabled
- [ ] MongoDB IP whitelist configured

---

## Quick Commands Reference

### SSH Commands (Hostinger)

```bash
# Connect to server
ssh u123456789@your-server-ip

# Navigate to server folder
cd domains/maanchitra.in/public_html/server

# Install dependencies
npm install

# Seed database
npm run seed

# Check logs (if using PM2)
pm2 logs

# Restart app
pm2 restart all
```

### File Permissions

```bash
# Set folder permissions
chmod 755 foldername

# Set file permissions
chmod 644 filename

# Recursive for all files
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

---

## Emergency Contacts

- **Hostinger Support:** support@hostinger.com (24/7 Live Chat)
- **MongoDB Support:** https://support.mongodb.com
- **Razorpay Support:** support@razorpay.com

---

**Deployment Complete!** Your Historical Timeline application should now be live at https://maanchitra.in 🚀
