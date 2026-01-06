// API Base URL từ environment variable
// In production, use Render backend. In development, use localhost
const BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://hvtsocial-backend.onrender.com' : 'http://localhost:5000');

export const API_URL = `${BASE_URL}/api`;
export const SERVER_ORIGIN = BASE_URL;

// Debug: Log the API URL being used (will be visible in browser console)
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    BASE_URL,
    API_URL: `${BASE_URL}/api`
  });
}
