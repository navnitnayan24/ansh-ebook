import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Send } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../../config';

const ChatSidebar = ({ users, setSelectedChat, selectedChat }) => {
    const [search, setSearch] = useState('');
    const { onlineUsers } = useSocket();
    const [theme, setTheme] = useState(localStorage.getItem('chat-theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-chat-theme', theme);
        localStorage.setItem('chat-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const filteredUsers = users.filter(user => 
        user.username?.toLowerCase().includes(search.toLowerCase()) || 
        user._id?.toLowerCase().includes(search.toLowerCase())
    );

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };

    const displayUsers = search.length > 0 
        ? filteredUsers 
        : users.filter(user => onlineUsers[user._id] === 'online');

    return (
        <div className="chat-sidebar glass-card">
            <div className="sidebar-header">
                <div className="flex-between align-center mb-15">
                    <h3>Messages</h3>
                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                </div>
                <div className="search-bar-chat">
                    <Search size={18} className="search-icon-chat" />
                    <input 
                        type="text" 
                        placeholder="Discovery: Search name or ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="user-list">
                {displayUsers.length > 0 ? (
                    displayUsers.map((user) => (
                        <div 
                            key={user._id} 
                            className={`user-item ${selectedChat?.participants?.[1]?._id === user._id ? 'active' : ''}`}
                            onClick={() => setSelectedChat({ 
                                _id: `new-${user._id}`, 
                                participants: [{}, user] 
                            })}
                        >
                            <div className="user-avatar-wrapper">
                                <img 
                                    src={getAvatarUrl(user.profile_pic, user.username)} 
                                    alt={user.username} 
                                    onError={(e) => { e.target.src = getAvatarUrl(null, user.username); }}
                                />
                                <span className={`status-dot ${onlineUsers[user._id] === 'online' ? 'online' : 'offline'}`}></span>
                            </div>
                            <div className="user-info">
                                <span className="user-name">{formatUsername(user.username)}</span>
                                {onlineUsers[user._id] === 'online' ? (
                                    <span className="user-status-online">Active Now</span>
                                ) : (
                                    <span className="user-status-offline" style={{fontSize: '0.6rem'}}>Seen recently</span>
                                )}
                            </div>
                            <div className="quick-action-icon">
                                <Send size={16} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-users-found muted-text">
                        {search.length > 0 ? "No users found" : "No users online. Use search to find someone!"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
