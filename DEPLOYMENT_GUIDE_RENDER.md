# 🚀 Portfolio Website Deployment Guide (Render)

## Overview
- **Frontend**: Deployed on Render (Static Site)
- **Backend**: Deployed on Render (Web Service)
- **Database**: MongoDB Atlas (Free tier)
- **Total Cost**: FREE ✅

---

## Step 1: Prepare MongoDB Atlas (Cloud Database)

### 1.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Sign Up"** (use email)
3. Create project name: "Portfolio"
4. Choose **FREE** tier

### 1.2 Create Database Cluster
1. Select **AWS**, region: **Closest to you**
2. Cluster name: `portfolio-db`
3. Click **"Create Deployment"**
4. Username: `admin`
5. Password: Generate and **COPY IT** (you'll need it)
6. Click **"Create User"**

### 1.3 Get Connection String
1. Click **"Connect"** button
2. Choose **"Drivers"** (Node.js)
3. Copy connection string
4. Replace `<password>` with your password
5. Replace `myFirstDatabase` with `portfolio`

**Example:**
```
mongodb+srv://admin:YOUR_PASSWORD@portfolio-db.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
```

---

## Step 2: Prepare Backend for Deployment

### 2.1 Update Backend Files

#### Create `/backend/.env.production`
```
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@portfolio-db.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
ADMIN_EMAIL=your-email@gmail.com
ADMIN_PASSWORD=your-secure-password
NODE_ENV=production
PORT=5000
```

#### Update `/backend/server.js`
Make sure it handles environment variables properly (it should already have this):

```javascript
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
```

### 2.2 Create `/backend/render.yaml`
```yaml
services:
  - type: web
    name: portfolio-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: MONGODB_URI
        scope: build,runtime
      - key: ADMIN_EMAIL
        scope: build,runtime
      - key: ADMIN_PASSWORD
        scope: build,runtime
      - key: NODE_ENV
        value: production
```

---

## Step 3: Prepare Frontend for Deployment

### 3.1 Update Frontend API URL
Edit `/frontend/script.js` - change:

```javascript
// OLD:
const API_BASE = "http://localhost:5000/api";

// NEW:
const API_BASE = process.env.NODE_ENV === 'production' 
  ? "https://YOUR-BACKEND-URL.onrender.com/api"
  : "http://localhost:5000/api";
```

Or use a config file. Better approach - create `/frontend/config.js`:

```javascript
// config.js
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://portfolio-backend-xxxx.onrender.com/api';
```

Then in `index.html`, add before `script.js`:
```html
<script src="config.js"></script>
```

### 3.2 Create `/frontend/.nojekyll`
(Empty file - tells Render not to process Jekyll)

---

## Step 4: Push to GitHub

### 4.1 Initialize Git (if not already done)
```bash
cd c:\My Project\Portfolio
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

### 4.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `portfolio`
3. **DO NOT** add README/gitignore (we already have them)
4. Click **"Create repository"**

### 4.3 Push Code to GitHub
```bash
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git branch -M main
git push -u origin main
```

> **Tip:** If you're unfamiliar with Git, you can also upload files manually on GitHub

---

## Step 5: Deploy Backend on Render

### 5.1 Create Render Account
1. Go to https://render.com
2. Click **"Sign Up"** → Choose **GitHub**
3. Authorize Render to access your GitHub

### 5.2 Deploy Backend
1. Click **"+ New +"** → **"Web Service"**
2. Select your `portfolio` repository
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. **Name:** `portfolio-backend`
7. **Environment:** `Node`
8. **Plan:** `Free`

### 5.3 Add Environment Variables
Click **"Environment"** and add:
- **MONGODB_URI:** `mongodb+srv://admin:PASSWORD@portfolio-db.xxxxx.mongodb.net/portfolio...`
- **ADMIN_EMAIL:** `your-email@gmail.com`
- **ADMIN_PASSWORD:** `your-secure-password`
- **NODE_ENV:** `production`

### 5.4 Deploy
Click **"Create Web Service"** → Wait 5-10 minutes

**Your backend URL will be:** `https://portfolio-backend-xxxxx.onrender.com` ✅

---

## Step 6: Deploy Frontend on Render

### 6.1 Deploy Frontend
1. Click **"+ New +"** → **"Static Site"**
2. Select your `portfolio` repository
3. **Name:** `portfolio-frontend`
4. **Root Directory:** `frontend`
5. **Build Command:** (leave empty - it's just static files)
6. **Publish Directory:** `.` (current directory)

### 6.2 Deploy
Click **"Create Static Site"** → Wait 2-3 minutes

**Your frontend URL will be:** `https://portfolio-frontend-xxxxx.onrender.com` ✅

---

## Step 7: Update Frontend Config with Backend URL

### 7.1 After Backend is Deployed
1. Copy your backend URL: `https://portfolio-backend-xxxxx.onrender.com`
2. Update `/frontend/config.js` or `/frontend/script.js`:

```javascript
const API_BASE = "https://portfolio-backend-xxxxx.onrender.com/api";
```

3. Commit and push:
```bash
git add frontend/
git commit -m "Update API base URL for production"
git push
```

4. Render will auto-redeploy frontend ✅

---

## Step 8: Test Your Deployed Portfolio

### 8.1 Access Your Portfolio
- **Frontend:** https://portfolio-frontend-xxxxx.onrender.com
- **Admin Panel:** https://portfolio-frontend-xxxxx.onrender.com/admin.html

### 8.2 Test Admin Login
1. Go to Admin Panel
2. Email: `your-email@gmail.com` (from env var)
3. Password: Your password (from env var)

### 8.3 Test Full Functionality
- ✅ Add/Edit Projects
- ✅ Add/Edit Experience
- ✅ Upload Images/Certificates
- ✅ View History/Rollback
- ✅ Changes appear on portfolio page

---

## Step 9: Custom Domain (Optional)

### 9.1 Connect Custom Domain
1. Go to Render → Portfolio Frontend
2. **Settings** → **Custom Domain**
3. Add your domain: `myportfolio.com`
4. Follow DNS instructions

---

## Troubleshooting

### Backend Won't Deploy
- Check logs: Render Dashboard → Logs tab
- Verify `.env` variables are set
- Check MongoDB connection string

### Frontend Can't Connect to Backend
- Check `config.js` or `script.js` API_BASE URL
- Check CORS is enabled in backend
- Run: `curl https://your-backend-url/api/portfolio`

### MongoDB Connection Error
- Verify MongoDB Atlas whitelist includes Render IP
- Check username/password in connection string
- Test connection locally first

---

## Send to Company

Your portfolio is live at:
```
🌐 https://portfolio-frontend-xxxxx.onrender.com
```

Share this link! ✨

---

## Summary

| Component | Platform | Status |
|-----------|----------|--------|
| Frontend | Render Static | ✅ Free |
| Backend | Render Web | ✅ Free |
| Database | MongoDB Atlas | ✅ Free |
| Domain | Render Subdomain | ✅ Free |
| **Total Cost** | | **✅ $0** |

---

## Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Push code to GitHub
3. ✅ Deploy Backend on Render
4. ✅ Deploy Frontend on Render  
5. ✅ Test everything works
6. ✅ Send link to company
7. 🎉 Get internship!

Good luck! 🚀
