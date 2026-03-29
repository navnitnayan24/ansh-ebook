import React, { useState, useEffect } from 'react';
import { 
    User, Lock, Shield, Bell, Palette, Camera, 
    ChevronRight, Moon, Sun, Monitor, Check, 
    Mail, Phone, Globe, Trash2, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Add imports for Avatar Updates
import { fetchCloudinarySignature, updateProfile } from '../api';
import Avatar from '../components/Avatar';
import '../styles/Settings.css';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    
    // Privacy Toggles
    const [privacy, setPrivacy] = useState({
        onlineStatus: true,
        readReceipts: true,
        profileVisibility: 'everyone'
    });

    // Notification Toggles
    const [notifications, setNotifications] = useState({
        messages: true,
        groupActivity: true,
        appUpdates: false
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser && savedUser !== 'undefined') {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setEditUsername(parsedUser.username || '');
            setEditBio(parsedUser.bio || '');
        }
    }, []);

    const sections = [
        { id: 'profile', label: 'Profile', icon: <User size={20} /> },
        { id: 'account', label: 'Account', icon: <Lock size={20} /> },
        { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    ];

    const handleAvatarUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUpdatingAvatar(true);
        try {
            // Fetch signature
            const sigRes = await fetchCloudinarySignature();
            const { signature, timestamp, cloudName, apiKey } = sigRes.data;

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            fd.append('access_mode', 'public');

            // Upload directly to Cloudinary
            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: fd
            });
            const cloudData = await cloudRes.json();

            // Notify backend wrapper
            const updateRes = await updateProfile({ avatarUrl: cloudData.secure_url });
            
            // Update local state and auth token
            setUser(updateRes.data.user);
            localStorage.setItem('user', JSON.stringify(updateRes.data.user));
            alert("Profile picture updated successfully!");
        } catch (error) {
            console.error("Failed to update avatar:", error);
            alert("Failed to update avatar. Please try again.");
        } finally {
            setIsUpdatingAvatar(false);
            e.target.value = '';
        }
    };

    const handleProfileUpdate = async () => {
        try {
            const res = await updateProfile({ username: editUsername, bio: editBio });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile info");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="settings-page container py-5">
            <div className="settings-header mb-5">
                <h1 className="centered-title">App <span className="pink-gradient-text">Settings</span></h1>
                <p className="centered-subtitle text-muted">Manage your profile, security, and preferences.</p>
            </div>

            <div className="settings-layout glass-card">
                {/* Sidebar */}
                <div className="settings-nav">
                    {sections.map(s => (
                        <button 
                            key={s.id} 
                            className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            <span className="nav-icon">{s.icon}</span>
                            <span className="nav-label">{s.label}</span>
                            {activeSection === s.id && <motion.div layoutId="setting-active" className="active-indicator" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="settings-content">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeSection}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="settings-section-wrapper"
                        >
                            {activeSection === 'profile' && (
                                <section className="settings-section">
                                    <h3 className="section-title">Profile Settings</h3>
                                    <div className="profile-edit-header mb-4">
                                        <div className="settings-avatar-wrapper" style={{ opacity: isUpdatingAvatar ? 0.5 : 1 }}>
                                            <Avatar 
                                                pic={user?.profile_pic} 
                                                username={user?.username} 
                                                className="settings-large-avatar" 
                                            />
                                            <label className="avatar-edit-badge" style={{ cursor: 'pointer' }}>
                                                <Camera size={14} />
                                                <input type="file" hidden accept="image/*" onChange={handleAvatarUpdate} disabled={isUpdatingAvatar}/>
                                            </label>
                                        </div>
                                        <div className="profile-quick-info">
                                            <h4>{user?.username}</h4>
                                            <p className="text-muted">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="settings-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Username</label>
                                                <input 
                                                    type="text" 
                                                    value={editUsername} 
                                                    onChange={(e) => setEditUsername(e.target.value)} 
                                                    className="glass-input" 
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Email Address</label>
                                                <input type="email" defaultValue={user?.email} className="glass-input" readOnly />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Bio</label>
                                            <textarea 
                                                className="glass-input" 
                                                placeholder="Tell us about yourself..." 
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <button className="btn btn-primary btn-pill shadow-neon mt-3" onClick={handleProfileUpdate}>
                                            <Save size={18} className="me-2" /> Save Profile
                                        </button>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'account' && (
                                <section className="settings-section">
                                    <h3 className="section-title">Security & Account</h3>
                                    <div className="settings-card-list">
                                        <div className="settings-action-card">
                                            <div className="card-info">
                                                <h5>Change Password</h5>
                                                <p>Update your password to stay secure.</p>
                                            </div>
                                            <div className="form-group mb-0" style={{ maxWidth: '300px' }}>
                                                <input type="password" placeholder="New Password" className="glass-input mb-2" />
                                                <button className="btn btn-dark-outline btn-sm w-100">Update Password</button>
                                            </div>
                                        </div>
                                        <div className="settings-action-card border-danger">
                                            <div className="card-info">
                                                <h5 className="text-danger">Delete Account</h5>
                                                <p>Permanently remove your account and all data.</p>
                                            </div>
                                            <button className="btn btn-danger-outline btn-sm">
                                                <Trash2 size={16} className="me-2" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'privacy' && (
                                <section className="settings-section">
                                    <h3 className="section-title">Privacy Settings</h3>
                                    <div className="settings-toggle-list">
                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h5>Online Status</h5>
                                                <p>Show when you are active in chat.</p>
                                            </div>
                                            <div className={`custom-switch ${privacy.onlineStatus ? 'on' : ''}`} onClick={() => setPrivacy(p => ({...p, onlineStatus: !p.onlineStatus}))}>
                                                <div className="switch-handle" />
                                            </div>
                                        </div>
                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h5>Read Receipts</h5>
                                                <p>Others can see when you read their messages.</p>
                                            </div>
                                            <div className={`custom-switch ${privacy.readReceipts ? 'on' : ''}`} onClick={() => setPrivacy(p => ({...p, readReceipts: !p.readReceipts}))}>
                                                <div className="switch-handle" />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'notifications' && (
                                <section className="settings-section">
                                    <h3 className="section-title">Notifications</h3>
                                    <div className="settings-toggle-list">
                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h5>Direct Messages</h5>
                                                <p>Alerts for new chat messages.</p>
                                            </div>
                                            <div className={`custom-switch ${notifications.messages ? 'on' : ''}`} onClick={() => setNotifications(n => ({...n, messages: !n.messages}))}>
                                                <div className="switch-handle" />
                                            </div>
                                        </div>
                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h5>App Updates</h5>
                                                <p>Get notified about new features.</p>
                                            </div>
                                            <div className={`custom-switch ${notifications.appUpdates ? 'on' : ''}`} onClick={() => setNotifications(n => ({...n, appUpdates: !n.appUpdates}))}>
                                                <div className="switch-handle" />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'appearance' && (
                                <section className="settings-section">
                                    <h3 className="section-title">Theme & Appearance</h3>
                                    <div className="appearance-grid mt-4">
                                        <div className={`theme-card ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                                            <div className="theme-preview light">
                                                <Sun size={24} />
                                            </div>
                                            <span>Light Mode</span>
                                            {theme === 'light' && <Check size={16} className="active-check" />}
                                        </div>
                                        <div className={`theme-card ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                                            <div className="theme-preview dark">
                                                <Moon size={24} />
                                            </div>
                                            <span>Dark Mode</span>
                                            {theme === 'dark' && <Check size={16} className="active-check" />}
                                        </div>
                                        <div className={`theme-card ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}>
                                            <div className="theme-preview system">
                                                <Monitor size={24} />
                                            </div>
                                            <span>System Default</span>
                                            {theme === 'system' && <Check size={16} className="active-check" />}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Settings;
