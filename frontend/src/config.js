// Central config for media URL - separated from api/index.js for Rollup compatibility
const VITE_API_URL = import.meta.env.VITE_API_URL;
export const MEDIA_URL = VITE_API_URL ? VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
