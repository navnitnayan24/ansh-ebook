import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Music, Book, BookOpen, Mic, Youtube, MessageCircle, Instagram, Facebook, Linkedin, Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
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
                    <NavLink to="/podcasts" className={({isActive}) => isActive ? 'active' : ''}>
                        <Mic size={20} className="sidebar-icon" />
                        <span>PODCAST</span>
                    </NavLink>
                </li>
                {user?.role === 'admin' && (
                    <li>
                        <NavLink to="/admin" className={({isActive}) => isActive ? 'active' : ''}>
                            <Settings size={20} className="sidebar-icon" />
                            <span>DASHBOARD</span>
                        </NavLink>
                    </li>
                )}
            </ul>

            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
