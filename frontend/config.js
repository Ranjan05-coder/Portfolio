// API Configuration
// Automatically detect environment and set correct API base URL

const API_BASE = (() => {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Production - UPDATE THIS with your Render backend URL after deployment
  // Format: https://portfolio-backend-xxxxx.onrender.com/api
  // Replace xxxxx with your actual Render backend name
  
  // For now, assume it's on the same domain (Render can proxy this)
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
})();

console.log('✅ API Base URL:', API_BASE);
