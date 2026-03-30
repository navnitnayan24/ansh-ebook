import axios from 'axios';

const getBaseURL = () => {
    const url = import.meta.env.VITE_API_URL || '/api';
    return url.endsWith('/') ? url : `${url}/`;
};

const API = axios.create({ 
    baseURL: getBaseURL(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
});

API.interceptors.request.use((req) => {
    if (localStorage.getItem('token')) {
        req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }
    return req;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            console.warn('Unauthorized! Redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        } else if (status === 404) {
            console.error('API Endpoint not found. Please check backend routing.');
        } else if (status === 503) {
            alert('Backend is currently connecting to the database. Please wait a moment and refresh.');
        }

        return Promise.reject(error);
    }
);

// Home Dashboard Content (Mocking the previous aggregate fetch)
export const fetchHomeContent = () => API.get('home');

export const fetchContentByType = async (type, category = '', query = '') => {
    try {
        // Map the existing frontend "types" to our new backend routes
        let route = `${type}`;
        if (type === 'podcasts' || type === 'PODCAST') route = 'podcast';
        if (type === 'ebooks' || type === 'EBOOK') route = 'ebook';
        
        // Build query params — backend expects ?category=<id>&q=<search>
        const params = {};
        if (category) params.category = category;
        if (query) params.q = query;

        const response = await API.get(`${route}`, { params });
        return { data: response.data };
    } catch (error) {
        console.error(`fetchContentByType (${type}) error:`, error);
        return { data: [] };
    }
};

export const fetchCategories = async (section) => {
    return API.get('categories', { params: { section } });
};

// Admin CRUD Operations
export const addContent = (type, data) => {
    let route = `${type}`;
    if (type === 'podcasts') route = 'podcast';
    if (type === 'ebooks') route = 'ebook';
    return API.post(`admin/${route}`, data);
};

export const updateContent = (type, id, data) => {
    let route = `${type}`;
    if (type === 'podcasts') route = 'podcast';
    if (type === 'ebooks') route = 'ebook';
    return API.put(`admin/${route}/${id}`, data);
};

export const deleteContent = (type, id) => {
    let route = `${type}`;
    if (type === 'podcasts') route = 'podcast';
    if (type === 'ebooks') route = 'ebook';
    return API.delete(`admin/${route}/${id}`);
};

export const fetchCloudinarySignature = () => API.get('realtime/cloudinary-signature');

// Auth
export const login = (data) => API.post('auth/login', data);
export const register = (data) => API.post('auth/register', data);
export const adminLogin = (data) => API.post('auth/admin/login', data);
export const updateProfile = (data) => API.put('auth/profile', data);

// Categories
export const addCategory = (data) => API.post('admin/categories', data);
export const deleteCategory = (id) => API.delete(`admin/categories/${id}`);

// Password Management
export const forgotPassword = (email) => API.post('auth/forgot-password', { email });
export const resetPassword = (token, password) => API.post(`auth/reset-password/${token}`, { password });
export const changePassword = (data) => API.post('auth/change-password', data);

// Settings
export const fetchSettings = () => API.get('admin/settings');
export const updateSetting = (data) => API.post('admin/settings', data);
export const fetchPublicSettings = () => API.get('settings');

// Subscribers & Users
export const fetchSubscribers = () => API.get('admin/subscribers');
export const deleteSubscriber = (id) => API.delete(`admin/subscribers/${id}`);
export const subscribeUser = (email) => API.post('subscribe', { email });
export const fetchUsers = () => API.get('admin/users');
export const deleteUser = (id) => API.delete(`admin/users/${id}`);
export const searchUsers = (q) => API.get('realtime/users', { params: { q } });
export const searchMusic = (q) => API.get('music', { params: { q } });

// Reviews
export const fetchReviews = () => API.get('reviews');
export const addReview = (data) => API.post('reviews', data);
export const deleteReview = (id) => API.delete(`admin/reviews/${id}`);
export const updateReviewReaction = (id, type) => API.post(`reviews/${id}/reaction`, { type });

// User Music Library & Playlists
export const fetchUserLibrary = () => API.get('user/library');
export const toggleMusicFavorite = (id) => API.post(`music/${id}/favorite`);
export const createMusicPlaylist = (name) => API.post('music/playlist', { name });
export const addToMusicPlaylist = (playlistId, songId) => API.post(`music/playlist/${playlistId}/add/${songId}`);
export const removeFromMusicPlaylist = (playlistId, songId) => API.delete(`music/playlist/${playlistId}/remove/${songId}`);

// Realtime Module APIs
export const fetchChats = () => API.get('realtime/chats');
export const fetchMessages = (chatId) => API.get(`realtime/messages/${chatId}`);
export const findOrCreateChat = (userId) => API.post('realtime/chats', { userId });
export const createGroupChat = (data) => API.post('realtime/groups', data);
export const addMember = (data) => API.post('realtime/add-member', data);
export const removeMember = (data) => API.post('realtime/remove-member', data);
export const updateGroup = (data) => API.post('realtime/update-group', data);
export const acceptInvite = (chatId) => API.post(`realtime/accept-invite/${chatId}`);
export const rejectInvite = (chatId, userId) => API.post(`realtime/reject-invite/${chatId}`, { userId });
export const leaveGroup = (chatId) => API.post('realtime/leave-group', { chatId });
export const joinGroupByCode = (joinCode) => API.post('realtime/join-group-code', { joinCode });
export const pinMessage = (data) => API.post('realtime/pin', data);

// Status/Story Module APIs
export const fetchActiveStories = () => API.get('status/active');
export const createStatus = (formData) => API.post('status', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const viewStatus = (id) => API.post(`status/view/${id}`);
export const toggleStatusLike = (id) => API.post(`status/like/${id}`);
export const replyToStatus = (id, text) => API.post(`status/reply/${id}`, { text });
export const addCommentToStatus = (id, text) => API.post(`status/comment/${id}`, { text });
export const deleteStatus = (id) => API.delete(`status/${id}`);

export { API };
export default API;
