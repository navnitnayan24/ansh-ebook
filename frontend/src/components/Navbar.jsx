import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Sun, Moon, Home, Book, Music, Mic, BookOpen, Quote, User, MessageCircle, Youtube, Instagram, Facebook, Linkedin, DownloadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { MEDIA_URL, getAvatarUrl, maskEmail } from '../config';
import AdSpace from './AdSpace';
import Avatar from './Avatar';
import '../styles/Navbar.css';

const Navbar = ({ isOpen, setIsOpen, closeMenu }) => {
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallModal, setShowInstallModal] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        
        const syncUser = () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser && savedUser !== 'undefined') {
                try {
                    setUser(JSON.parse(savedUser));
                } catch (err) {
                    console.error("User state sync error:", err);
                }
            } else {
                setUser(null);
            }
        };

        syncUser();

        // PWA Install Prompt Handling
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, [location]);

    const handleInstallClick = async () => {
        // If already in standalone mode (installed), go to dashboard
        if (window.matchMedia('(display-mode: standalone)').matches) {
            closeMenu();
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User installed the app');
            }
            setDeferredPrompt(null);
            closeMenu();
        } else {
            // Show premium custom modal instead of alert
            setShowInstallModal(true);
            closeMenu();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsOpen(false);
        window.location.href = '/';
    };

    const navItems = [
        { path: '/', label: 'HOME', icon: <Home size={20} /> },
        { path: '/music', label: 'MUSIC', icon: <Music size={20} /> },
        { path: '/shayari', label: 'SHAYARI', icon: <Book size={20} /> },
        { path: '/ebooks', label: 'E-BOOK', icon: <BookOpen size={20} /> },
        { path: '/news', label: 'NEWS', icon: <Newspaper size={20} /> },
        { path: '/chat', label: 'CHAT', icon: <MessageCircle size={20} /> },
        { path: '/#about', label: 'ABOUT', icon: <User size={20} /> },
        { path: '/settings', label: 'SETTINGS', icon: <Settings size={20} /> },
    ];

    const handleNavClick = (e, path) => {
        if (path.startsWith('/#')) {
            const id = path.substring(2);
            const element = document.getElementById(id);
            if (element) {
                e.preventDefault();
                element.scrollIntoView({ behavior: 'smooth' });
                closeMenu();
                window.history.pushState(null, null, path);
            }
        } else {
            closeMenu();
        }
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    return (
        <>
            <AnimatePresence>
                {showInstallModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="install-modal-overlay"
                        onClick={() => setShowInstallModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="install-modal-card glass-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="install-modal-header">
                                <img src="/logo-ansh.png" alt="Ansh" className="modal-app-icon" />
                                <div>
                                    <h3>Install Ansh Ebook</h3>
                                    <p>Get the full premium experience</p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setShowInstallModal(false)}><X size={20} /></button>
                            </div>
                            
                            <div className="install-modal-body">
                                {isIOS ? (
                                    <div className="install-steps">
                                        <div className="step-item">
                                            <span className="step-num">1</span>
                                            <p>Tap the <strong>Share</strong> button in Safari.</p>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">2</span>
                                            <p>Scroll down and tap <strong>'Add to Home Screen'</strong>.</p>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">3</span>
                                            <p>Tap <strong>'Add'</strong> to confirm.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="install-steps">
                                        <div className="step-item">
                                            <span className="step-num">1</span>
                                            <p>Tap the <strong>3 dots (Menu)</strong> in your browser.</p>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">2</span>
                                            <p>Look for <strong>'Install App'</strong> or <strong>'Add to Home Screen'</strong>.</p>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">3</span>
                                            <p>Confirm the installation to enjoy Ansh Ebook.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button className="btn-modal-primary" onClick={() => setShowInstallModal(false)}>GOT IT!</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            key="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMenu}
                            className="drawer-backdrop"
                        />

                        <motion.div 
                            key="navigation-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="mobile-side-drawer glass-drawer"
                        >
                            <div className="drawer-inner">
                                <div className="drawer-branding">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <img src="/logo-ansh.png" alt="Logo" className="drawer-logo" />
                                        <h3 className="pink-gradient-text">ANSH EBOOK</h3>
                                    </div>
                                    <button className="drawer-close" onClick={closeMenu}><X size={28} /></button>
                                </div>

                                <Link to="/" className="drawer-home-top" onClick={closeMenu} style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                                    <Home size={22} /> <span>BACK TO HOME</span>
                                </Link>

                                <ul className="drawer-nav">
                                    {user ? (
                                        <>
                                            <li>
                                                <Link to="/profile" onClick={closeMenu} className="drawer-link profile-link-highlight">
                                                    <span className="drawer-icon">
                                                        <Avatar 
                                                            pic={user.profile_pic} 
                                                            username={user.username} 
                                                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
                                                        />
                                                    </span>
                                                    <span className="drawer-label">MY PROFILE</span>
                                                </Link>
                                            </li>
                                            {user.role === 'admin' && (
                                                <li>
                                                    <Link to="/admin" onClick={closeMenu} className="drawer-link admin-link-highlight">
                                                        <span className="drawer-icon"><Settings size={20} /></span>
                                                        <span className="drawer-label">ADMIN PANEL</span>
                                                    </Link>
                                                </li>
                                            )}
                                            <li>
                                                <Link to="/music" onClick={closeMenu} className="drawer-link">
                                                    <span className="drawer-icon"><Music size={20} /></span>
                                                    <span className="drawer-label">MY PLAYLISTS</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <button onClick={handleLogout} className="drawer-link-btn logout-highlight w-100">
                                                    <span className="drawer-icon"><LogOut size={20} /></span>
                                                    <span className="drawer-label">LOGOUT</span>
                                                </button>
                                            </li>
                                            <hr className="drawer-divider" />
                                        </>
                                    ) : (
                                        <>
                                            <li>
                                                <Link to="/login" onClick={closeMenu} className="drawer-link auth-link-highlight">
                                                    <span className="drawer-icon"><User size={20} /></span>
                                                    <span className="drawer-label">LOGIN</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/register" onClick={closeMenu} className="drawer-link auth-link-highlight">
                                                    <span className="drawer-icon"><User size={20} /></span>
                                                    <span className="drawer-label">CREATE ACCOUNT</span>
                                                </Link>
                                            </li>
                                            <hr className="drawer-divider" />
                                        </>
                                    )}

                                    {navItems.map(item => (
                                        <li key={item.label}>
                                            {item.path.startsWith('/#') ? (
                                                <a href={item.path} onClick={(e) => handleNavClick(e, item.path)} className="drawer-link">
                                                    <span className="drawer-icon">{item.icon}</span>
                                                    <span className="drawer-label">{item.label}</span>
                                                </a>
                                            ) : (
                                                <Link to={item.path} onClick={closeMenu} className="drawer-link">
                                                    <span className="drawer-icon">{item.icon}</span>
                                                    <span className="drawer-label">{item.label}</span>
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                    <div className="drawer-get-app-wrapper">
                                        <button onClick={handleInstallClick} className="drawer-get-app-btn shadow-neon">
                                            <DownloadCloud size={20} />
                                            <span>{window.matchMedia('(display-mode: standalone)').matches ? 'OPEN APP' : 'GET ANSH APP'}</span>
                                        </button>
                                    </div>

                                    {/* Native Bar Drawer Slot */}
                                    <div style={{ marginTop: '2rem', padding: '0 1rem', width: '100%', opacity: 0.8 }}>
                                        <AdSpace type="horizontal" id="nav-drawer-ad" />
                                    </div>
                                </ul>

                                <div className="drawer-socials">

                                    <a href="https://www.instagram.com/_.unknown_shadow?igsh=MXczMmZ2a3N2cGs0Mw==" target="_blank" rel="noopener noreferrer" title="Instagram"><Instagram size={20} /></a>
                                    <a href="https://youtube.com/@vibexmusicx?si=-h93up_MiovLiyS8" target="_blank" rel="noopener noreferrer" title="VIBEX MUSICX"><Youtube size={20} /></a>
                                    <a href="https://whatsapp.com/channel/0029VaFlezo3QxSA5zNTQF0b" target="_blank" rel="noopener noreferrer" title="WhatsApp"><MessageCircle size={20} /></a>
                                    <a href="https://www.linkedin.com/in/navnit-nayan-14b4b9278?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" title="LinkedIn"><Linkedin size={20} /></a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
