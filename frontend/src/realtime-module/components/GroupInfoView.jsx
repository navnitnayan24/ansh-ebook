import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, UserMinus, LogOut, MoreVertical, Search, Check, Plus } from 'lucide-react';
import { getAvatarUrl } from '../../config';
import { searchUsers, addMember } from '../../api';

const GroupInfoView = ({ chat, onClose, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = chat.admin === (currentUser.id || currentUser._id);

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };

    useEffect(() => {
        if (isAdding) {
            handleSearch('');
        }
    }, [isAdding]);

    const handleSearch = async (q) => {
        setSearchQuery(q);
        setIsLoading(true);
        try {
            const res = await searchUsers(q);
            // Filter out already participants
            const existingIds = chat.participants.map(p => p._id);
            const filtered = res.data.filter(u => !existingIds.includes(u._id));
            setAvailableUsers(filtered);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (userId) => {
        try {
            const res = await addMember({ chatId: chat._id, userId });
            if (onUpdate) onUpdate(res.data);
            setIsAdding(false);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add member");
        }
    };

    return (
        <div className="group-info-sidebar">
            <div className="group-info-header">
                <button className="close-info-btn" onClick={onClose}><X size={20}/></button>
                <h3>{isAdding ? 'Add Member' : 'Group Info'}</h3>
            </div>

            {isAdding ? (
                <div className="add-member-view">
                    <div className="search-bar-modern">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                        <button onClick={() => setIsAdding(false)}><X size={16}/></button>
                    </div>
                    <div className="available-users-list">
                        {isLoading ? <div className="loading-spinner-small">Searching...</div> : 
                         availableUsers.map(user => (
                            <div key={user._id} className="user-search-item" onClick={() => handleAddUser(user._id)}>
                                <img src={getAvatarUrl(user.profile_pic, user.username)} alt={user.username} />
                                <span>{formatUsername(user.username)}</span>
                                <Plus size={16} className="add-icon-mini" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="group-info-main">
                        <div className="group-avatar-large">💎</div>
                        <h2 className="group-name-large">{chat.name || 'Kohinoor Group'}</h2>
                        <p className="group-desc">{chat.description || 'Premium real-time collaboration group.'}</p>
                        <span className="members-count">{chat.participants?.length || 0} Members</span>
                    </div>

                    <div className="group-actions-list">
                        {isAdmin && (
                            <button className="group-action-item" onClick={() => setIsAdding(true)}>
                                <UserPlus size={18} /> Add Members
                            </button>
                        )}
                        <button className="group-action-item danger">
                            <LogOut size={18} /> Exit Group
                        </button>
                    </div>

                    <div className="participants-section">
                        <h4>Participants</h4>
                        <div className="participants-list">
                            {chat.participants?.map((member) => (
                                <div key={member._id} className="participant-item">
                                    <img 
                                        src={getAvatarUrl(member.profile_pic, member.username)} 
                                        alt={member.username} 
                                        onError={(e) => { e.target.src = getAvatarUrl(null, member.username); }}
                                    />
                                    <div className="participant-name">
                                        <span>{formatUsername(member.username)}</span>
                                        {chat.admin === member._id && <span className="admin-tag">Admin</span>}
                                    </div>
                                    {isAdmin && member._id !== (currentUser.id || currentUser._id) && (
                                        <button className="member-more-btn"><MoreVertical size={16}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GroupInfoView;
