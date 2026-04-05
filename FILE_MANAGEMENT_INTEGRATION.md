# File Management Integration Guide

## Integration Overview

This guide shows how to integrate the file management system with existing portfolio features like history tracking, certifications, education, and experience sections.

## 1. Linking Files to History Entries

### Backend Implementation

When creating a history entry with file attachments:

```javascript
// In historyController.js or relevant controller
const createHistoryWithFiles = async (req, res) => {
  try {
    const { action, section, before, after, attachedFileIds, purpose } = req.body;
    
    // Convert file IDs to file objects
    const attachedFiles = await Promise.all(
      attachedFileIds.map(async (fileId) => {
        const file = await File.findById(fileId);
        return {
          fileId: file._id,
          fileType: file.fileType,
          fileName: file.originalName,
          purpose: purpose || action
        };
      })
    );
    
    const history = await History.create({
      timestamp: new Date(),
      action,
      section,
      before,
      after,
      adminEmail: req.adminEmail,
      attachedFiles,
      metaData: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        duration: Date.now() - req.startTime
      }
    });
    
    res.json({ message: "History entry created", history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Frontend Integration

In the admin dashboard, when updating portfolio sections:

```javascript
// Example: Adding a certification with proof file
async function addCertificationWithFile(certification, proofFileId) {
  // Upload proof file first
  const uploadResponse = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${token}`},
    body: JSON.stringify({
      filename: `${certification.name}-proof.pdf`,
      fileData: proofFileData,
      fileType: 'pdf',
      section: 'certifications'
    })
  });
  
  const file = await uploadResponse.json();
  
  // Record history with file attachment
  const historyResponse = await fetch('/api/history', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${token}`},
    body: JSON.stringify({
      action: 'ADD_CERTIFICATION',
      section: 'certifications',
      after: { certification },
      attachedFileIds: [file.id],
      purpose: 'proof'
    })
  });
}
```

## 2. Certificate Management Integration

### Linking Certificates to Education/Certifications

```javascript
// Certificate with proof file
const certificate = {
  name: "AWS Solutions Architect",
  issuer: "Amazon Web Services",
  date: "2024-01-15",
  credentialId: "ABC123",
  credentialUrl: "https://aws.amazon.com/verify/123",
  certificateFile: fileId  // Link to File document
};

// In history:
attachedFiles: [{
  fileId: certificateFileId,
  fileType: 'pdf',
  fileName: 'AWS-certificate.pdf',
  purpose: 'certificate'
}]
```

## 3. Project Screenshots Integration

### For Portfolio Projects

```javascript
// Project with screenshot
const project = {
  title: "E-commerce Platform",
  description: "...",
  technologies: ["React", "Node.js"],
  liveUrl: "https://...",
  githubUrl: "https://...",
  screenshots: [
    {
      title: "Dashboard",
      fileId: screenshotFileId1  // Link to File document
    },
    {
      title: "Product Page",
      fileId: screenshotFileId2
    }
  ]
};

// History entry
attachedFiles: [
  {fileId: screenshotFileId1, fileType: 'image', fileName: 'dashboard.png', purpose: 'screenshot'},
  {fileId: screenshotFileId2, fileType: 'image', fileName: 'product.png', purpose: 'screenshot'}
]
```

## 4. Updated Portfolio Model (Optional Enhancement)

### Extend existing Portfolio model:

```javascript
// backend/models/Portfolio.js

// Add to projects array
projectSchema.add({
  screenshots: [{
    title: String,
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    }
  }]
});

// Add to certifications array
certificationSchema.add({
  certificateFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }
});

// Add to education array
educationSchema.add({
  documents: [{
    type: String,  // e.g., "diploma", "transcript"
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    }
  }]
});
```

## 5. File Display in Portfolio Website

### Show certificates:

```javascript
// frontend/index.html or portfolio display
async function loadCertificates() {
  const certs = portfolio.certifications || [];
  
  for (const cert of certs) {
    if (cert.certificateFile) {
      // Populate file details
      const file = await fetch(`/api/files/info/${cert.certificateFile}`);
      cert.fileDetails = await file.json();
      cert.downloadUrl = `/api/files/download/${cert.certificateFile}`;
      cert.previewUrl = `/api/files/view/${cert.certificateFile}`;
    }
  }
  
  return certs;
}

// Display with preview link
<div class="certificate">
  <h3>${cert.name}</h3>
  <p>${cert.issuer}</p>
  ${cert.certificateFile ? `
    <a href="${cert.previewUrl}" target="_blank">📄 View Certificate</a>
    <a href="${cert.downloadUrl}" download>📥 Download</a>
  ` : ''}
</div>
```

### Show project screenshots:

```javascript
// Display screenshots with file system
async function loadProjectScreenshots(project) {
  const screenshots = [];
  
  for (const screenshot of project.screenshots || []) {
    const file = await fetch(`/api/files/info/${screenshot.fileId}`);
    const fileData = await file.json();
    
    screenshots.push({
      ...screenshot,
      url: `/api/files/view/${screenshot.fileId}`,
      downloadUrl: `/api/files/download/${screenshot.fileId}`
    });
  }
  
  return screenshots;
}

// Display gallery
<div class="project-gallery">
  ${screenshots.map(ss => `
    <div class="screenshot">
      <img src="${ss.url}" alt="${ss.title}" />
      <p>${ss.title}</p>
    </div>
  `).join('')}
