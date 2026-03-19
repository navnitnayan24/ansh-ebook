import axios from 'axios';

const API = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || '/api/'
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
export const fetchHomeContent = async () => {
    try {
        const [shayari, podcasts, ebooks] = await Promise.all([
            API.get('shayari'),
            API.get('podcast'),
            API.get('ebook')
        ]);
        
        return {
            data: {
                latest_shayari: shayari.data.slice(0, 3),
                latest_podcasts: podcasts.data.slice(0, 2),
                featured_ebooks: ebooks.data.slice(0, 4)
            }
        };
    } catch (error) {
        console.error("fetchHomeContent error:", error);
        return { data: { latest_shayari: [], latest_podcasts: [], featured_ebooks: [] } };
    }
};

export const fetchContentByType = async (type, params = {}) => {
    try {
        // Map the existing frontend "types" to our new backend routes
        let route = `${type}`;
        if (type === 'podcasts') route = 'podcast';
        if (type === 'ebooks') route = 'ebook';
        
        // Ensure query params are passed if present (e.g. ?q=search)
        const response = await API.get(`${route}`, { params });
        return { data: response.data };
    } catch (error) {
        console.error(`fetchContentByType (${type}) error:`, error);
        return { data: [] };
    }
};

export const fetchCategories = async (section) => {
    return API.get('content/categories', { params: { section } });
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

// Auth
export const login = (data) => API.post('auth/login', data);
export const register = (data) => API.post('auth/register', data);
export const adminLogin = (data) => API.post('auth/admin/login', data);

// Password Management
export const forgotPassword = (email) => API.post('auth/forgot-password', { email });
export const resetPassword = (token, password) => API.post(`auth/reset-password/${token}`, { password });
export const changePassword = (data) => API.post('auth/change-password', data);

// Settings
export const fetchSettings = () => API.get('admin/settings');
export const updateSetting = (data) => API.post('admin/settings', data);
export const fetchPublicSettings = () => API.get('settings');

// Subscribers
export const fetchSubscribers = () => API.get('admin/subscribers');
export const deleteSubscriber = (id) => API.delete(`admin/subscribers/${id}`);
export const subscribeUser = (email) => API.post('subscribe', { email });


export default API;
