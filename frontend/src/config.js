// Central config for media URL - separated from api/index.js for Rollup compatibility
let parsedMediaUrl = '';
if (import.meta.env.DEV) {
    parsedMediaUrl = 'http://localhost:5000';
} else if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
    parsedMediaUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
} else {
    // Permanent fallback for APK and Production if env is missing
    parsedMediaUrl = 'https://ansh-ebook.onrender.com';
}
export const MEDIA_URL = parsedMediaUrl;

export const getAvatarUrl = (pic, username = 'U') => {
    const fallback = `https://ui-avatars.com/api/?name=${username || 'U'}&background=random&color=fff`;
    if (!pic) return fallback;
    
    let rawPic = pic;
    // Normalize paths from different OS formats
    if (rawPic.includes('\\uploads\\')) rawPic = '/uploads/' + rawPic.split('\\uploads\\').pop();
    else if (rawPic.includes('/uploads/')) rawPic = '/uploads/' + rawPic.split('/uploads/').pop();
    
    const finalUrl = rawPic.startsWith('/uploads') ? `${MEDIA_URL}${rawPic}` : rawPic;
    return finalUrl;
};
