# Portfolio CMS - File Management Implementation Guide

## Overview
This implementation adds a comprehensive file management system to the Portfolio CMS, allowing admins to upload, organize, download, and track files (images, PDFs, documents) associated with portfolio sections.

## Features

### 1. **File Upload System**
- ✅ Base64 encoded file uploads (supports up to 50MB via JSON)
- ✅ Multiple file types: Images, PDFs, Documents
- ✅ File type validation and restrictions
- ✅ Automatic unique filename generation with timestamps
- ✅ File preview before upload (images)
- ✅ Drag & drop upload interface

### 2. **File Organization**
- ✅ Files organized by sections: Portfolio, Certifications, Education, Experience
- ✅ Metadata storage: filename, size, type, upload date, uploader
- ✅ Download counter for each file
- ✅ File search and filtering capabilities
- ✅ File statistics dashboard

### 3. **File Access Control**
- ✅ Public downloads/preview (no auth required)
- ✅ Admin-only upload/delete (auth required)
- ✅ Track who uploaded each file (adminEmail)
- ✅ Download tracking and statistics

### 4. **File Management**
- ✅ Download files with proper headers
- ✅ Preview images and PDFs inline
- ✅ Delete files with database cleanup
- ✅ Automatic cleanup of unused files (2 weeks old, 0 downloads)

### 5. **Audit Trail**
- ✅ File upload history in database
- ✅ Download counts per file
- ✅ Admin email tracking
- ✅ Upload timestamp logging

## Architecture

### Backend Components

#### 1. **File Model** (`backend/models/File.js`)
Stores file metadata:
```javascript
{
  originalName: String,      // e.g., "certificate.pdf"
  storedName: String,        // e.g., "1699564800000-certificate.pdf"
  section: String,           // portfolio|history|education|certificates
  fileType: String,          // image|pdf|document
  size: Number,              // bytes
  uploadedBy: String,        // admin email
  uploadedAt: Date,          // timestamp
  downloads: Number          // counter
}
```

#### 2. **File Controller** (`backend/controllers/fileController.js`)
Core business logic:
- `getFileStats()` - Aggregate statistics by section
- `getAllFiles()` - List all files with pagination
- `getFileInfo()` - Get single file metadata
- `linkFileToHistory()` - Associate files with history entries
- `cleanupUnusedFiles()` - Remove old, unused files

#### 3. **File Routes** (`backend/routes/files.js`)
API endpoints:
- `POST /api/files/upload` - Upload file (auth required)
- `GET /api/files/section/:section` - Get files by section (auth required)
- `GET /api/files/download/:id` - Download file (public)
- `GET /api/files/view/:id` - Preview file (public)
- `GET /api/files/stats` - File statistics (public)
- `DELETE /api/files/:id` - Delete file (auth required)

#### 4. **Updated History Model** 
Enhanced to support file attachments:
```javascript
attachedFiles: [
  {
    fileId: ObjectId,
    fileType: String,
    fileName: String,
    purpose: String  // certificate|proof|evidence
  }
],
metaData: {
  ipAddress: String,
  userAgent: String,
  duration: Number
}
```

### Frontend Components

#### 1. **File Manager Module** (`frontend/fileManager.js`)
JavaScript module handling:
- File upload with base64 encoding
- File preview rendering
- Drag & drop support
- Search and filtering
- Download tracking
- Statistics display

#### 2. **Admin UI** (`frontend/admin.html`)
New "File Manager" tab with:
- Upload section with file selection
- Files grid with metadata
- Search and filter controls
- Statistics dashboard
- Download/preview/delete buttons

#### 3. **Styling** (`frontend/admin-styles.css`)
File manager specific styles:
- Upload form styling
- File card layout
- Filter controls
- Responsive design (mobile-friendly)
- Dark theme consistency

## Setup Instructions

### 1. Database Setup
The File model is automatically created by MongoDB when first used. No manual migration needed.

### 2. File Storage Directory
Created automatically at `backend/uploads/` on first upload. Ensure write permissions.

### 3. Environment Setup
No new environment variables required. Uses existing:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Token signing
- `PORT` - Server port

### 4. API Integration
The frontend automatically connects to the backend via `http://localhost:5000/api/files`

## Usage Examples

### Admin Upload File
1. Navigate to "File Manager" tab in admin dashboard
2. Select section (Portfolio, Certifications, etc.)
3. Select file type (Image, PDF, Document)
4. Click upload area or drag & drop file
5. Click "Upload File" button
6. File appears in grid with download/preview/delete options

### Download File
- Click "📥 Download" button on file card
- OR navigate directly to `/api/files/download/fileId`
- Download counter increments automatically

### Preview File
- Click "👁️ Preview" button (for images/PDFs)
- Opens in new tab for viewing

### Delete File
- Click "🗑️ Delete" button
- Confirm deletion
- File removed from database and filesystem

