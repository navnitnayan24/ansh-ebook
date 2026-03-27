import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, UserMinus, LogOut, MoreVertical, Search, Check, Plus, Edit2, Save } from 'lucide-react';
import { getAvatarUrl, maskEmail } from '../../config';
import { searchUsers, addMember, removeMember, updateGroup, leaveGroup } from '../../api';

const GroupInfoView = ({ chat, onClose, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Edit form state
    const [editName, setEditName] = useState(chat.name || '');
    const [editDesc, setEditDesc] = useState(chat.description || '');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;
    const isAdmin = chat.admin === currentUserId || chat.admin?._id === currentUserId;

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (typeof name === 'string' && name.includes('@')) return name.split('@')[0];
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

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            const res = await removeMember({ chatId: chat._id, userId });
            if (onUpdate) onUpdate(res.data);
            setSelectedMember(null);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to remove member");
        }
    };

    const handleUpdateGroup = async () => {
        try {
            const res = await updateGroup({ chatId: chat._id, name: editName, description: editDesc });
            if (onUpdate) onUpdate(res.data);
            setIsEditing(false);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update group");
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            await leaveGroup(chat._id);
            window.location.reload(); // Refresh to clear the chat from sidebar
        } catch (err) {
            alert(err.response?.data?.error || "Failed to leave group");
        }
    };

    return (
        <div className="group-info-sidebar">
            <div className="group-info-header">
                <button className="close-info-btn" onClick={onClose}><X size={20}/></button>
                <h3>{isAdding ? 'Add Member' : isEditing ? 'Edit Group' : 'Group Info'}</h3>
            </div>

            {selectedMember ? (
                <div className="member-detail-overlay">
                    <div className="detail-header">
                        <button className="back-btn" onClick={() => setSelectedMember(null)}><X size={20}/></button>
                        <h3>User Profile</h3>
                    </div>
                    <div className="detail-main">
                        <div className="detail-avatar-container">
                            <img 
                                src={getAvatarUrl(selectedMember.profile_pic, selectedMember.username)} 
                                alt={maskEmail(selectedMember.username)}
                                onError={(e) => { e.target.src = getAvatarUrl(null, selectedMember.username); }}
                            />
                        </div>
                        <h2 className="detail-username">{maskEmail(selectedMember.username)}</h2>
                        
                        <div className="detail-info-group">
                            <label>System ID</label>
                            <div className="id-pill-container">
                                <code className="system-id-pill">{selectedMember._id}</code>
                            </div>
                        </div>

                        <div className="detail-info-group">
                            <label>Role</label>
                            <span className="role-text">{chat.admin === selectedMember._id || chat.admin?._id === selectedMember._id ? 'Group Admin' : 'Member'}</span>
                        </div>
                        
                        <div className="detail-info-group privacy-note">
                            <Shield size={14} />
                            <span>Privacy protected: Email hidden</span>
                        </div>
                    </div>
                    <div className="detail-actions">
                        {isAdmin && selectedMember._id !== currentId && (
                            <button className="remove-member-btn" onClick={() => handleRemoveMember(selectedMember._id)}>
                                <UserMinus size={18} /> Remove from Group
                            </button>
                        )}
                        <button className="message-direct-btn" onClick={() => alert("Direct message coming soon!")}>
                            Send Private Message
                        </button>
                    </div>
                </div>
            ) : isAdding ? (
                // Adding view...
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
                                <img src={getAvatarUrl(user.profile_pic, user.username)} alt={maskEmail(user.username)} />
                                <span>{maskEmail(user.username)}</span>
                                <Plus size={16} className="add-icon-mini" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : isEditing ? (
                // Editing view...
                <div className="edit-group-view">
                    <div className="edit-form">
                        <div className="form-group">
                            <label>Group Name</label>
                            <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                placeholder="Enter group name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                value={editDesc} 
                                onChange={(e) => setEditDesc(e.target.value)} 
                                placeholder="Enter group description"
                                rows={4}
                            />
                        </div>
                        <div className="edit-actions">
                            <button className="save-group-btn" onClick={handleUpdateGroup}>
                                <Save size={18} /> Save Changes
                            </button>
                            <button className="cancel-edit-btn" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Main info view...
                <>
                    <div className="group-info-main">
                        <div className="group-avatar-large">💎</div>
                        <h2 className="group-name-large">{chat.name || 'Kohinoor Group'}</h2>
                        <p className="group-desc">{chat.description || 'Premium real-time collaboration group.'}</p>
                        <span className="members-count">{chat.participants?.length || 0} Members</span>
                    </div>

                    <div className="group-actions-list">
                        {isAdmin && (
                            <>
                                <button className="group-action-item" onClick={() => setIsAdding(true)}>
                                    <UserPlus size={18} /> Add Members
                                </button>
                                <button className="group-action-item" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={18} /> Edit Group Info
                                </button>
                            </>
                        )}
                        <button className="group-action-item danger" onClick={handleLeaveGroup}>
                            <LogOut size={18} /> Exit Group
                        </button>
                    </div>

                    <div className="participants-section">
                        <h4>Participants</h4>
                        <div className="participants-list">
                            {chat.participants?.map((member) => (
                                <div key={member._id} className="participant-item" onClick={() => setSelectedMember(member)}>
                                    <img 
                                        src={getAvatarUrl(member.profile_pic, member.username)} 
                                        alt={maskEmail(member.username)} 
                                        onError={(e) => { e.target.src = getAvatarUrl(null, member.username); }}
                                    />
                                    <div className="participant-name">
                                        <span>{maskEmail(member.username)}</span>
                                        {(chat.admin === member._id || chat.admin?._id === member._id) && <span className="admin-tag">Admin</span>}
                                    </div>
                                    {isAdmin && member._id !== currentId && (
                                        <button className="member-more-btn" onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }}><MoreVertical size={16}/></button>
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
