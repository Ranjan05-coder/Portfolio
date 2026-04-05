# Portfolio Admin CMS

A full-stack admin-controlled portfolio website with real-time updates, history tracking, and email notifications.

## Features

✅ **Public Portfolio** - Beautiful, responsive showcase site  
✅ **Admin Dashboard** - Login to edit all sections without code  
✅ **Live Updates** - Changes appear instantly, no redeployment needed  
✅ **Full History** - Track all changes with timestamps  
✅ **Rollback** - Restore previous versions with one click  
✅ **Email Alerts** - Get notified of every change  
✅ **No Backend Code Knowledge Required** - Pure admin interface  

## Project Structure

```
Portfolio/
├── index.html              (Public portfolio)
├── styles.css
├── script.js
├── admin.html              (Admin dashboard)
├── admin-styles.css
├── admin-script.js
├── data.js                 (Deprecated - replaced by API)
├── README.md               (This file)
├── DEPLOYMENT_GUIDE.md     (Detailed deployment steps)
└── backend/
    ├── server.js           (Express server)
    ├── package.json
    ├── .env                (Configuration)
    ├── models/
    │   ├── Admin.js
    │   ├── Portfolio.js
    │   └── History.js
    ├── routes/
    │   ├── auth.js
    │   ├── portfolio.js
    │   └── history.js
    ├── controllers/
    │   ├── authController.js
    │   ├── portfolioController.js
    │   └── historyController.js
    └── middleware/
        └── authMiddleware.js
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 14+ installed
- MongoDB running locally (or MongoDB Atlas account)
- Gmail account with App Password

### Setup Backend

```bash
cd backend
npm install
```

Create or update `.env`:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolio-cms
JWT_SECRET=development_secret_key_change_in_production
ADMIN_EMAIL=p5123ranjan@gmail.com
ADMIN_PASSWORD=Ranjan@997330
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=p5123ranjan@gmail.com
FRONTEND_URL=http://localhost:3000
```

Start backend:
```bash
# Development with hot-reload
npm run dev

# Or production
npm start
```

Backend runs on `http://localhost:5000`

### Setup Frontend (Local)

In root directory, use any static server:

```bash
# Python 3
python3 -m http.server 3000

# Or Node http-server
npx http-server -p 3000
```

Frontend available at `http://localhost:3000`

## Using the Admin Dashboard

### 1. Login
1. Navigate to `http://localhost:3000/admin.html` (or your deployed URL)
2. Enter credentials:
   - Email: `p5123ranjan@gmail.com`
   - Password: `Ranjan@997330`

### 2. Edit Sections

#### Hero Section
- Update your name, role, tagline
- Add career stats (e.g., "8+ Projects Built")
- Link to resume PDF

#### About
- Your professional bio

#### Skills
- Add/remove technical skills
- Easy comma-separated entry

#### Projects
- Title, description, tech stack
- Project images (optional)
- Live demo & GitHub links
- Add/remove projects

#### Experience
- Internship or work experience
- Company name, duration, details

#### Certifications
- Add credentials (Coursera, NPTEL, etc.)

#### Education
- Degree, college, CGPA, timeline

#### Contact
- Email, phone, location
- LinkedIn and GitHub URLs

### 3. Save & Get Notified
- Click "Save Changes" on any section
- Receive email confirmation
- Changes live instantly on public site

### 4. View History & Rollback
- Go to "History & Rollback" tab
- See all changes with timestamps
- Click "Rollback" to restore previous state
- Admin email must be active for notifications

## API Endpoints

### Public (No Auth Required)
```
GET /api/portfolio              → Get current portfolio
GET /api/health                 → Backend health check
```

### Admin Only (JWT Required)
```
POST /api/auth/login            → Admin login
POST /api/portfolio/update      → Update entire portfolio
POST /api/portfolio/section/:section  → Update single section
GET  /api/history              → Get change history
GET  /api/history/section/:section   → Get section history
POST /api/history/rollback/:id → Restore previous state
```

### Authentication
All admin endpoints require header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Database Schema

### Portfolio Collection
```json
{
  "hero": { name, role, summary, tag, resumeUrl, stats[] },
  "about": "text",
  "skills": ["skill1", "skill2"],
  "projects": [{ title, summary, tech[], imageUrl, live, code }],
  "experience": [{ title, org, period, details }],
  "certifications": ["cert1", "cert2"],
  "education": { degree, college, duration, cgpa },
  "contact": { email, phone, location, linkedin, github },
  "lastUpdated": Date
}
```

### History Collection
```json
{
  "timestamp": Date,
  "action": "update|rollback",
  "section": "hero|skills|projects|...",
  "before": { oldData },
  "after": { newData },
  "adminEmail": "p5123ranjan@gmail.com",
  "description": "What changed"
}
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

**Quick Summary:**
1. MongoDB Atlas (free M0 tier)
2. Backend → Railway or Render
3. Frontend → Vercel
4. Email via Gmail App Password

**Cost:** $0-5/month

## Email Setup Issues?

### If emails not sending:
1. Verify Gmail 2FA is enabled
2. Generate new App Password (16 chars)
3. Use exact password in .env
4. Check EMAIL_USER matches Gmail
5. Verify EMAIL_FROM is same as EMAIL_USER

## Troubleshooting

### Admin login fails
- Check backend is running and connected to MongoDB
- Verify credentials in .env
- Check JWT_SECRET is set

### Portfolio not updating
- Ensure backend API is accessible from frontend
- Check browser console for CORS errors
- Verify MongoDB connection
- Check FRONTEND_URL in backend .env

### History/Rollback not working
- Verify admin is authenticated (check token in localStorage)
- Ensure MongoDB is running
- Check History collection exists

### Email notifications not received
- Verify Gmail 2FA enabled
- Check EMAIL_USER and EMAIL_PASSWORD
- Confirm EMAIL_FROM matches EMAIL_USER
- Check spam folder

## Security Tips

1. **Change admin password** after deployment
2. **Use strong JWT_SECRET** (40+ chars, random)
3. **Enable MongoDB IP whitelist** (restrict access)
4. **Use HTTPS only** for deployed sites
5. **Rotate Gmail App Password** quarterly
6. **Keep .env files private** (never commit to git)

## Common Tasks

### Update Resume Link
1. Admin dashboard → Hero Section
2. Paste PDF URL in "Resume URL"
3. Save Changes

### Add New Project
1. Admin dashboard → Projects
2. Click "+ Add Project"
3. Fill details (title, tech, links)
4. Save Changes

### Restore Old Content
1. Admin dashboard → History & Rollback
2. Find the version you want
3. Click "Rollback to this version"
4. Confirm in popup
5. Done! Content restored

## Performance

- Frontend: Static HTML/CSS/JS (hosted on Vercel CDN)
- Backend: Node.js (Railway/Render with auto-scaling)
- Database: MongoDB Atlas (cloud-managed)
- Load time: <2 seconds average

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Fully responsive

## Future Enhancements

- [ ] Multiple admin users
- [ ] Image upload to cloud storage
- [ ] Portfolio templates
- [ ] Analytics dashboard
- [ ] Social sharing previews
- [ ] Blog functionality

## Support

For deployment help: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)  
For API details: Check backend routes/  
For styling: Edit admin-styles.css and styles.css

---

**Built for CSE (AI/ML) Students** ✨  
Make your portfolio stand out with real-time updates and professional admin control.