</div>
```

## 6. Migration from URLs to File IDs

### Script to migrate existing data:

```javascript
// Migration script (run once)
const migrateToFileIds = async () => {
  const portfolio = await Portfolio.findOne();
  
  // Migrate project screenshots (if stored as URLs)
  for (const project of portfolio.projects) {
    if (project.screenshotUrl) {
      // Download and re-upload as file
      const response = await fetch(project.screenshotUrl);
      const buffer = await response.buffer();
      const base64 = buffer.toString('base64');
      
      const file = await File.create({
        originalName: `${project.title}-screenshot.${ext}`,
        storedName: `${Date.now()}-screenshot.${ext}`,
        section: 'portfolio',
        fileType: 'image',
        size: buffer.length,
        uploadedBy: 'admin@example.com'
      });
      
      project.screenshots = [{
        title: 'Screenshot',
        fileId: file._id
      }];
      project.screenshotUrl = undefined; // Remove old URL
    }
  }
  
  await portfolio.save();
  console.log('Migration complete');
};
```

## 7. File Statistics in Admin Dashboard

### Display file usage by section:

```javascript
// Add to admin dashboard statistics
async function loadFileStatistics() {
  const response = await fetch('/api/files/stats');
  const stats = await response.json();
  
  console.log('File Statistics:');
  stats.forEach(stat => {
    console.log(`${stat._id}: ${stat.count} files, ${stat.totalSize / 1024 / 1024}MB`);
  });
  
  // Display in dashboard
  return stats.map(stat => ({
    section: stat._id,
    files: stat.count,
    size: (stat.totalSize / 1024 / 1024).toFixed(2) + ' MB',
    downloads: stat.totalDownloads
  }));
}
```

## 8. Automated File Cleanup

### Schedule cleanup task:

```javascript
// backend/server.js or separate cron job
const schedule = require('node-schedule');

// Run cleanup daily at 2 AM
schedule.scheduleJob('0 2 * * *', async () => {
  console.log('Running file cleanup...');
  
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const unused = await File.find({
    uploadedAt: { $lt: twoWeeksAgo },
    downloads: 0
  });
  
  console.log(`Found ${unused.length} unused files`);
  
  // Delete files
  for (const file of unused) {
    const filePath = path.join(__dirname, 'uploads', file.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await File.deleteOne({ _id: file._id });
  }
  
  console.log('Cleanup complete');
});
```

## 9. Download Tracking and Analytics

### Query download statistics:

```javascript
// Get most downloaded files
const getMostDownloaded = async (limit = 10) => {
  return await File.find()
    .sort({ downloads: -1 })
    .limit(limit);
};

// Get total downloads by section
const getDownloadsBySection = async () => {
  return await File.aggregate([
    {
      $group: {
        _id: '$section',
        totalDownloads: { $sum: '$downloads' }
      }
    }
  ]);
};

// Get recent uploads
const getRecentUploads = async (days = 7) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return await File.find({
    uploadedAt: { $gte: date }
  }).sort({ uploadedAt: -1 });
};
```

## 10. Error Handling Examples

### When files are deleted:

```javascript
// Check if referenced file still exists
const getFileOrError = async (fileId) => {
  const file = await File.findById(fileId);
  
  if (!file) {
    return {
      exists: false,
      message: 'File has been deleted',
      fallback: '/images/placeholder.png'
    };
  }
  
  return {
    exists: true,
    url: `/api/files/view/${fileId}`,
    downloadUrl: `/api/files/download/${fileId}`
  };
};

// In frontend display
const fileInfo = await getFileOrError(project.screenshots[0].fileId);
if (fileInfo.exists) {
  // Show file
} else {
  // Show placeholder or message
}
```

## Implementation Checklist

- [ ] Update Portfolio model with file IDs (optional)
- [ ] Add file attachment support to forms
- [ ] Modify edit functions to handle file uploads
- [ ] Update display components to show file links
- [ ] Migrate existing image URLs to file IDs
- [ ] Test file upload with each section
- [ ] Test file download and preview
- [ ] Implement cleanup task
- [ ] Set up analytics/monitoring
- [ ] Add error handling for missing files
- [ ] Document for team
- [ ] Train admins on file management

## Best Practices

1. **Always use file IDs**: Store File._id references instead of URLs
2. **Verify file exists**: Check before displaying links
3. **Handle deleted files**: Show fallback/placeholder if file missing
4. **Organize by section**: Keep files organized in database
5. **Regular cleanup**: Run cleanup task to remove unused files
6. **Monitor storage**: Track total file size and set alerts
7. **Backup files**: Regular backup of uploads directory
8. **Security**: Always validate auth on write operations

## Troubleshooting Integration

### Files not showing in admin list?
- Verify auth token is valid
- Check if files are in correct section
- Look for errors in browser console

### Download counter not updating?
- Verify database connection
- Check if file exists in database
- Look for MongoDB errors in logs

### File references broken after deletion?
- Add fallback/placeholder images
- Implement soft delete instead of hard delete
- Add migration for missing file references

## References

- **File Management API**: See `FILE_MANAGEMENT_API.md`
- **Implementation Guide**: See `FILE_MANAGEMENT_IMPLEMENTATION.md`
- **Quick Start**: See `FILE_MANAGEMENT_QUICK_START.md`
- **Changelog**: See `FILE_MANAGEMENT_CHANGELOG.md`

---

**Integration Complete**: Ready to connect file management with portfolio features
