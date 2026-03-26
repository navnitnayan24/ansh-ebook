import React from 'react';
import { useSocket } from '../context/SocketContext';

const ChatSidebar = ({ users, setSelectedChat, selectedChat }) => {
    const { onlineUsers } = useSocket();

    return (
        <div className="chat-sidebar glass-card">
            <div className="sidebar-header">
                <h3>Messages</h3>
            </div>
            <div className="user-list">
                {users.map((user) => (
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
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;
