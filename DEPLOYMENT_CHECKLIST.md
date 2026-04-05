# 🚀 Deployment Checklist

## Pre-Deployment (Do These First)

### MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account (free tier)
- [ ] Create cluster named `portfolio-db`
- [ ] Create user with username `admin`
- [ ] Copy connection string with password
- [ ] Connection string format: `mongodb+srv://admin:PASSWORD@portfolio-db.xxxxx.mongodb.net/portfolio`

### Backend Preparation
- [ ] Create `/backend/.env.production` with:
  ```
  MONGODB_URI=<your_mongodb_string>
  ADMIN_EMAIL=your-email@gmail.com
  ADMIN_PASSWORD=secure-password
  NODE_ENV=production
  PORT=5000
  ```
- [ ] Verify `/backend/server.js` uses `process.env.PORT` and `process.env.MONGODB_URI`
- [ ] Test locally: `npm start` in backend folder

### Frontend Preparation
- [ ] Create `/frontend/config.js` with your backend URL (or update `script.js`)
- [ ] Create `/frontend/.nojekyll` (empty file, just name)
- [ ] Verify all API calls use correct base URL

### Local Testing
- [ ] Start backend: `cd backend && npm start`
- [ ] Start frontend: `cd frontend && npx http-server -p 3000`
- [ ] Test admin login works
- [ ] Test add/edit/save features work
- [ ] Test images upload works

---

## GitHub Setup

- [ ] Create GitHub account (if needed)
- [ ] Create new repository named `portfolio`
- [ ] Init git locally: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit - ready for deployment"`
- [ ] Add remote: `git remote add origin https://github.com/YOUR-USERNAME/portfolio.git`
- [ ] Push: `git push -u origin main`
- [ ] Verify files on GitHub

---

## Render Deployment

### Backend Deployment
- [ ] Create Render account (sign in with GitHub)
- [ ] New Web Service from `portfolio` repository
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server.js`
- [ ] Env Vars:
  - [ ] MONGODB_URI
  - [ ] ADMIN_EMAIL
  - [ ] ADMIN_PASSWORD
  - [ ] NODE_ENV=production
- [ ] Deploy and wait 5-10 minutes
- [ ] Copy backend URL

### Frontend Deployment
- [ ] New Static Site from `portfolio` repository
- [ ] Root Directory: `frontend`
- [ ] Build Command: (leave blank)
- [ ] Publish Directory: `.`
- [ ] Deploy and wait 2-3 minutes
- [ ] Copy frontend URL

### Post-Deployment
- [ ] Update frontend config with backend URL
- [ ] Push to GitHub
- [ ] Wait for auto-redeploy (2-3 minutes)
- [ ] Test frontend can reach backend

---

## Testing (Important!)

### Backend Tests
- [ ] Backend URL responds: `https://your-backend.onrender.com/api/portfolio`
- [ ] Admin login works
- [ ] Can add projects
- [ ] Can add experience
- [ ] Images upload successfully
- [ ] Can view history
- [ ] Can rollback changes

### Frontend Tests
- [ ] Frontend loads without errors
- [ ] Admin button accessible (Ctrl+Alt+A)
- [ ] All sections display correctly
- [ ] Projects show (scroll horizontally)
- [ ] Experience shows (scroll horizontally)
- [ ] Certificates show with images
- [ ] Contact form works (if enabled)

---

## Final Steps

- [ ] Share portfolio URL with company
- [ ] Portfolio URL: `https://portfolio-frontend-xxxxx.onrender.com`
- [ ] Admin URL: `https://portfolio-frontend-xxxxx.onrender.com/admin.html`
- [ ] Test one more time from mobile/tablet
- [ ] Make sure all your content looks good
- [ ] Double-check spelling and formatting

---

## Useful Links

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Render: https://render.com
- GitHub: https://github.com
- Email subject: "Portfolio - [Your Name]"

---

## Estimated Time

- Setup: 15 minutes
- Deployment: 15-20 minutes
- Testing: 10 minutes
- **Total: ~45 minutes** ⏱️

Good luck! 🚀
