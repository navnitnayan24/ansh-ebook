import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, LogOut, ArrowRight, Heart, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
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

    if (!user) return <div className="loader">Loading Profile...</div>;

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <motion.div 
            className="profile-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="profile-header-card glass-card">
                <div className="profile-hero-area">
                    <div className="profile-avatar-wrapper">
                        <div className="avatar-glow"></div>
                        <User size={60} className="avatar-icon" />
                    </div>
                    <div className="profile-main-info">
                        <h1 className="username-display">{user?.username} <span className="role-badge">{user?.role}</span></h1>
                        <p className="email-display"><Mail size={16} /> {user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="btn-logout-floating">
                        <LogOut size={18} /> Exit
                    </button>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-stats glass-card shadow-neon">
                    <h3>Account <span className="pink-text">Overview</span></h3>
                    <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                        <div className="stat-item">
                            <Shield className="pink-text" />
                            <div>
                                <span className="stat-label">Member Since</span>
                                <span className="stat-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'March 2026'}</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <Calendar className="pink-text" />
                            <div>
                                <span className="stat-label">Last Login</span>
                                <span className="stat-value">Today</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <Heart className="pink-text" />
                            <div>
                                <span className="stat-label">Favorites</span>
                                <span className="stat-value">12+ Items</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-actions glass-card">
                    <h3>Quick <span className="text-gradient">Links</span></h3>
                    <div className="action-links">
                        <Link to="/shayari" className="action-card">
                            <Heart size={20} />
                            <span>Saved Shayari</span>
                            <ArrowRight size={16} className="arrow" />
                        </Link>
                        <Link to="/ebooks" className="action-card">
                            <BookOpen size={20} />
                            <span>My Library</span>
                            <ArrowRight size={16} className="arrow" />
                        </Link>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="action-card admin-highlight">
                                <Shield size={20} />
                                <span>Admin Dashboard</span>
                                <ArrowRight size={16} className="arrow" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
