import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Shield, UserMinus, LogOut, MoreVertical, Search, Check, Plus, Edit2, Save, Copy, Camera, Link } from 'lucide-react';
import { getAvatarUrl, maskEmail } from '../../config';
import Avatar from '../../components/Avatar';
import { searchUsers, addMember, removeMember, updateGroup, leaveGroup } from '../../api';

const GroupInfoView = ({ chat, onClose, onUpdate }) => {
    const navigate = useNavigate();
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
    const currentId = currentUser.id || currentUser._id;
    const isAdmin = chat.admin === currentId || chat.admin?._id === currentId;

    const otherUser = !chat.isGroup ? (
        chat.participants?.find(p => (p._id || p.id)?.toString() !== currentId?.toString()) || 
        chat.participants?.[0] || 
        {}
    ) : null;

    const [isViewingAvatar, setIsViewingAvatar] = useState(false);

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

    const copyJoinLink = () => {
        const link = `${window.location.origin}/chat?join=${chat.joinCode}`;
        navigator.clipboard.writeText(link);
        alert("Join link copied to clipboard!");
    };

    const handleIconUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default'); // Assuming standard preset or should I use ansh-ebook logic?
        
        setIsLoading(true);
        try {
            // Using Cloudinary direct upload for simplicity or existing API if available
            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/datao7ela/image/upload`, {
                method: 'POST',
                body: formData
            });
            const cloudData = await cloudRes.json();
            
            const res = await updateGroup({ chatId: chat._id, groupIcon: cloudData.secure_url });
            if (onUpdate) onUpdate(res.data);
        } catch (err) {
            alert("Failed to update group icon");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="group-info-sidebar">
            <div className="group-info-header">
                <button className="close-info-btn" onClick={onClose}><X size={20}/></button>
                <h3>{!chat.isGroup ? (otherUser?.username || 'User Profile') : isAdding ? 'Add Member' : isEditing ? 'Edit Group' : 'Group Info'}</h3>
            </div>

            {/* FULL SCREEN AVATAR VIEWER */}
            {isViewingAvatar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <button onClick={() => setIsViewingAvatar(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '10px', color: '#fff', cursor: 'pointer' }}>
                        <X size={28} />
                    </button>
                    <div style={{ width: '85vw', height: '85vw', maxWidth: '350px', maxHeight: '350px' }}>
                        {chat.isGroup && !chat.groupIcon ? (
                            <div className="group-avatar-main" style={{ width: '100%', height: '100%', fontSize: '80px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>💎</div>
                        ) : (
                            <Avatar 
                                pic={chat.isGroup ? chat.groupIcon : (selectedMember?.profile_pic || otherUser?.profile_pic)}
                                username={chat.isGroup ? chat.name : (selectedMember?.username || otherUser?.username)}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'block' }}
                            />
                        )}
                    </div>
                </div>
            )}

            {selectedMember ? (
                <div className="member-detail-overlay">
                    <div className="detail-header">
                        <button className="back-btn" onClick={() => setSelectedMember(null)}><X size={20}/></button>
                        <h3>User Profile</h3>
                    </div>
                    <div className="detail-main">
                        <div className="detail-avatar-container" onClick={() => setIsViewingAvatar(true)} style={{ cursor: 'pointer' }}>
                            <Avatar 
                                pic={selectedMember.profile_pic} 
                                username={selectedMember.username} 
                            />
                        </div>
                        <h2 className="detail-username">{maskEmail(selectedMember.username)}</h2>
                        
                        <div className="detail-info-group">
                            <label>About / Bio</label>
                            <p className="bio-text" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', fontStyle: 'italic' }}>
                                {selectedMember.bio || 'Premium Ansh Ebook User'}
                            </p>
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
                        <button className="message-direct-btn" onClick={() => navigate(`/chat?dm=${selectedMember._id}`)}>
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
                                <Avatar 
                                    pic={user.profile_pic} 
                                    username={user.username} 
                                />
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
            ) : !chat.isGroup ? (
                // 1-on-1 Private Chat Profile View
                <div className="member-detail-overlay" style={{ position: 'relative', height: '100%' }}>
                    <div className="detail-main">
                        <div className="detail-avatar-container" onClick={() => setIsViewingAvatar(true)} style={{ cursor: 'pointer' }}>
                            <Avatar 
                                pic={otherUser?.profile_pic} 
                                username={otherUser?.username} 
                            />
                        </div>
                        <h2 className="detail-username" style={{ marginBottom: '5px' }}>{maskEmail(otherUser?.username)}</h2>
                        
                        <div className="detail-info-group">
                            <label>About / Bio</label>
                            <p className="bio-text" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', fontStyle: 'italic', margin: '8px 0' }}>
                                {otherUser?.bio || 'Premium Ansh Ebook User'}
                            </p>
                        </div>

                        {otherUser?.link && (
                            <div className="detail-info-group">
                                <label>Website / Link</label>
                                <a 
                                    href={otherUser.link.startsWith('http') ? otherUser.link : `https://${otherUser.link}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', background: 'rgba(255,20,147,0.1)', padding: '8px 12px', borderRadius: '8px', marginTop: '5px' }}
                                >
                                    <Globe size={14} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {otherUser.link.replace(/^https?:\/\//, '')}
                                    </span>
                                </a>
                            </div>
                        )}
                        
                        <div className="detail-info-group privacy-note" style={{ marginTop: '15px' }}>
                            <Shield size={14} />
                            <span>Privacy protected: Email fully hidden</span>
                        </div>
                    </div>
                </div>
            ) : (
                // Main info view for GROUPS...
                <>
                    <div className="group-info-main">
                        <div className="group-avatar-large" style={{ position: 'relative', cursor: chat.groupIcon ? 'pointer' : 'default' }} onClick={() => chat.groupIcon && setIsViewingAvatar(true)}>
                            {chat.groupIcon ? (
                                <img src={chat.groupIcon} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : '💎'}
                            {isAdmin && (
                                <label className="edit-icon-overlay">
                                    <Camera size={20} />
                                    <input type="file" hidden onChange={handleIconUpdate} accept="image/*" />
                                </label>
                            )}
                        </div>
                        <h2 className="group-name-large">{chat.name || 'Kohinoor Group'}</h2>
                        <p className="group-desc">{chat.description || 'Premium real-time collaboration group.'}</p>
                        
                        <div className="join-code-box">
                            <div className="join-code-row">
                                <span className="join-label">JOIN CODE</span>
                                <span className="join-val">{chat.joinCode || 'N/A'}</span>
                                <button className="copy-btn-mini" onClick={copyJoinLink}>
                                    <Copy size={14} />
                                </button>
                            </div>
                            <span className="join-hint">Share link to invite members</span>
                        </div>

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
                                    <Avatar 
                                        pic={member.profile_pic} 
                                        username={member.username} 
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
