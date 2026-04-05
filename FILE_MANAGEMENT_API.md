# File Management System - API Documentation

## Overview
Complete file management system with upload, download, preview, and tracking capabilities.

## Endpoints

### 1. Upload File
**POST** `/api/files/upload`
- **Auth**: Required (Admin only)
- **Body**:
  ```json
  {
    "filename": "string",
    "fileData": "base64-encoded-string",
    "fileType": "image|pdf|document",
    "section": "portfolio|history|education|certificates"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "File uploaded successfully",
    "file": {
      "id": "ObjectId",
      "name": "filename",
      "size": 12345,
      "type": "image",
      "section": "portfolio",
      "url": "/api/files/download/id"
    }
  }
  ```

### 2. Get Files by Section
**GET** `/api/files/section/:section`
- **Auth**: Required (Admin only)
- **Params**: 
  - `section`: portfolio|history|education|certificates
- **Response**: Array of file objects with metadata

### 3. Download File
**GET** `/api/files/download/:id`
- **Auth**: Optional (Public accessible)
- **Response**: File blob with proper headers
- **Effect**: Increments download counter

### 4. View/Preview File
**GET** `/api/files/view/:id`
- **Auth**: Optional (Public accessible)
- **Response**: File content with appropriate MIME type
- **Supported**: Images (JPG, PNG, GIF), PDF

### 5. Delete File
**DELETE** `/api/files/:id`
- **Auth**: Required (Admin only)
- **Response**: 
  ```json
  {
    "message": "File deleted successfully"
  }
  ```

### 6. Get File Statistics
**GET** `/api/files/stats`
- **Auth**: Optional
- **Response**: 
  ```json
  [
    {
      "_id": "portfolio",
      "count": 5,
      "totalSize": 2097152,
      "totalDownloads": 42
    }
  ]
  ```

### 7. Get File Info
**GET** `/api/files/info/:id`
- **Auth**: Optional
- **Response**: Complete file metadata

### 8. Link File to History
**POST** `/api/files/link`
- **Auth**: Required (Admin only)
- **Body**:
  ```json
  {
    "fileId": "ObjectId",
    "historyId": "ObjectId"
  }
  ```
- **Response**: Confirmation with file details

### 9. Cleanup Unused Files
**POST** `/api/files/cleanup`
- **Auth**: Required (Admin only)
- **Effect**: Removes files older than 2 weeks with no downloads
- **Response**: 
  ```json
  {
    "message": "Cleanup completed",
    "deletedCount": 3
  }
  ```

## File Types
- **image**: JPG, JPEG, PNG, GIF, WebP
- **pdf**: PDF documents
- **document**: DOC, DOCX, TXT

## File Model Schema
```javascript
{
  originalName: String,           // Original filename
  storedName: String,             // Unique stored filename
  section: String,                // portfolio|history|education|certificates
  fileType: String,               // image|pdf|document
  size: Number,                   // File size in bytes
  uploadedBy: String,             // Admin email
  uploadedAt: Date,               // Upload timestamp
  downloads: Number               // Total download count
}
```

## History Model Enhancement
Updated History model to support file attachments:
```javascript
attachedFiles: [
  {
    fileId: ObjectId,
    fileType: String,
    fileName: String,
    purpose: String               // certificate|proof|evidence
  }
],
metaData: {
  ipAddress: String,
  userAgent: String,
  duration: Number                // Action duration in ms
}
```

## Frontend Integration

### JavaScript Module: FileManager
Located in `/frontend/fileManager.js`

#### Methods:
- `init()` - Initialize file manager
- `handleFileUpload(e)` - Process file upload with base64 encoding
- `showFilePreview(e)` - Display file preview
- `loadFiles()` - Load all files
- `displayFiles(files)` - Render file grid
- `deleteFile(fileId)` - Delete file with confirmation
- `filterFiles()` - Filter files by search and section
- `loadFileStats()` - Load file statistics
- `displayStats(stats)` - Render statistics

#### Features:
- ✅ Drag & drop file upload
- ✅ File preview (images and PDFs)
- ✅ Search and filter files
- ✅ File statistics dashboard
- ✅ Download tracking
- ✅ Base64 encoding for upload

## Usage Example

### Upload a file via cURL
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "certificate.pdf",
    "fileData": "base64encodeddata...",
    "fileType": "pdf",
    "section": "certifications"
  }'
```

### Download a file
```bash
curl -X GET http://localhost:5000/api/files/download/fileId -o certificate.pdf
```

### Get all portfolio files
```bash
curl -X GET http://localhost:5000/api/files/section/portfolio \
  -H "Authorization: Bearer <token>"
```

## Security Considerations
1. **Authentication**: All upload/delete operations require admin authentication
2. **File Validation**: Extension and MIME type validation
3. **Storage**: Files stored outside web root (backend/uploads/)
4. **Download Tracking**: All downloads are logged and counted
5. **Cleanup**: Automatic removal of unused files after 2 weeks

## Directory Structure
```
backend/
├── uploads/              # Uploaded files directory
├── models/
│   └── File.js          # File model
├── controllers/
│   └── fileController.js # File management logic
├── routes/
│   └── files.js         # File endpoints
└── middleware/
    └── authMiddleware.js # Authentication

frontend/
├── fileManager.js       # Frontend file management
├── admin.html           # Admin dashboard
└── admin-styles.css     # File manager styles
```

## Performance Optimization
- Files served statically from `/uploads` route
- Base64 encoding for uploads (50MB limit)
- Index on `section` field for fast queries
- Download counter optimization using `$inc` operator
- Files automatically cleaned up after 2 weeks of inactivity
