import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Send, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../../config';

const ChatSidebar = ({ chats, users, setSelectedChat, selectedChat }) => {
    const [search, setSearch] = useState('');
    const { onlineUsers } = useSocket();
    const [theme, setTheme] = useState(localStorage.getItem('chat-theme') || 'dark');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;

    useEffect(() => {
        document.documentElement.setAttribute('data-chat-theme', theme);
        localStorage.setItem('chat-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };

    // Filter active chats by search
    const filteredChats = chats.filter(chat => {
        if (chat.isGroup) {
            return chat.name?.toLowerCase().includes(search.toLowerCase());
        } else {
            const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
            return otherParticipant?.username?.toLowerCase().includes(search.toLowerCase());
        }
    });

    // Filter users for discovery (only show if not already in a chat)
    const filteredUsers = users.filter(user => 
        user.username?.toLowerCase().includes(search.toLowerCase()) &&
        !chats.some(c => !c.isGroup && c.participants.some(p => p._id === user._id))
    );

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <div className="flex-between align-center mb-15">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Messages <span className="badge-premium">REALTIME</span>
                    </h3>
                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                </div>
                <div className="search-bar-chat">
                    <Search size={18} className="search-icon-chat" />
                    <input 
                        type="text" 
                        placeholder="Search chats or find people..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="user-list">
                {/* Active Chats */}
                {filteredChats.map((chat) => {
                    const otherParticipant = !chat.isGroup ? chat.participants.find(p => p._id !== currentUserId) : null;
                    const isSelected = selectedChat?._id === chat._id;
                    const isOnline = !chat.isGroup && onlineUsers[otherParticipant?._id] === 'online';

                    return (
                        <div 
                            key={chat._id} 
                            className={`user-item ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="user-avatar-wrapper">
                                {chat.isGroup ? (
                                    <div className="group-avatar-main" style={{ width: '44px', height: '44px', fontSize: '18px' }}>💎</div>
                                ) : (
                                    <img 
                                        src={getAvatarUrl(otherParticipant?.profile_pic, otherParticipant?.username)} 
                                        alt="avatar" 
                                        onError={(e) => { e.target.src = getAvatarUrl(null, otherParticipant?.username); }}
                                    />
                                )}
                                {!chat.isGroup && <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>}
                            </div>
                            <div className="user-info">
                                <span className="user-name">
                                    {chat.isGroup ? (chat.name || 'Kohinoor Group') : formatUsername(otherParticipant?.username)}
                                </span>
                                <span className="last-message-preview">
                                    {chat.lastMessage?.text || (chat.isGroup ? 'Group Chat' : 'Start chatting')}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* User Discovery (only when searching or if no chats) */}
                {search.length > 0 && filteredUsers.length > 0 && (
                    <>
                        <div className="sidebar-section-title">People you may know</div>
                        {filteredUsers.map((user) => (
                            <div 
                                key={user._id} 
                                className="user-item discovery"
                                onClick={() => setSelectedChat({ 
                                    _id: `new-${user._id}`, 
                                    participants: [currentUser, user],
                                    isGroup: false 
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
                                    <span className="user-status-online">Available for chat</span>
                                </div>
                                <div className="quick-action-icon">
                                    <Send size={16} />
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {filteredChats.length === 0 && filteredUsers.length === 0 && (
                    <div className="no-chats-found">
                        <Users size={40} opacity={0.2} />
                        <p>No messages yet. Find someone to start talking!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
