import React, { useState, useEffect } from 'react';
import { 
    User, Lock, Shield, Bell, Palette, Camera, 
    ChevronRight, Moon, Sun, Monitor, Check, 
    Mail, Phone, Globe, Trash2, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarUrl } from '../config';
import '../styles/Settings.css';

const Settings = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
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
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const sections = [
        { id: 'profile', label: 'Profile', icon: <User size={20} /> },
        { id: 'account', label: 'Account', icon: <Lock size={20} /> },
        { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    ];

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
                                        <div className="settings-avatar-wrapper">
                                            <img src={getAvatarUrl(user?.profile_pic)} alt="Profile" className="settings-large-avatar" />
                                            <label className="avatar-edit-badge">
                                                <Camera size={14} />
                                                <input type="file" hidden />
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
                                                <input type="text" defaultValue={user?.username} className="glass-input" />
                                            </div>
                                            <div className="form-group">
                                                <label>Email Address</label>
                                                <input type="email" defaultValue={user?.email} className="glass-input" readOnly />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Bio</label>
                                            <textarea className="glass-input" placeholder="Tell us about yourself..." defaultValue="Premium Ansh Ebook User"></textarea>
                                        </div>
                                        <button className="btn btn-primary btn-pill shadow-neon mt-3">
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
