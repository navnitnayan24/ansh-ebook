import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ChatSidebar = ({ users, setSelectedChat, selectedChat }) => {
    const [search, setSearch] = useState('');
    const { onlineUsers } = useSocket();

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) || 
        user._id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="chat-sidebar glass-card">
            <div className="sidebar-header">
                <h3>Messages</h3>
                <div className="search-bar-chat">
                    <Search size={16} className="search-icon-chat" />
                    <input 
                        type="text" 
                        placeholder="Search name or ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="user-list">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div 
                            key={user._id} 
                            className={`user-item ${selectedChat?.participants?.[1]?._id === user._id ? 'active' : ''}`}
                            onClick={() => setSelectedChat({ 
                                _id: `new-${user._id}`, 
                                participants: [{}, user] 
                            })}
                        >
                        <div className="user-avatar-wrapper">
                            <img src={user.profilePic || '/default-avatar.png'} alt={user.name} />
                            {onlineUsers[user._id] === 'online' && <span className="online-indicator"></span>}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user.name}</span>
                            <span className="user-status muted-text">
                                {onlineUsers[user._id] === 'online' ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                ))
                ) : (
                    <div className="no-users-found muted-text">No users found</div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
