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

export const maskEmail = (name) => {
    if (!name) return 'User';
    if (typeof name === 'string' && name.includes('@')) return name.split('@')[0];
    return name;
};

export const getAvatarUrl = (pic, username = 'U') => {
    // Sanitized name for third party services like ui-avatars to prevent email leakage in URLs
    const safeName = maskEmail(username);
    
    // --- Premium Shadow Man Fallback ---
    // Using a reliable public 'Mystery Person' avatar from Gravatar or Flaticon
    const shadowMan = `https://www.gravatar.com/avatar/${encodeURIComponent(safeName)}?d=mp&f=y`;
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName || 'U')}&background=ff1493&color=fff&size=200`;
    
    // If no pic, return shadow man
    if (!pic || pic === 'default-avatar.png' || pic.includes('default') || pic === 'undefined' || pic === 'null') {
        return shadowMan;
    }
    
    let rawPic = pic;
    // Normalize paths from different OS formats
    if (typeof rawPic !== 'string') return fallback;
    
    if (rawPic.includes('\\uploads\\')) rawPic = '/uploads/' + rawPic.split('\\uploads\\').pop();
    else if (rawPic.includes('/uploads/')) rawPic = '/uploads/' + rawPic.split('/uploads/').pop();
    
    const finalUrl = rawPic.startsWith('/uploads') ? `${MEDIA_URL}${rawPic}` : rawPic;
    return finalUrl;
};
