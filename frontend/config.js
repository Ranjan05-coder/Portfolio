// API Configuration
// Automatically detect environment and set correct API base URL

const API_BASE = (() => {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Production - Render backend URL
  return 'https://my-portfolio-iram.onrender.com/api';
})();

console.log('✅ API Base URL:', API_BASE);
console.log('Production API configured for:', window.location.hostname);
