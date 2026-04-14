import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Send, Users, UserPlus, Link, Plus, Check, Bell, BellOff } from 'lucide-react';
import { createGroupChat, joinGroupByCode, acceptInvite, rejectInvite, followUser, getFollowing, findOrCreateChat } from '../../api';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl, maskEmail } from '../../config';
import Avatar from '../../components/Avatar';

// Utility for clean display names (no email domains)
const getCleanName = (name) => {
    if (!name || typeof name !== 'string') return 'User';
    return name.split('@')[0];
};
import AdSpace from '../../components/AdSpace';
import StoriesBar from '../../components/StoriesBar';
import NotificationsDropdown from './NotificationsDropdown';

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
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
    const [following, setFollowing] = useState([]);

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

    const copyShareLink = () => {
        const shareUrl = `${window.location.origin}/chat?dm=${currentUserId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Chat Link Copied! Share it with friends.");
        }).catch(err => {
            console.error("Copy failed:", err);
        });
    };

    const toggleNotifications = async () => {
        if (Notification.permission === 'default' || Notification.permission === 'denied') {
            const permission = await Notification.requestPermission();
            setNotificationsEnabled(permission === 'granted');
        } else {
            // Browser doesn't allow 'programmatic' revoking, we just toggle local state for UI feedback
            setNotificationsEnabled(!notificationsEnabled);
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

        // Auto-DM handling: if ?dm=userId is in URL
        const params = new URLSearchParams(window.location.search);
        const dmUserId = params.get('dm');
        if (dmUserId && users.length > 0) {
            const targetUser = users.find(u => u._id === dmUserId);
            if (targetUser) {
                setSelectedChat({ 
                    _id: `new-${dmUserId}`, 
                    participants: [currentUser, targetUser],
                    isGroup: false 
                });
                // Remove param from URL without reload
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        socket.on('user-typing', (data) => {
            setTypingStatus(prev => ({
                ...prev,
                [data.chatId]: data.isTyping
            }));
        });

        const fetchFollowingList = async () => {
            try {
                const res = await getFollowing();
                setFollowing(res.data.map(u => u._id));
            } catch (err) {
                console.error("Error fetching following:", err);
            }
        };
        fetchFollowingList();

        return () => {
            socket.off('user-typing');
        };
    }, [socket]);

    useEffect(() => {
        document.documentElement.setAttribute('data-chat-theme', theme);
        localStorage.setItem('chat-theme', theme);
    }, [theme]);

    // SMART BACK NAVIGATION: Support mobile back button to close chat
    useEffect(() => {
        const handleHashChange = () => {
            if (!window.location.hash.includes('chat') && selectedChat) {
                setSelectedChat(null);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [selectedChat, setSelectedChat]);

    const selectChatWithHash = (chat) => {
        setSelectedChat(chat);
        // On mobile, add hash for back support
        if (window.innerWidth <= 768) {
            window.location.hash = 'chat';
        }
    };

    const handleStartChatFromSearch = async (user) => {
        try {
            const res = await findOrCreateChat(user._id);
            selectChatWithHash(res.data);
            // Optionally reload sidebar list to include the new chat dynamically
            window.location.reload(); 
        } catch (err) {
            console.error("Failed to initialize chat:", err);
            alert("Failed to start chat. Check connection.");
        }
    };

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // Filter pending invites
    const pendingInvites = (chats || []).filter(chat => 
        chat?.pendingParticipants?.some(p => p._id === currentUserId)
    );

    const handleFollow = async (user) => {
        try {
            await followUser(user._id);
            setFollowing(prev => [...prev, user._id]);
            // Automatically initialize a chat with the newly followed user
            await findOrCreateChat(user._id);
            // Refresh to update the Sidebar list
            window.location.reload();
        } catch (err) {
            alert("Connection failed");
        }
    };

    // Filter active chats by search
    const activeChats = (chats || []).filter(chat => 
        chat?.participants?.some(p => p._id === currentUserId)
    );

    const filteredChats = activeChats.filter(chat => {
        if (!chat) return false;
        const searchTerm = (search || '').toLowerCase();
        if (chat.isGroup) {
            return chat.name?.toLowerCase().includes(searchTerm);
        } else {
            // Support self-chats: other participant is the same user
            const otherParticipant = chat.participants?.find(p => p._id !== currentUserId) || chat.participants?.[0];
            return otherParticipant?.username?.toLowerCase().includes(searchTerm);
        }
    });

    // Filter users for discovery
    const filteredUsers = (users || []).filter(user => {
        if (!user || !user._id || user._id === currentUserId) return false;
        const searchTerm = (search || '').toLowerCase();
        const username = user.username?.toLowerCase() || '';
        
        // PRIVACY: Only show results if searching
        if (search.length > 0) {
            return username.includes(searchTerm);
        }
        return false;
    });

    // Separate "Recent" into Groups and Messages
    const recentChats = filteredChats;
    const groupConversations = recentChats.filter(c => c.isGroup);
    // Sort DMs by latest message time (newest first), like Instagram Primary
    const directConversations = recentChats
        .filter(c => !c.isGroup)
        .sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.updatedAt || a.createdAt || '';
            const timeB = b.lastMessage?.createdAt || b.updatedAt || b.createdAt || '';
            return new Date(timeB) - new Date(timeA);
        });

    // Helper: relative time like Instagram ("now", "2m", "1h", "3d", "2w")
    const getRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const diffWeek = Math.floor(diffDay / 7);

        if (diffSec < 60) return 'now';
        if (diffMin < 60) return `${diffMin}m`;
        if (diffHr < 24) return `${diffHr}h`;
        if (diffDay < 7) return `${diffDay}d`;
        if (diffWeek < 52) return `${diffWeek}w`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-identity-section">
                    <div className="identity-user-info">
                        <Avatar pic={currentUser.profile_pic} username={currentUser.username} className="identity-avatar-img" />
                        <div className="identity-text">
                            <span className="identity-name">{getCleanName(currentUser.username)}</span>
                            <span className="identity-label">My ID</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn-share-id" onClick={copyShareLink} title="Copy My Chat Link">
                            <Link size={14} />
                            <span>Share</span>
                        </button>
                        <button className="theme-toggle-btn icon-only" title="Create Group" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus size={18}/>
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button className="theme-toggle-btn icon-only" title="Notifications" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                                <Bell size={18} className={isNotificationsOpen ? "text-pink" : ""} />
                            </button>
                            <NotificationsDropdown 
                                isOpen={isNotificationsOpen} 
                                onClose={() => setIsNotificationsOpen(false)} 
                                onNotificationClick={handleStartChatFromSearch}
                            />
                        </div>
                        <button className="theme-toggle-btn icon-only" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
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
            
            {/* STORIES SECTION */}
            <StoriesBar />

            <div className="user-list">
                {/* Pending Invitations — Instagram "Requests" style */}
                {pendingInvites.length > 0 && (
                    <div className="sidebar-section-invites">
                        <div className="sidebar-section-title">Requests ({pendingInvites.length})</div>
                        {pendingInvites.map((chat) => (
                            <div key={chat._id} className="user-item invite-item">
                                <div className="user-avatar-wrapper">
                                    <div className="group-avatar-main invite" style={{ width: '40px', height: '40px', fontSize: '14px' }}>📩</div>
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{chat.name}</span>
                                    <div className="invite-actions">
                                        <button className="btn-accept" onClick={() => acceptInvite(chat._id).then(() => window.location.reload())}>Accept</button>
                                        <button className="btn-reject" onClick={() => rejectInvite(chat._id).then(() => window.location.reload())}>Decline</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── GROUPS Section (Instagram-style compact) ── */}
                {groupConversations.length > 0 && (
                    <>
                        <div className="sidebar-section-title">Groups</div>
                        {groupConversations.map((chat) => {
                            const isSelected = selectedChat?._id === chat._id;
                            const unreadCount = chat.unreadCount?.[currentUserId] || 0;
                            const isTyping = typingStatus[chat._id];
                            const lastTime = getRelativeTime(chat.lastMessage?.createdAt || chat.updatedAt);

                            return (
                                <div 
                                    key={chat._id} 
                                    className={`user-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => selectChatWithHash(chat)}
                                >
                                    <div className="user-avatar-wrapper">
                                        <div className="group-avatar-main" style={{ width: '44px', height: '44px', fontSize: '18px' }}>💎</div>
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name-row">
                                            <span className="user-name">{chat.name || 'Kohinoor Group'}</span>
                                            <span className="chat-time-stamp">{lastTime}</span>
                                        </div>
                                        <div className="user-name-row">
                                            <span className={`last-message-preview ${isTyping ? 'is-typing' : ''}`}>
                                                {isTyping ? 'typing...' : (chat.lastMessage?.text || 'Group Chat')}
                                            </span>
                                            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* ── MESSAGES Section (Instagram Primary style) ── */}
                {directConversations.length > 0 && (
                    <>
                        <div className="sidebar-section-title">Messages</div>
                        {directConversations.map((chat) => {
                            const otherParticipant = chat.participants.find(p => p._id !== currentUserId) || chat.participants[0];
                            const isSelected = selectedChat?._id === chat._id;
                            const isOnline = onlineUsers[otherParticipant?._id] === 'online';
                            const unreadCount = chat.unreadCount?.[currentUserId] || 0;
                            const isTyping = typingStatus[chat._id];
                            const lastTime = getRelativeTime(chat.lastMessage?.createdAt || chat.updatedAt);

                            return (
                                <div 
                                    key={chat._id} 
                                    className={`user-item ${isSelected ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                                    onClick={() => selectChatWithHash(chat)}
                                >
                                    <div className="user-avatar-wrapper">
                                        <Avatar 
                                            pic={otherParticipant?.profile_pic} 
                                            username={otherParticipant?.username} 
                                            className="user-avatar-img"
                                        />
                                        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name-row">
                                            <span className="user-name">{getCleanName(otherParticipant?.username)}</span>
                                            <span className="chat-time-stamp">{lastTime}</span>
                                        </div>
                                        <div className="user-name-row">
                                            <span className={`last-message-preview ${isTyping ? 'is-typing' : ''}`}>
                                                {isTyping ? 'typing...' : (chat.lastMessage?.text || 'Start chatting')}
                                            </span>
                                            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* User Discovery (only when searching) */}
                {search.length > 0 && filteredUsers.length > 0 && (
                    <>
                        <div className="sidebar-section-title">Search Results</div>
                        {filteredUsers.map((user) => (
                            <div 
                                key={user._id} 
                                className={`user-item discovery ${user._id === currentUserId ? 'is-self' : ''}`}
                                onClick={() => handleStartChatFromSearch(user)}
                            >
                                <div className="user-avatar-wrapper">
                                    <Avatar 
                                        pic={user.profile_pic} 
                                        username={user.username} 
                                        className="user-avatar-img"
                                    />
                                    <span className={`status-dot ${onlineUsers[user._id] === 'online' ? 'online' : 'offline'}`}></span>
                                </div>
                                <div className="user-info">
                                        {getCleanName(user.username)} {user._id === currentUserId ? '(You)' : ''}
                                    <span className="user-status-online">
                                        {user._id === currentUserId ? 'Saved Messages' : 'Available for chat'}
                                    </span>
                                </div>
                                <div className="quick-action-icon">
                                    {following.includes(user._id) ? (
                                        <Send size={16} onClick={(e) => { e.stopPropagation(); handleStartChatFromSearch(user); }} />
                                    ) : (
                                        <button className="btn-add-connection" onClick={(e) => { e.stopPropagation(); handleFollow(user); }}>
                                            <UserPlus size={16} /> <span>Connect</span>
                                        </button>
                                    )}
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
            
            {/* Native Bar Chat Sidebar Slot */}
            <AdSpace type="horizontal" id="sidebar-ad" minimal={true} />
            
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
                                        <Avatar 
                                            pic={u.profile_pic} 
                                            username={u.username} 
                                            className="participant-chip-avatar"
                                        />
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
