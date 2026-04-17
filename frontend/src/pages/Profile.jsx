import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, LogOut, ArrowRight, Heart, BookOpen, Trash2, CheckCircle, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '../api';
import { MEDIA_URL, getAvatarUrl } from '../config';
import Avatar from '../components/Avatar';
import '../styles/Profile.css';

const PREDEFINED_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Cricket',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Toby',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilly'
];

const Profile = () => {
    const [user, setUser] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser || savedUser === 'undefined') {
            navigate('/login');
        } else {
            setUser(JSON.parse(savedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const updateProfileOnServer = async (payload, isMultipart = false) => {
        setUploading(true);
        try {
            const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
            const { data } = await API.put('auth/profile', payload, config);
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('storage'));
            return true;
        } catch (err) {
            alert('Update failed: ' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('profile_pic', file);
        await updateProfileOnServer(formData, true);
    };

    const handleSelectAvatar = async (url) => {
        await updateProfileOnServer({ avatarUrl: url });
        setShowAvatarPicker(false);
    };

    const handleRemovePhoto = async () => {
        if (window.confirm('Remove profile picture?')) {
            await updateProfileOnServer({ remove: true });
        }
    };

    if (!user) return <div className="loader-container"><div className="loader"></div></div>;

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            className="profile-page container py-5"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="profile-header-card glass-card p-4 p-md-5 mb-5">
                <div className="profile-hero-area d-flex flex-column flex-md-row align-items-center gap-4">
                    <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                        <div className="avatar-glow"></div>
                        <div className="main-avatar-container shadow-neon">
                            <Avatar 
                                pic={user.profile_pic} 
                                username={user.username} 
                                className="avatar-icon-large" 
                            />
                            {uploading && <div className="upload-overlay"><div className="loader-mini"></div></div>}
                        </div>
                        
                        <div className="avatar-controls-pill glass-card shadow-sm">
                            <input type="file" id="profile-upload" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePicUpload} />
                            <label htmlFor="profile-upload" title="Upload from Device" className="control-btn"><Camera size={16} /></label>
                            <button title="Choose Avatar" className="control-btn" onClick={() => setShowAvatarPicker(!showAvatarPicker)}><CheckCircle size={16} /></button>
                            {user.profile_pic && (
                                <button title="Remove Photo" className="control-btn delete" onClick={handleRemovePhoto}><Trash2 size={16} /></button>
                            )}
                        </div>
                    </div>

                    <div className="profile-main-info flex-grow-1 text-center text-md-start">
                        <motion.h1 className="username-display mb-2" variants={itemVariants}>
                            {maskEmail(user?.username)} <span className="role-badge">{user?.role}</span>
                        </motion.h1>
                        <motion.p className="email-display muted-text mb-0" variants={itemVariants}>
                            <Mail size={16} className="me-2" /> {maskEmail(user?.email)}
                        </motion.p>
                    </div>

                    <motion.button onClick={handleLogout} className="btn btn-dark-outline btn-pill mt-3 mt-md-0" variants={itemVariants}>
                        <LogOut size={18} className="me-2" /> Logout
                    </motion.button>
                </div>

                <AnimatePresence>
                    {showAvatarPicker && (
                        <motion.div 
                            className="avatar-picker-panel mt-4 pt-4 border-top"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <h4 className="mb-3 pink-text" style={{fontSize: '1rem'}}>Pick a <span className="text-gradient">Bitmoji Avatar</span> ({maskEmail(user?.username)})</h4>

                            <div className="avatar-grid">
                                {PREDEFINED_AVATARS.map((url, idx) => (
                                    <motion.img 
                                        key={idx}
                                        src={url}
                                        className={`picker-avatar ${user.profile_pic === url ? 'active' : ''}`}
                                        whileHover={{ scale: 1.1 }}
                                        onClick={() => handleSelectAvatar(url)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="profile-grid">
                <motion.div className="profile-stats glass-card p-4" variants={itemVariants}>
                    <h3 className="section-title mb-4">Account <span className="pink-text">Analytics</span></h3>
                    <div className="stats-list">
                        <div className="stat-entry">
                            <div className="stat-icon-box"><Shield size={20} /></div>
                            <div className="stat-text">
                                <span className="label">Member Status</span>
                                <span className="value">Verified {user?.role}</span>
                            </div>
                        </div>
                        <div className="stat-entry">
                            <div className="stat-icon-box"><Calendar size={20} /></div>
                            <div className="stat-text">
                                <span className="label">Joined Date</span>
                                <span className="value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' }) : 'March 2026'}</span>
                            </div>
                        </div>
                        <div className="stat-entry">
                            <div className="stat-icon-box pink"><Heart size={20} /></div>
                            <div className="stat-text">
                                <span className="label">Interests</span>
                                <span className="value">Music & Shayari</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="profile-actions glass-card p-4" variants={itemVariants}>
                    <h3 className="section-title mb-4">Quick <span className="text-gradient">Navigation</span></h3>
                    <div className="quick-links-grid">
                        <Link to="/#shayari" className="nav-action-card">
                            <div className="card-icon"><Heart size={22} /></div>
                            <div className="card-content">
                                <h5>Saved Shayari</h5>
                                <p>View your favorites</p>
                            </div>
                            <ArrowRight size={18} className="arrow" />
                        </Link>
                        <Link to="/music" className="nav-action-card">
                            <div className="card-icon"><BookOpen size={22} /></div>
                            <div className="card-content">
                                <h5>My Library</h5>
                                <p>Your melodies</p>
                            </div>
                            <ArrowRight size={18} className="arrow" />
                        </Link>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="nav-action-card admin-special">
                                <div className="card-icon"><Shield size={22} /></div>
                                <div className="card-content">
                                    <h5>Admin Panel</h5>
                                    <p>Manage platform</p>
                                </div>
                                <ArrowRight size={18} className="arrow" />
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Profile;
