// API Base URL từ environment variable
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_URL = `${BASE_URL}/api`;
export const SERVER_ORIGIN = BASE_URL;
