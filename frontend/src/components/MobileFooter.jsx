import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Home, Book, Music, Mic, BookOpen, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MobileFooter.css';

const MobileFooter = () => {
    const navItems = [
        { path: '/', label: 'Home', icon: <Home size={22} /> },
        { path: '/shayari', label: 'Shayari', icon: <Book size={22} /> },
        { path: '/music', label: 'Music', icon: <Music size={22} /> },
        { path: '/podcasts', label: 'Podcast', icon: <Mic size={22} /> },
        { path: '/ebooks', label: 'E-Books', icon: <BookOpen size={22} /> },
    ];

    return (
        <div className="mobile-footer-wrapper">
            <div className="mobile-bottom-pill glass-card">
                <div className="pill-content">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path} end className={({isActive}) => `pill-item ${isActive ? 'active' : ''}`}>
                            <span className="pill-icon">{item.icon}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileFooter;