### Search Files
- Type in search box to filter by filename
- Select section filter dropdown
- Results update in real-time

## Security Features

### 1. Authentication
- All write operations require admin JWT token
- Token passed in Authorization header: `Bearer <token>`
- Read operations (download/preview) are public

### 2. File Validation
- File type restrictions: jpg|jpeg|png|gif|pdf|doc|docx
- MIME type validation on backend
- File size limit: 50MB (JSON body limit)

### 3. Storage Security
- Files stored outside web root (`backend/uploads/`)
- Files not directly accessible via HTTP
- Only served through download endpoint
- Unique filenames prevent collision

### 4. Audit Trail
- All uploads tracked with admin email
- Download counts recorded
- Upload timestamps stored

## API Response Examples

### Successful Upload
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "name": "certificate.pdf",
    "size": 245678,
    "type": "pdf",
    "section": "certifications",
    "url": "/api/files/download/507f1f77bcf86cd799439011"
  }
}
```

### File Statistics
```json
[
  {
    "_id": "portfolio",
    "count": 5,
    "totalSize": 2097152,
    "totalDownloads": 42
  },
  {
    "_id": "certifications",
    "count": 3,
    "totalSize": 1048576,
    "totalDownloads": 15
  }
]
```

### File List
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "originalName": "project-screenshot.png",
    "section": "portfolio",
    "fileType": "image",
    "size": 512000,
    "uploadedBy": "admin@example.com",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "downloads": 12
  }
]
```

## Troubleshooting

### Issue: Upload fails with "Missing required fields"
**Solution**: Ensure fileSection and fileType dropdowns are selected before uploading.

### Issue: File not appearing after upload
**Solution**: Files require auth token to load list. Ensure you're logged in as admin.

### Issue: Download returns 404
**Solution**: Check if file exists in `backend/uploads/` directory. May need to check database.

### Issue: Preview not working for PDFs
**Solution**: PDF preview requires proper MIME type. Check browser console for CORS errors.

### Issue: Large files timing out
**Solution**: Increase `express.json({ limit: "50mb" })` in `server.js` if needed.

## Performance Optimization

1. **File Indexing**: Database queries on `section` and `uploadedBy` fields
2. **Pagination**: Files grid uses scrolling (500px max height)
3. **Base64 Encoding**: Efficient for JSON transmission
4. **Cleanup Task**: Automatic removal of unused files prevents storage bloat
5. **Static Serving**: `/uploads` route serves files directly

## Future Enhancements

1. **Image Optimization**
   - Automatic image resizing
   - WebP conversion for better compression
   - Thumbnail generation

2. **Advanced Features**
   - File versioning (keep history of uploads)
   - Batch upload support
   - File sharing with access tokens
   - Tags and categorization

3. **Storage Options**
   - AWS S3 integration
   - Google Cloud Storage
   - CDN support for distributed delivery

4. **Monitoring**
   - File access analytics
   - Storage usage dashboard
   - Download trends

## File Structure
```
backend/
├── models/
│   ├── File.js              ✨ NEW - File metadata model
│   ├── History.js           📝 UPDATED - File attachment support
│   ├── Admin.js
│   └── Portfolio.js
├── controllers/
│   ├── fileController.js    ✨ NEW - File operations
│   ├── authController.js
│   └── portfolioController.js
├── routes/
│   ├── files.js             ✨ NEW - File endpoints
│   ├── auth.js
│   └── portfolio.js
├── uploads/                 ✨ NEW - File storage (created on first upload)
└── server.js               📝 UPDATED - File routes registration

frontend/
├── fileManager.js           ✨ NEW - File management module
├── admin.html              📝 UPDATED - File Manager tab
├── admin-styles.css        📝 UPDATED - File manager styles
├── admin-script.js
└── index.html
```

## Dependencies
All required dependencies already in `package.json`:
- ✅ express - Web framework
- ✅ mongoose - Database
- ✅ fs - File system (Node.js built-in)
- ✅ path - Path utilities (Node.js built-in)
- ✅ dotenv - Environment variables
- ✅ cors - Cross-origin support
- ✅ jsonwebtoken - Authentication

## Testing Checklist

- [ ] Create uploads directory manually if needed
- [ ] Verify MONGODB_URI and JWT_SECRET in .env
- [ ] Test file upload from admin dashboard
- [ ] Test file download functionality
- [ ] Verify file appears in search results
- [ ] Test filter by section
- [ ] Test delete file operation
- [ ] Verify download count increments
- [ ] Check file statistics accuracy
- [ ] Test with different file types (image, PDF, document)
- [ ] Verify mobile responsiveness

## Documentation
- See `FILE_MANAGEMENT_API.md` for detailed API documentation
- See `backend/routes/files.js` for implementation details
- See `frontend/fileManager.js` for frontend logic
