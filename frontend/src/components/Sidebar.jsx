import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Music, Book, BookOpen, Library, Youtube, MessageCircle, Instagram, Facebook, Linkedin, Sun, Moon, Settings, User, LogOut, Newspaper } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AdSpace from './AdSpace';
import '../styles/Sidebar.css';

const Sidebar = () => {
    const { theme, toggleTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return (
        <aside className="sidebar-desktop glass-drawer">
            <div className="sidebar-top-actions">
                <button 
                    className="sidebar-theme-toggle" 
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <ul className="sidebar-nav">
                <li>
                    <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
                        <Home size={20} className="sidebar-icon" />
                        <span>HOME</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/music" className={({isActive}) => isActive ? 'active' : ''}>
                        <Music size={20} className="sidebar-icon" />
                        <span>MUSIC</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/shayari" className={({isActive}) => isActive ? 'active' : ''}>
                        <Book size={20} className="sidebar-icon" />
                        <span>SHAYARI</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/ebooks" className={({isActive}) => isActive ? 'active' : ''}>
                        <BookOpen size={20} className="sidebar-icon" />
                        <span>E-BOOK</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/news" className={({isActive}) => isActive ? 'active' : ''}>
                        <Newspaper size={20} className="sidebar-icon" />
                        <span>NEWS</span>
                    </NavLink>
                </li>
                {user && (
                    <li>
                        <NavLink to="/chat" className={({isActive}) => isActive ? 'active' : ''}>
                            <MessageCircle size={20} className="sidebar-icon" />
                            <span>CHAT</span>
                        </NavLink>
                    </li>
                )}
                {user?.role === 'admin' && (
                    <li>
                        <NavLink to="/admin" className={({isActive}) => isActive ? 'active' : ''}>
                            <Settings size={20} className="sidebar-icon" />
                            <span>DASHBOARD</span>
                        </NavLink>
                    </li>
                )}
                {user ? (
                    <>
                        <li>
                            <NavLink to="/profile" className={({isActive}) => isActive ? 'active' : ''}>
                                <User size={20} className="sidebar-icon" />
                                <span>PROFILE</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/settings" className={({isActive}) => isActive ? 'active' : ''}>
                                <Settings size={20} className="sidebar-icon" />
                                <span>SETTINGS</span>
                            </NavLink>
                        </li>
                        <li>
                            <button 
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    window.location.href = '/';
                                }} 
                                className="sidebar-link-btn"
                            >
                                <LogOut size={20} className="sidebar-icon" />
                                <span>LOGOUT</span>
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <NavLink to="/login" className={({isActive}) => isActive ? 'active' : ''}>
                                <User size={20} className="sidebar-icon" />
                                <span>LOGIN</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/register" className={({isActive}) => isActive ? 'active' : ''}>
                                <User size={20} className="sidebar-icon" />
                                <span>SIGN UP</span>
                            </NavLink>
                        </li>
                    </>
                )}
            </ul>

            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Native Bar Sidebar Slot */}
                <div style={{ marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
                    <AdSpace type="horizontal" id="sidebar-bottom-ad" />
                </div>
                
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>CONNECT</p>

                <div className="sidebar-socials" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <a href="https://whatsapp.com/channel/0029VaFlezo3QxSA5zNTQF0b" target="_blank" rel="noopener noreferrer" className="sidebar-social-icon" title="WhatsApp"><MessageCircle size={18} /></a>
                    <a href="https://youtube.com/@vibexmusicx" target="_blank" rel="noopener noreferrer" className="sidebar-social-icon" title="YouTube"><Youtube size={18} /></a>
                    <a href="https://www.instagram.com/_.unknown_shadow" target="_blank" rel="noopener noreferrer" className="sidebar-social-icon" title="Instagram (Main)"><Instagram size={18} /></a>
                    <a href="https://www.instagram.com/gumnaam_shayar__24" target="_blank" rel="noopener noreferrer" className="sidebar-social-icon" title="Instagram (Poetry)"><Instagram size={18} /></a>
                    <a href="https://www.facebook.com/share/1PNsduGWcq/" target="_blank" rel="noopener noreferrer" className="sidebar-social-icon" title="Facebook"><Facebook size={18} /></a>
                    <a href="https://www.linkedin.com/in/navnit-nayan-14b4b9278" target="_blank" rel="noopener noreferrer" className="sidebar-social-icon" title="LinkedIn"><Linkedin size={18} /></a>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
