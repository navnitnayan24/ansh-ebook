import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Edit, Save, X, Search, Settings as SettingsIcon, ArrowLeft, Home } from 'lucide-react';
import { 
    fetchContentByType, addContent, updateContent, deleteContent, 
    fetchCategories, fetchSettings, updateSetting, 
    changePassword as changePasswordApi, 
    fetchSubscribers, fetchUsers, deleteSubscriber, deleteUser, deleteCategory,
    fetchReviews, deleteReview
} from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { MEDIA_URL } from '../config';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('shayari');
    const [storageStatus, setStorageStatus] = useState('local'); 
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newCategory, setNewCategory] = useState({ name: '', section: 'shayari' });
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        author: '',
        link: '',
        thumbnail: '',
        price: '',
        category_id: ''
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);

    const getSavedUser = () => {
        try {
            const saved = localStorage.getItem('user');
            if (!saved || saved === 'undefined') return null;
            return JSON.parse(saved);
        } catch (e) { return null; }
    };
    const user = getSavedUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        }
    }, [user, navigate]);

    const loadItems = async () => {
        setLoading(true);
        try {
            // Check storage status
            try {
                const healthRes = await fetch(`${MEDIA_URL}/health`);
                const healthData = await healthRes.json();
                if (healthData.storageType) setStorageStatus(healthData.storageType);
            } catch (e) {}

            if (activeTab === 'settings' || activeTab === 'advertisements') {
                const { data } = await fetchSettings();
                setItems(data);
            } else if (activeTab === 'subscribers') {
                const { data } = await fetchSubscribers();
                setItems(data);
            } else if (activeTab === 'users') {
                const { data } = await fetchUsers();
                setItems(data);
            } else if (activeTab === 'categories') {
                const { data } = await fetchCategories();
                setItems(data);
            } else if (activeTab === 'reviews') {
                const { data } = await fetchReviews();
                setItems(data);
            } else {
                const { data } = await fetchContentByType(activeTab);
                setItems(data);
                
                if (['shayari', 'music', 'podcasts', 'ebooks'].includes(activeTab)) {
                    const catRes = await fetchCategories(activeTab);
                    setCategories(catRes.data);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [activeTab]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setEditId(item._id);
            setFormData({
                title: item.title || '',
                content: item.content || '',
                category_id: item.category_id?._id || item.category_id || '',
                author: item.author || '',
                artist: item.artist || '',
                genre: item.genre || '',
                duration: item.duration || '',
                thumbnail: item.thumbnail || '',
                file_url: item.file_url || '',
                description: item.description || '',
                category: item.category || '',
                link: item.link || '',
                price: item.price || ''
            });
        } else {
            setIsEditing(false);
            setEditId(null);
            setFormData({
                title: '', content: '', category_id: '', author: '', artist: '', 
                genre: '', duration: '', thumbnail: '', file_url: '', description: '',
                category: '', link: '', price: ''
            });
            setThumbnailFile(null);
            setAudioFile(null);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // --- MANUAL VALIDATION ---
        if (activeTab === 'shayari' && !formData.content) {
            return alert('Validation Error: Please enter Shayari content');
        }
        if (activeTab === 'music' && (!formData.title || !formData.artist)) {
            return alert('Validation Error: Title and Artist are required for Music');
        }
        if ((activeTab === 'podcasts' || activeTab === 'ebooks') && !formData.title) {
            return alert('Validation Error: Title is required');
        }

        setLoading(true);
        try {
            const typeMap = {
                'shayari': 'shayari',
                'music': 'music',
                'podcasts': 'podcast',
                'ebooks': 'ebook'
            };
            const modelName = typeMap[activeTab] || activeTab;
            
            let dataToSend = { ...formData };
            
            if (modelName === 'music' || modelName === 'ebook') {
                if (dataToSend.thumbnail) dataToSend.cover_url = dataToSend.thumbnail;
            } else if (modelName === 'podcast') {
                if (dataToSend.thumbnail) dataToSend.thumbnail_url = dataToSend.thumbnail;
            }

            if (!dataToSend.category_id) delete dataToSend.category_id;
            
            let payload = dataToSend;
            const MAX_SIZE = 0; // 0MB - ALWAYS BYPASS BACKEND FOR FILES
            
            const uploadDirectlyToCloudinary = async (file) => {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('upload_preset', 'ml_default');
                const cloudName = 'datao7ela'; // Hardcoded fallback for bypass
                let resourceType = 'auto';
                if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                    resourceType = 'video';
                } else if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
                    resourceType = 'raw';
                }
                
                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                    method: 'POST',
                    body: fd
                });

                if (!res.ok) {
                    const errorObj = await res.json();
                    throw new Error(errorObj.error?.message || 'Bypass upload failed. Check upload_preset or size limit.');
                }
                const resData = await res.json();
                return resData.secure_url;
            };

            let bypassThumb = !!thumbnailFile;
            let bypassAudio = !!audioFile;

            if (bypassThumb) {
                const url = await uploadDirectlyToCloudinary(thumbnailFile);
                dataToSend.thumbnail = url;
                if (modelName === 'music' || modelName === 'ebook') dataToSend.cover_url = url;
                if (modelName === 'podcast') dataToSend.thumbnail_url = url;
            }
            if (bypassAudio) {
                const url = await uploadDirectlyToCloudinary(audioFile);
                dataToSend.file_url = url;
            }

            if (thumbnailFile || audioFile) {
                const formDataObj = new FormData();
                Object.keys(dataToSend).forEach(key => {
                    const val = dataToSend[key];
                    if (val !== undefined && val !== null) {
                        formDataObj.append(key, val);
                    }
                });
                // Since we always bypass if files exist, we never append files to formData sent to Render
                payload = formDataObj;
            }

            if (isEditing) {
                await updateContent(modelName, editId, payload);
            } else {
                await addContent(modelName, payload);
            }
            alert('Item saved successfully!');
            setShowModal(false);
            await loadItems();
            setThumbnailFile(null);
            setAudioFile(null);
        } catch (err) {
            console.error('Submit Error:', err);
            const errorData = err.response?.data;
            const errorMsg = errorData?.error || errorData?.message || err.message;
            
            // Allow explicit Cloudinary bypass errors (which lack err.response) to bubble through
            if (errorMsg.includes('Bypass upload failed') || errorMsg.includes('File is too large')) {
                alert(`Upload Failed: ${errorMsg}\n\nPlease try compressing the file. Maximum Cloudinary file limit applies.`);
            } else if (errorMsg.toLowerCase().includes('network error') && !err.response) {
                alert(`Upload Failed: Network Error.\n\nPossible causes:\n1. File is too large.\n2. Internet connection was interrupted.\n3. Server timed out.\n\nPlease try again with a smaller file or a faster connection.`);
            } else if (errorMsg.toLowerCase() === 'failed to fetch') {
                alert(`Upload Failed: Direct Upload Network Error.\n\nPossible causes:\n1. File is too large for the Cloudinary free tier (limit is 10MB for raw files).\n2. Ad-blockers or firewall blocked the upload.\n3. Internet connection was interrupted.\n\nPlease try again.`);
            } else if (errorMsg.toLowerCase().includes('auth server misconfigured')) {
                alert(`Security Error: JWT Secret Missing.\n\nPlease add 'JWT_SECRET' to your Render environment variables to fix this permanently.`);
            } else {
                alert(`Server/Validation Error: ${errorMsg}\n\nPlease check your input and try again.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('ARE YOU SURE YOU WANT TO DELETE THIS ITEM?')) {
            try {
                if (activeTab === 'categories') {
                    await deleteCategory(id);
                } else if (activeTab === 'reviews') {
                    await deleteReview(id);
                } else if (activeTab === 'users') {
                    await deleteUser(id);
                } else {
                    const typeMap = { 'podcasts': 'podcast', 'ebooks': 'ebook' };
                    const modelName = typeMap[activeTab] || activeTab;
                    await deleteContent(modelName, id);
                }
                setItems(items.filter(item => item._id !== id));
            } catch (err) {
                console.error('Delete Error:', err);
                const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
                alert(`Delete failed: ${errorMsg}`);
            }
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await addCategory(newCategory);
            setNewCategory({ name: '', section: 'shayari' });
            loadItems();
        } catch (err) {
            alert('Failed to add category');
        }
    };

    const filteredItems = Array.isArray(items) ? items.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        return (
            (item.title || '').toLowerCase().includes(searchStr) || 
            (item.content || '').toLowerCase().includes(searchStr) || 
            (item.description || '').toLowerCase().includes(searchStr) || 
            (item.name || '').toLowerCase().includes(searchStr) || 
            (item.key || '').toLowerCase().includes(searchStr) || 
            (item.email || '').toLowerCase().includes(searchStr) || 
            (item.username || '').toLowerCase().includes(searchStr)
        );
    }) : [];

    const getAvatarUrl = (pic) => {
        if (!pic) return null;
        let rawPic = pic;
        if (rawPic.includes('\\uploads\\')) rawPic = '/uploads/' + rawPic.split('\\uploads\\').pop();
        else if (rawPic.includes('/uploads/')) rawPic = '/uploads/' + rawPic.split('/uploads/').pop();
        return rawPic.startsWith('/uploads') ? `${MEDIA_URL}${rawPic}` : rawPic;
    };

    return (
        <div className="dashboard-page container">
            <div className="dashboard-header">
                <div className="title-area">
                    <div className="title-row">
                        <Link to="/" className="btn btn-outline btn-sm btn-pill site-btn">
                            <Home size={16} /> Home
                        </Link>
                        <h1 className="admin-title">Admin <span className="text-gradient">Panel</span></h1>
                        <span className="badge ml-2" style={{fontSize: '0.8rem'}}>{Array.isArray(items) ? items.length : 0} Items</span>
                        {/* Storage Status Indicator */}
                        {/* Assuming MEDIA_URL is defined and indicates the storage type */}
                        {/* For example, if MEDIA_URL contains 'cloudinary', it's Cloudinary, otherwise local */}
                        {(() => {
                            const isCloudinaryConfigured = storageStatus === 'cloudinary';
                            return (
                                <div className="storage-status ml-3">
                                    <div className={`storage-indicator ${isCloudinaryConfigured ? 'safe' : 'warning'}`} onClick={() => alert("Storage Configuration Guide:\n\n1. To save files PERMANENTLY, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Render Dashboard.\n2. Currently using 'Local' storage which DELETES files every time the server restarts or code is updated.")}>
                                        <div className="dot"></div>
                                        <span>Storage: {isCloudinaryConfigured ? 'Cloudinary (Permanent)' : 'Local (Temporary - Files will be deleted on redeploy)'}</span>
                                        {!isCloudinaryConfigured && <span style={{marginLeft: '10px', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem'}}>How to fix?</span>}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    <div className="welcome-txt" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user?.profile_pic ? (
                            <img src={getAvatarUrl(user.profile_pic)} alt="Admin" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>{user?.username?.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Welcome back,</span><br/>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.username}</span>
                        </div>
                    </div>
                </div>
                {activeTab !== 'settings' && activeTab !== 'advertisements' && activeTab !== 'security' && activeTab !== 'categories' && (
                    <button className="btn btn-primary shadow-neon" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> ADD NEW {activeTab.toUpperCase()}
                    </button>
                )}
            </div>

             <motion.div 
                className={`dashboard-content framed-body glass-card content-section-${activeTab}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                key={activeTab}
            >
                <div className="dashboard-controls">
                    <div className="tabs">
                        {['shayari', 'music', 'podcasts', 'ebooks', 'users', 'subscribers', 'categories', 'reviews', 'advertisements', 'settings', 'security'].map(tab => (
                            <motion.button 
                                key={tab} 
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {tab === 'security' ? 'PASSWORD' : tab.toUpperCase()}
                            </motion.button>
                        ))}
                    </div>
                    <div className="search-box glass-card shadow-sm">
                        <Search size={18} className="text-muted" />
                        <input 
                            type="text" 
                            placeholder={`Search in ${activeTab}...`} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? <div className="loader">Updating...</div> : (
                    <div className="table-wrapper animate-fade-in">
                        {activeTab === 'advertisements' ? (
                            <div className="settings-grid">
                                <div className="settings-item glass-card" style={{gridColumn: '1 / -1'}}>
                                    <div className="setting-info" style={{marginBottom: '1rem'}}>
                                        <h3 className="pink-gradient-text">Advertisement Configuration</h3>
                                        <p className="text-muted">Paste your AdSense or custom ad script below.</p>
                                    </div>
                                    <textarea 
                                        value={items.find(i => i.key === 'google_adsense_script')?.value || ''} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const exists = items.find(i => i.key === 'google_adsense_script');
                                            if (exists) {
                                                setItems(items.map(it => it.key === 'google_adsense_script' ? {...it, value: val} : it));
                                            } else {
                                                setItems([...items, {key: 'google_adsense_script', value: val, description: 'Google AdSense Script'}]);
                                            }
                                        }}
                                        placeholder="Paste ad script code here..."
                                        style={{minHeight: '200px', fontFamily: 'monospace'}}
                                    />
                                    <button 
                                        className="btn btn-primary shadow-neon mt-2"
                                        onClick={async () => {
                                            try {
                                                const setting = items.find(i => i.key === 'google_adsense_script');
                                                if(setting) {
                                                    await updateSetting({ key: setting.key, value: setting.value, description: 'Advertisement Script' });
                                                    alert('Ad Script Saved!');
                                                }
                                            } catch (err) {
                                                alert('Failed to save script');
                                            }
                                        }}
                                    >
                                        <Save size={18} /> Save Ad Code
                                    </button>
                                </div>
                            </div>
                        ) : activeTab === 'security' ? (
                            <div className="settings-grid">
                                <div className="settings-item glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                                    <h3 className="pink-gradient-text" style={{ marginBottom: '1.5rem' }}>Change Admin Password</h3>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (passwordData.newPassword !== passwordData.confirmPassword) {
                                            return alert('New passwords do not match');
                                        }
                                        setLoading(true);
                                        try {
                                            await changePasswordApi({
                                                oldPassword: passwordData.oldPassword,
                                                newPassword: passwordData.newPassword
                                            });
                                            alert('Password updated successfully!');
                                            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                        } catch (err) {
                                            alert(err.response?.data?.error || 'Failed to update password');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}>
                                        <div className="form-group full">
                                            <label>Current Password</label>
                                            <input type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} />
                                        </div>
                                        <div className="form-group full">
                                            <label>New Password</label>
                                            <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                                        </div>
                                        <div className="form-group full">
                                            <label>Confirm Password</label>
                                            <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                                        </div>
                                        <button type="submit" className="btn btn-primary shadow-neon mt-2" style={{ width: '100%' }} disabled={loading}>
                                            {loading ? 'Updating...' : 'UPDATE PASSWORD'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : activeTab === 'settings' ? (
                            <div className="settings-grid">
                                {Array.isArray(items) && items.length > 0 ? items.map(setting => (
                                    <div key={setting._id} className="settings-item glass-card">
                                        <div className="setting-info">
                                            <h4>{setting.description || setting.key}</h4>
                                            <code>{setting.key}</code>
                                        </div>
                                        <textarea 
                                            value={setting.value} 
                                            onChange={(e) => {
                                                const newItems = items.map(it => it._id === setting._id ? {...it, value: e.target.value} : it);
                                                setItems(newItems);
                                            }}
                                        />
                                        <button className="btn btn-primary btn-sm mt-2" onClick={async () => {
                                            try { await updateSetting({ key: setting.key, value: setting.value }); alert('Saved!'); } catch (err) { alert('Failed'); }
                                        }}>
                                            <Save size={16} /> Save
                                        </button>
                                    </div>
                                )) : (
                                    <div className="empty-state glass-card" style={{gridColumn: '1 / -1', padding: '2rem'}}>
                                        <p>No site settings found in database.</p>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'subscribers' ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item._id} className="table-row">
                                            <td>{item.email}</td>
                                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="icon-btn delete" onClick={async () => {
                                                    if (window.confirm('Remove?')) {
                                                        await deleteSubscriber(item._id);
                                                        setItems(items.filter(i => i._id !== item._id));
                                                    }
                                                }}><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : activeTab === 'users' ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item._id} className="table-row">
                                            <td>{item.username}</td>
                                            <td>{item.email}</td>
                                            <td><span className="badge">{item.role || 'user'}</span></td>
                                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="icon-btn delete" onClick={async () => {
                                                    if (window.confirm('Delete User?')) {
                                                        await deleteUser(item._id);
                                                        setItems(items.filter(i => i._id !== item._id));
                                                    }
                                                }}><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : activeTab === 'reviews' ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Review Content</th>
                                        <th>Rating</th>
                                        <th>Interactions</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item._id} className="table-row">
                                            <td style={{fontWeight: 'bold', color: 'var(--pink-primary)'}}>{item.username}</td>
                                            <td style={{maxWidth: '300px', fontSize: '0.85rem'}}>{item.content}</td>
                                            <td>
                                                <div style={{display: 'flex', color: '#ffd700'}}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} style={{opacity: i < item.rating ? 1 : 0.2}}>★</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{fontSize: '0.8rem'}}>
                                                <span style={{color: '#4caf50'}}>👍 {item.likes}</span> | <span style={{color: '#f44336'}}>👎 {item.dislikes}</span>
                                            </td>
                                            <td>
                                                <button className="icon-btn delete" onClick={() => handleDelete(item._id)}><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : activeTab === 'categories' ? (
                            <div className="categories-management">
                                <form className="add-category-form glass-card mb-4" onSubmit={handleAddCategory} style={{padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                                    <div className="form-group" style={{flex: 1, minWidth: '200px'}}>
                                        <label>New Category Name</label>
                                        <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} placeholder="e.g. Romance" required />
                                    </div>
                                    <div className="form-group" style={{width: '200px'}}>
                                        <label>Section</label>
                                        <select value={newCategory.section} onChange={(e) => setNewCategory({...newCategory, section: e.target.value})}>
                                            <option value="shayari">Shayari</option>
                                            <option value="music">Music</option>
                                            <option value="podcasts">Podcasts</option>
                                            <option value="ebooks">Ebooks</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary shadow-neon" style={{height: '45px'}}>ADD CATEGORY</button>
                                </form>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Section</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map(item => (
                                            <tr key={item._id} className="table-row">
                                                <td>{item.name}</td>
                                                <td><span className="badge">{item.section?.toUpperCase()}</span></td>
                                                <td>
                                                    <button className="icon-btn delete" onClick={() => handleDelete(item._id)}><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Title/Content</th>
                                        <th className="hide-mobile">Details</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item._id} className="table-row">
                                            <td className="main-cell">
                                                <div className="cell-content">
                                                    {item.thumbnail && <img src={item.thumbnail.startsWith('/uploads') ? `${MEDIA_URL}${item.thumbnail}` : item.thumbnail} alt="" className="cell-thumb" />}
                                                    {item.cover_url && !item.thumbnail && <img src={item.cover_url.startsWith('/uploads') ? `${MEDIA_URL}${item.cover_url}` : item.cover_url} alt="" className="cell-thumb" />}
                                                    <div>
                                                        <span className="item-title">
                                                            {activeTab === 'users' ? (item.username || item.email) : 
                                                             activeTab === 'reviews' ? (item.content?.substring(0, 50) + '...') :
                                                             (item.title || (item.content?.substring(0, 30) + '...'))}
                                                        </span>
                                                        <span className="item-sub">
                                                            {activeTab === 'users' ? item.email : 
                                                             activeTab === 'reviews' ? `By: ${item.username || 'Anonymous'}` :
                                                             (item.artist || item.author || 'N/A')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-mobile">
                                                <span className="badge">
                                                    {activeTab === 'users' ? 'USER' : 
                                                     activeTab === 'reviews' ? `Rating: ${item.rating}/5` :
                                                     (item.category_id?.name || item.category || item.genre || 'General')}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                {activeTab !== 'users' && activeTab !== 'reviews' && (
                                                    <button className="icon-btn edit" onClick={() => handleOpenModal(item)}><Edit size={18} /></button>
                                                )}
                                                <button className="icon-btn delete" onClick={() => handleDelete(item._id)}><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {activeTab !== 'settings' && activeTab !== 'security' && activeTab !== 'advertisements' && filteredItems.length === 0 && <div className="empty-state">No items found in {activeTab}.</div>}
                    </div>
                )}
            </motion.div>

            {showModal && (
                <div className="modal-overlay">
                    <motion.div 
                        className="glass-card modal-card shadow-neon"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                    >
                        <div className="modal-header">
                            <h3 className="pink-gradient-text">{isEditing ? 'UPDATE' : 'ADD NEW'} {activeTab.toUpperCase()}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-grid">
                                {activeTab === 'shayari' ? (
                                    <>
                                        <div className="form-group full">
                                            <label>Shayari Content</label>
                                            <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Type here..." rows="4" />
                                        </div>
                                        <div className="form-group">
                                            <label>Category (Type Name)</label>
                                            <input list="cat-suggestions" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Love, Sad" />
                                            <datalist id="cat-suggestions">
                                                {categories && categories.map(cat => <option key={cat._id} value={cat.name} />)}
                                            </datalist>
                                        </div>
                                        <div className="form-group">
                                            <label>Author</label>
                                            <input type="text" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} />
                                        </div>
                                    </>
                                ) : activeTab === 'music' ? (
                                    <>
                                        <div className="form-group full">
                                            <label>Title</label>
                                            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Artist</label>
                                            <input type="text" value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category ID</label>
                                            <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}>
                                                <option value="">Select Category</option>
                                                {categories && categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Thumbnail / Upload</label>
                                            <input type="text" value={formData.thumbnail} onChange={(e) => setFormData({...formData, thumbnail: e.target.value})} placeholder="Image URL" />
                                            <input type="file" onChange={(e) => setThumbnailFile(e.target.files[0])} style={{marginTop: '5px'}}/>
                                        </div>
                                        <div className="form-group">
                                            <label>File URL / Upload Audio</label>
                                            <input type="text" value={formData.file_url} onChange={(e) => setFormData({...formData, file_url: e.target.value})} placeholder="Direct Audio URL" />
                                            <input type="file" onChange={(e) => setAudioFile(e.target.files[0])} accept="audio/*" style={{marginTop: '5px'}}/>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group full">
                                            <label>Title</label>
                                            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                                        </div>
                                        <div className="form-group full">
                                            <label>Description</label>
                                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}>
                                                <option value="">Select Category</option>
                                                {categories && categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Thumbnail / Upload</label>
                                            <input type="text" value={formData.thumbnail} onChange={(e) => setFormData({...formData, thumbnail: e.target.value})} />
                                            <input type="file" onChange={(e) => setThumbnailFile(e.target.files[0])} style={{marginTop: '5px'}}/>
                                        </div>
                                        <div className="form-group">
                                            <label>File URL / Upload Document/Audio</label>
                                            <input type="text" value={formData.file_url} onChange={(e) => setFormData({...formData, file_url: e.target.value})} placeholder="Direct File URL" />
                                            <input type="file" onChange={(e) => setAudioFile(e.target.files[0])} accept="audio/*,application/pdf" style={{marginTop: '5px'}}/>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                <button type="submit" className="btn btn-primary shadow-neon">
                                    <Save size={18} /> {isEditing ? 'Confirm Update' : 'CONFIRM SAVE'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
