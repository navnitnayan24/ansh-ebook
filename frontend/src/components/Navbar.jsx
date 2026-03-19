import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Sun, Moon, Home, Book, Music, Mic, BookOpen, Quote, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ isOpen, setIsOpen }) => {
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        
        const savedUser = localStorage.getItem('user');
        if (savedUser && savedUser !== 'undefined') {
            try {
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error("User state corruption fixed:", err);
                localStorage.removeItem('user');
            }
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        { path: '/', label: 'HOME', icon: <Home size={20} /> },
        { path: '/music', label: 'MUSIC', icon: <Music size={20} /> },
        { path: '/shayari', label: 'SHAYARI', icon: <Book size={20} /> },
        { path: '/ebooks', label: 'E-BOOK', icon: <BookOpen size={20} /> },
        { path: '/podcasts', label: 'PODCAST', icon: <Mic size={20} /> },
    ];

    return (
        <>
            {/* The top bar is now handled by BrandHeader.jsx */}

            {/* Sub Navbar removed in favor of strict Sidebar layout */}

            {/* Mobile Bottom Navigation - (Managed in MobileFooter.jsx) */}

            {/* Mobile Side Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Semi-transparent Black Backdrop */}
                        <motion.div 
                            key="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMenu}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.7)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 2999
                            }}
                        />

                        <motion.div 
                            key="navigation-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="mobile-side-drawer glass-drawer"
                            style={{ 
                                position: 'fixed', 
                                top: 0, 
                                right: 0, 
                                width: '300px', 
                                height: '100vh', 
                                zIndex: 3000, 
                                overflowY: 'auto' 
                            }}
                        >
                            <div className="drawer-inner">
                                <Link to="/" className="drawer-home-top" onClick={closeMenu}>
                                    <Home size={22} /> <span>BACK TO HOME</span>
                                </Link>

                                <div className="drawer-branding">
                                    <h3 className="pink-gradient-text" style={{ letterSpacing: '2px' }}>ANSH SHARMA</h3>
                                    <div className="drawer-actions-top">
                                        <button className="drawer-close" onClick={closeMenu} aria-label="Close Menu"><X size={28} /></button>
                                    </div>
                                </div>
                                
                                <ul className="drawer-nav">
                                    {navItems.map(item => (
                                        <li key={item.path}>
                                            <NavLink to={item.path} end onClick={closeMenu} className={({isActive}) => isActive ? 'active' : ''}>
                                                <span className="drawer-icon">{item.icon}</span>
                                                <span className="drawer-label">{item.label}</span>
                                            </NavLink>
                                        </li>
                                    ))}
                                    {user?.role === 'admin' && (
                                        <li>
                                            <NavLink to="/admin" onClick={closeMenu} className={({isActive}) => isActive ? 'active' : ''}>
                                                <span className="drawer-icon"><Settings size={20} /></span>
                                                <span className="drawer-label">DASHBOARD</span>
                                            </NavLink>
                                        </li>
                                    )}
                                </ul>

                                <div className="drawer-footer">
                                    {user ? (
                                        <div className="drawer-user">
                                            <Link to="/profile" className="drawer-auth-btn" onClick={closeMenu}>MY ACCOUNT</Link>
                                            <button onClick={handleLogout} className="drawer-auth-btn logout">LOGOUT</button>
                                        </div>
                                    ) : (
                                        <div className="drawer-auth">
                                            <Link to="/login" className="drawer-auth-btn" onClick={closeMenu}>LOGIN</Link>
                                            <Link to="/register" className="drawer-auth-btn signup" onClick={closeMenu}>SIGN UP NOW</Link>
                                        </div>
                                    )}
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
