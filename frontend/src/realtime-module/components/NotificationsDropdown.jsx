import React, { useEffect, useState, useRef } from 'react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../api';
import Avatar from '../../components/Avatar';
import { useSocket } from '../context/SocketContext';
import { Heart, MessageCircle, PhoneMissed, MessageSquare, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsDropdown = ({ isOpen, onClose, onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { socket } = useSocket();
    const dropdownRef = useRef();

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetchNotifications();
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadNotifications();
    }, [isOpen]);

    useEffect(() => {
        if (!socket) return;
        socket.on('receive-notification', () => {
            if (isOpen) loadNotifications();
        });
        return () => socket.off('receive-notification');
    }, [socket, isOpen]);

    // Click outside to close map
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleMarkAll = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {}
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await markNotificationRead(notif._id);
                setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (err) {}
        }
        
        // Let parent handle navigation based on sender (to directly chat with them)
        if (onNotificationClick) {
            onNotificationClick(notif.sender);
        }
        onClose();
    };

    const getIcon = (type) => {
        switch(type) {
            case 'like': return <Heart size={14} color="#e91e63" />;
            case 'comment': return <MessageCircle size={14} color="#00bcd4" />;
            case 'reply': return <MessageSquare size={14} color="#9c27b0" />;
            case 'call': return <PhoneMissed size={14} color="#f44336" />;
            case 'message': return <MessageSquare size={14} color="#4caf50" />;
            default: return <Bell size={14} />;
        }
    };

    const getRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diffSec < 60) return 'now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
        return `${Math.floor(diffSec / 86400)}d`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    ref={dropdownRef}
                    className="notifications-dropdown glass-card shadow-neon"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'absolute', top: '100%', right: '10px', marginTop: '10px',
                        width: '320px', maxHeight: '400px', zIndex: 1000, 
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 600 }}>Notifications</h4>
                        <button onClick={handleMarkAll} style={{ background: 'transparent', border: 'none', color: 'var(--c-pink)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Mark Read
                        </button>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }} className="custom-scroll">
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Loading...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div 
                                    key={n._id} 
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        display: 'flex', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: n.isRead ? 'transparent' : 'rgba(233, 30, 99, 0.1)',
                                        borderLeft: n.isRead ? '2px solid transparent' : '2px solid #e91e63',
                                        transition: 'background 0.2s', marginBottom: '4px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(233, 30, 99, 0.1)'}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <Avatar pic={n.sender?.profile_pic} username={n.sender?.username} style={{ width: '38px', height: '38px' }} />
                                        <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#1a1a24', borderRadius: '50%', padding: '2px' }}>
                                            {getIcon(n.type)}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: '0.85rem', color: '#fff' }}>
                                                {n.sender?.username.split('@')[0]}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{getRelativeTime(n.createdAt)}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: n.isRead ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {n.content}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                No new notifications
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationsDropdown;
