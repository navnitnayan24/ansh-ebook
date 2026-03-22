// Central config for media URL - separated from api/index.js for Rollup compatibility
let parsedMediaUrl = '';
if (import.meta.env.DEV) {
    parsedMediaUrl = 'http://localhost:5000';
} else if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
    parsedMediaUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
}
export const MEDIA_URL = parsedMediaUrl;
