// Central config for media URL - separated from api/index.js for Rollup compatibility
const VITE_API_URL = import.meta.env.VITE_API_URL;
let parsedMediaUrl = 'http://localhost:5000';
if (VITE_API_URL) {
    parsedMediaUrl = VITE_API_URL.replace(/\/api\/?$/, '');
}
export const MEDIA_URL = parsedMediaUrl;
