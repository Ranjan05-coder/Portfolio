# Portfolio CMS - Complete Deployment Guide

This guide covers deploying your admin-controlled portfolio with a backend API.

## Architecture Overview

```
Frontend (Vercel):
- index.html (public portfolio)
- admin.html (admin dashboard)
- styles.css, admin-styles.css
- script.js, admin-script.js

Backend (Railway/Render):
- Node.js + Express API
- MongoDB Atlas (database)
- Email notifications via Nodemailer
```

## Prerequisites

1. GitHub account (for deploying code)
2. MongoDB Atlas account (free tier available)
3. Vercel account (for frontend)
4. Railway or Render account (for backend)
5. Gmail account with App Password (for email notifications)

---

## Step 1: MongoDB Atlas Setup

### 1.1 Create a MongoDB Atlas Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new project
4. Click "Create Deployment" → Select "M0 (Free Tier)"
5. Choose cloud provider and region (AWS, US East)
6. Create cluster (takes 1-3 minutes)

### 1.2 Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `admin`
4. Password: Generate secure password (save it!)
5. Database User Privileges: Read and write to any database
6. Add User

### 1.3 Get Connection String
1. Go to "Databases" → Click "Connect"
2. Choose "Drivers"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `myFirstDatabase` with `portfolio-cms`
6. Example: `mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/portfolio-cms?retryWrites=true&w=majority`

---

## Step 2: Gmail App Password Setup

### 2.1 Enable 2-Factor Authentication
1. Go to myaccount.google.com
2. Navigate to Security
3. Enable 2-Step Verification

### 2.2 Create App Password
1. In Security, find "App passwords"
2. Select "Mail" and "Windows Computer"
3. Google generates a 16-character password
4. Copy this password (you'll use it in .env)

---

## Step 3: Deploy Backend to Railway

### 3.1 Prepare Backend
1. Ensure all backend files are in `backend/` folder:
   - server.js
   - package.json
   - .env (with placeholder values)
   - models/, routes/, controllers/, middleware/

### 3.2 Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio-admin-backend.git
git push -u origin main
```

### 3.3 Deploy on Railway
1. Go to https://railway.app
2. Sign up / Log in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your portfolio-admin-backend repo
5. Railway auto-detects Node.js
6. Click "Deploy"

### 3.4 Set Environment Variables on Railway
1. In Railway project, go to "Variables"
2. Add these variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/portfolio-cms?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_random_string_here
   ADMIN_EMAIL=p5123ranjan@gmail.com
   ADMIN_PASSWORD=Ranjan@997330
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=p5123ranjan@gmail.com
   FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
   PORT=5000
   ```

### 3.5 Railway Public URL
1. Go to "Settings" → "Public Networking"
2. Toggle "Generate Domain"
3. Copy the public URL (e.g., `https://portfolio-backend-production-xxxx.up.railway.app`)
4. Note this - you'll need it for frontend

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Push Frontend to GitHub
```bash
cd .. # Back to Portfolio root
git init
git add .
git commit -m "Initial portfolio commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio-admin.git
git push -u origin main
```

### 4.2 Deploy on Vercel
1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click "Add New..." → "Project"
4. Import your portfolio-admin repository
5. Framework Preset: Other
6. Build Command: (leave empty)
7. Output Directory: (leave empty)
8. Click "Deploy"

### 4.3 Update API Endpoint in Frontend
Edit `script.js` and `admin-script.js`:
```javascript
const API_BASE = "https://portfolio-backend-production-xxxx.up.railway.app/api";
```
Replace with your actual Railway backend URL.

### 4.4 Redeploy Frontend
After updating the API endpoint:
```bash
git add script.js admin-script.js
git commit -m "Update backend API endpoint"
git push
```
Vercel auto-redeploys on push to main.

---

## Step 5: Update Your .env Files

### Backend .env (on Railway)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/portfolio-cms?retryWrites=true&w=majority
JWT_SECRET=generate_a_random_secret_here
ADMIN_EMAIL=p5123ranjan@gmail.com
ADMIN_PASSWORD=Ranjan@997330
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=p5123ranjan@gmail.com
FRONTEND_URL=https://your-vercel-url.vercel.app
```

---

## Step 6: Test the System

### 6.1 Test Backend
```
GET https://YOUR_RAILWAY_URL/api/health
```
Should return: `{ "status": "Backend is running" }`

### 6.2 Test Portfolio Load
```
GET https://YOUR_RAILWAY_URL/api/portfolio
```
Should return your portfolio JSON.

### 6.3 Test Admin Login
1. Visit: `https://YOUR_VERCEL_URL/admin.html`
2. Login with:
   - Email: p5123ranjan@gmail.com
   - Password: Ranjan@997330
3. You should see the admin dashboard

### 6.4 Test Edit & Email
1. In admin dashboard, change any field (e.g., hero name)
2. Click "Save Changes"
3. Check your email for notification
4. Refresh public portfolio - should see new changes

---

## Step 7: First-Time Setup

After deployment, your admin account is automatically created with:
- Email: p5123ranjan@gmail.com
- Password: Ranjan@997330

**Important**: Change this password after first login by updating .env and redeploying.

---

## Usage Workflow

### Making Updates
1. Go to https://your-portfolio.vercel.app/admin.html
2. Log in
3. Edit sections (Skills, Projects, Experience, etc.)
4. Click "Save Changes"
5. Receive email confirmation
6. Public site auto-updates

### Viewing History
1. In admin dashboard, go to "History & Rollback" tab
2. See all changes with timestamps
3. Click "Rollback to this version" to restore old state
4. Rollback is also logged in history

### No Redeployment Needed!
- All changes are instant
- Database updates immediately reflect on public site
- No code changes or git pushes needed to update content

---

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in .env
- Verify MongoDB Atlas IP whitelist (should be 0.0.0.0/0 for Railway)
- Check MONGODB_URI syntax

### Email not sending
- Verify Gmail App Password (16 chars, no spaces)
- Confirm 2FA is enabled
- Check EMAIL_USER and EMAIL_PASSWORD in .env

### Admin login fails
- Verify credentials in .env match what you're using
- Check backend connectivity from frontend

### CORS errors
- Ensure FRONTEND_URL in backend .env matches your Vercel domain
- Check backend is accessible from frontend domain

---

## Security Notes

- JWT tokens expire after 7 days
- Passwords hashed with bcryptjs
- History is private (admin-only access)
- Validate all inputs on backend

---

## Cost Estimate

- MongoDB Atlas: FREE (M0 tier)
- Railway: FREE tier (with limitations) or $5/month for more
- Vercel: FREE for frontend
- Gmail: FREE with 2FA enabled

**Total: $0-5 per month**

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Set up MongoDB Atlas
4. ✅ Configure email notifications
5. 🎉 Start using your admin portfolio CMS!

For questions or issues, refer to:
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- MongoDB docs: https://docs.mongodb.com
