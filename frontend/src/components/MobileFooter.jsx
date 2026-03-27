import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Home, Book, Music, Mic, BookOpen, User, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MobileFooter.css';

const MobileFooter = () => {
    const navItems = [
        { path: '/', label: 'Home', icon: <Home size={18} /> },
        { path: '/chat', label: 'Chat', icon: <MessageCircle size={18} /> },
        { path: '/music', label: 'Music', icon: <Music size={18} /> },
        { path: '/podcasts', label: 'Cast', icon: <Mic size={18} /> },
        { path: '/ebooks', label: 'Book', icon: <BookOpen size={18} /> },
        { path: '/settings', label: 'Set', icon: <Settings size={18} /> },
    ];

    return (
        <div className="mobile-footer-wrapper">
            <div className="mobile-bottom-pill glass-card">
                <div className="pill-content">
                    {navItems.map(item => (
                        <NavLink 
                            key={item.label} 
                            to={item.path} 
                            end={item.path === '/'}
                            className={({isActive}) => `pill-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="pill-icon">{item.icon}</span>
                            <span className="pill-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileFooter;
