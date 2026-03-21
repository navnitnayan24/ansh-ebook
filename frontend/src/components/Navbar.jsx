import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Sun, Moon, Home, Book, Music, Mic, BookOpen, Quote, User, MessageCircle, Youtube, Instagram, Facebook, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ isOpen, setIsOpen }) => {
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);

    const location = useLocation();

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

        return () => window.removeEventListener('scroll', handleScroll);
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsOpen(false);
        window.location.href = '/';
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navItems = [
        { path: '/#hero', label: 'HOME', icon: <Home size={20} /> },
        { path: '/#music-section', label: 'MUSIC', icon: <Music size={20} /> },
        { path: '/#shayari', label: 'SHAYARI', icon: <Book size={20} /> },
        { path: '/#ebook-section', label: 'E-BOOK', icon: <BookOpen size={20} /> },
        { path: '/#podcast-section', label: 'PODCAST', icon: <Mic size={20} /> },
        { path: '/#about', label: 'ABOUT', icon: <User size={20} /> },
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

    return (
        <>
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
                                <Link to="/" className="drawer-home-top" onClick={closeMenu}>
                                    <Home size={22} /> <span>BACK TO HOME</span>
                                </Link>

                                <div className="drawer-branding">
                                    <h3 className="pink-gradient-text">ANSH-EBOOK</h3>
                                    <button className="drawer-close" onClick={closeMenu}><X size={28} /></button>
                                </div>
                                
                                <ul className="drawer-nav">
                                    {navItems.map(item => (
                                        <li key={item.label}>
                                            <a href={item.path} onClick={(e) => handleNavClick(e, item.path)} className="drawer-link">
                                                <span className="drawer-icon">{item.icon}</span>
                                                <span className="drawer-label">{item.label}</span>
                                            </a>
                                        </li>
                                    ))}
                                    {user?.role === 'admin' && (
                                        <li>
                                            <Link to="/admin" onClick={closeMenu} className="drawer-link">
                                                <span className="drawer-icon"><Settings size={20} /></span>
                                                <span className="drawer-label">DASHBOARD</span>
                                            </Link>
                                        </li>
                                    )}
                                </ul>

                                <div className="drawer-footer">
                                    {user ? (
                                        <div className="drawer-user">
                                            <Link to="/profile" className="drawer-auth-btn" onClick={closeMenu}>PROFILE</Link>
                                            <button onClick={handleLogout} className="drawer-auth-btn logout">LOGOUT</button>
                                        </div>
                                    ) : (
                                        <div className="drawer-auth">
                                            <Link to="/login" className="drawer-auth-btn" onClick={closeMenu}>LOGIN</Link>
                                            <Link to="/register" className="drawer-auth-btn signup" onClick={closeMenu}>SIGN UP</Link>
                                        </div>
                                    )}
                                </div>
                                <div className="drawer-socials">
                                    <a href="https://www.instagram.com/_.unknown_shadow?igsh=MXczMmZ2a3N2cGs0Mw==" target="_blank" rel="noopener noreferrer" title="Instagram"><Instagram size={20} /></a>
                                    <a href="https://youtube.com/@vibexmusicx?si=-h93up_MiovLiyS8" target="_blank" rel="noopener noreferrer" title="YouTube"><Youtube size={20} /></a>
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
