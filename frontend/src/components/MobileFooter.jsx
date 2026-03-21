import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Home, Book, Music, Mic, BookOpen, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MobileFooter.css';

const MobileFooter = () => {
    const navItems = [
        { path: '/#hero', label: 'Home', icon: <Home size={22} /> },
        { path: '/#shayari', label: 'Shayari', icon: <Book size={22} /> },
        { path: '/#music-section', label: 'Music', icon: <Music size={22} /> },
        { path: '/#podcast-section', label: 'Podcast', icon: <Mic size={22} /> },
        { path: '/#ebook-section', label: 'E-Books', icon: <BookOpen size={22} /> },
    ];

    const [activeHash, setActiveHash] = useState(window.location.hash || '#hero');

    React.useEffect(() => {
        const handleHashChange = () => setActiveHash(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleNavClick = (e, path) => {
        if (path.startsWith('/#')) {
            const id = path.substring(2);
            const element = document.getElementById(id);
            if (element) {
                e.preventDefault();
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, null, path);
                setActiveHash('#' + id);
            }
        }
    };

    return (
        <div className="mobile-footer-wrapper">
            <div className="mobile-bottom-pill glass-card">
                <div className="pill-content">
                    {navItems.map(item => (
                        <a 
                            key={item.label} 
                            href={item.path} 
                            onClick={(e) => handleNavClick(e, item.path)} 
                            className={`pill-item ${activeHash === item.path.substring(1) ? 'active' : ''}`}
                        >
                            <span className="pill-icon">{item.icon}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileFooter;
