import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/BrandHeader.css';

import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BrandHeader = ({ isMobile, toggleMenu, isOpen }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header 
            className="brand-header-wrapper glass-card"
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 9999,
                width: '100%',
                overflow: 'visible'
            }}
        >
            <div className="brand-header-container">
                <button 
                    className="header-theme-toggle" 
                    onClick={toggleTheme}
                    aria-label="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                </button>

                <Link to="/" className="brand-link">
                    <motion.div 
                        className="brand-content-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="brand-name-main center-text">ANSH EBOOK</h1>
                        <div className="brand-subtitle-line">
                            <span className="line"></span>
                            <span className="subtitle-text">PREMIUM CREATIVE HUB</span>
                            <span className="line"></span>
                        </div>
                    </motion.div>
                </Link>
                
                {isMobile && (
                    <button className="header-mobile-toggle" onClick={toggleMenu}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>
        </header>
    );
};

export default BrandHeader;
