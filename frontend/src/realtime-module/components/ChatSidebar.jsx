import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Send, Users, UserPlus, Link, Plus, Check } from 'lucide-react';
import { createGroupChat, joinGroupByCode } from '../../api';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl, maskEmail } from '../../config';

const ChatSidebar = ({ chats, users, setSelectedChat, selectedChat, searchRef }) => {
    const [search, setSearch] = useState('');
    const [typingStatus, setTypingStatus] = useState({}); // chatId -> isTyping
    const { socket, onlineUsers } = useSocket();
    const [theme, setTheme] = useState(localStorage.getItem('chat-theme') || 'dark');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return alert("Enter group name");
        setLoading(true);
        try {
            const res = await createGroupChat({ 
                name: newGroupName, 
                participants: selectedUsers.map(u => u._id) 
            });
            window.location.reload(); // Refresh to show new group
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!joinCode.trim()) return alert("Enter join code");
        setLoading(true);
        try {
            await joinGroupByCode(joinCode.trim().toUpperCase());
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.error || "Invalid join code");
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (user) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('user-typing', (data) => {
            setTypingStatus(prev => ({
                ...prev,
                [data.chatId]: data.isTyping
            }));
        });

        return () => {
            socket.off('user-typing');
        };
    }, [socket]);

    useEffect(() => {
        document.documentElement.setAttribute('data-chat-theme', theme);
        localStorage.setItem('chat-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // Filter active chats by search
    const filteredChats = chats.filter(chat => {
        if (chat.isGroup) {
            return chat.name?.toLowerCase().includes(search.toLowerCase());
        } else {
            const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
            return otherParticipant?.username?.toLowerCase().includes(search.toLowerCase());
        }
    });

    // Filter users for discovery
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase());
        if (search.length > 0) return matchesSearch;
        // If no search, show only those NOT in active chats to avoid duplication
        return !chats.some(c => !c.isGroup && c.participants.some(p => p._id === user._id));
    });

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <div className="header-top-row">
                    <h3 className="sidebar-title">
                        Messages <span className="badge-premium">REALTIME</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="theme-toggle-btn" title="Create Group" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus size={20}/>
                        </button>
                        <button className="theme-toggle-btn" title="Join Group" onClick={() => setIsJoinModalOpen(true)}>
                            <Link size={20}/>
                        </button>
                        <button className="theme-toggle-btn" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                        </button>
                    </div>
                </div>
                <div className="search-container-modern">
                    <Search size={18} className="search-icon-chat" />
                    <input 
                        ref={searchRef}
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
                    const unreadCount = chat.unreadCount?.[currentUserId] || 0;
                    const isTyping = typingStatus[chat._id];

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
                                        alt={maskEmail(otherParticipant?.username)} 
                                        onError={(e) => { e.target.src = getAvatarUrl(null, otherParticipant?.username); }}
                                    />
                                )}
                                {!chat.isGroup && <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>}
                            </div>
                            <div className="user-info">
                                <div className="user-name-row">
                                    <span className="user-name">
                                        {chat.isGroup ? (chat.name || 'Kohinoor Group') : maskEmail(otherParticipant?.username)}
                                    </span>
                                    {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                                </div>
                                <span className={`last-message-preview ${isTyping ? 'is-typing' : ''}`}>
                                    {isTyping ? 'typing...' : (chat.lastMessage?.text || (chat.isGroup ? 'Group Chat' : 'Start chatting'))}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* User Discovery (only when searching or if no chats) */}
                {(search.length > 0 || filteredUsers.length > 0) && (
                    <>
                        <div className="sidebar-section-title">People you may know</div>
                        {filteredUsers.map((user) => (
                            <div 
                                key={user._id} 
                                className={`user-item discovery ${user._id === currentUserId ? 'is-self' : ''}`}
                                onClick={() => setSelectedChat({ 
                                    _id: `new-${user._id}`, 
                                    participants: [currentUser, user],
                                    isGroup: false 
                                })}
                            >
                                <div className="user-avatar-wrapper">
                                    <img 
                                        src={getAvatarUrl(user.profile_pic, user.username)} 
                                        alt={maskEmail(user.username)} 
                                        onError={(e) => { e.target.src = getAvatarUrl(null, user.username); }}
                                    />
                                    <span className={`status-dot ${onlineUsers[user._id] === 'online' ? 'online' : 'offline'}`}></span>
                                </div>
                                <div className="user-info">
                                    <span className="user-name">
                                        {maskEmail(user.username)} {user._id === currentUserId ? '(You)' : ''}
                                    </span>
                                    <span className="user-status-online">
                                        {user._id === currentUserId ? 'Saved Messages' : 'Available for chat'}
                                    </span>
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

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay-modern" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content-modern" onClick={e => e.stopPropagation()}>
                        <h4>Create New Group</h4>
                        <input 
                            type="text" 
                            className="modern-input" 
                            placeholder="Group Name" 
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                        />
                        <div className="participant-selector-modern">
                            <p>Select Participants</p>
                            <div className="discovery-scroll">
                                {users.map(u => (
                                    <div 
                                        key={u._id} 
                                        className={`participant-chip ${selectedUsers.find(s => s._id === u._id) ? 'active' : ''}`}
                                        onClick={() => toggleUserSelection(u)}
                                    >
                                        <img src={getAvatarUrl(u.profile_pic, u.username)} alt="" />
                                        <span>{maskEmail(u.username)}</span>
                                        {selectedUsers.find(s => s._id === u._id) && <Check size={12} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleCreateGroup} disabled={loading}>
                                {loading ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Group Modal */}
            {isJoinModalOpen && (
                <div className="modal-overlay-modern" onClick={() => setIsJoinModalOpen(false)}>
                    <div className="modal-content-modern" onClick={e => e.stopPropagation()}>
                        <h4>Join Group by Code</h4>
                        <p className="modal-subtitle">Enter the 6-character code shared with you.</p>
                        <input 
                            type="text" 
                            className="modern-input center" 
                            placeholder="CODE123" 
                            maxLength={6}
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setIsJoinModalOpen(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleJoinGroup} disabled={loading}>
                                {loading ? 'Joining...' : 'Join Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSidebar;
