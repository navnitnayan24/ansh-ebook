import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Home, Book, Music, Mic, BookOpen, User, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/MobileFooter.css';

const MobileFooter = () => {
    const navItems = [
        { path: '/', label: 'Home', icon: <Home size={20} /> },
        { path: '/chat', label: 'Chats', icon: <MessageCircle size={20} /> },
        { path: '/music', label: 'Music', icon: <Music size={20} /> },
        { path: '/podcasts', label: 'Cast', icon: <Mic size={20} /> },
        { path: '/ebooks', label: 'Books', icon: <BookOpen size={20} /> },
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
