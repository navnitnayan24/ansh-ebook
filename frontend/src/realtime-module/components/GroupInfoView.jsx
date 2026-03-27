import React from 'react';
import { X, UserPlus, Shield, UserMinus, LogOut, MoreVertical } from 'lucide-react';
import { getAvatarUrl } from '../../config';

const GroupInfoView = ({ chat, onClose }) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = chat.admin === (currentUser.id || currentUser._id);

    return (
        <div className="group-info-sidebar">
            <div className="group-info-header">
                <button className="close-info-btn" onClick={onClose}><X size={20}/></button>
                <h3>Group Info</h3>
            </div>

            <div className="group-info-main">
                <div className="group-avatar-large">💎</div>
                <h2 className="group-name-large">{chat.name || 'Kohinoor Group'}</h2>
                <p className="group-desc">{chat.description || 'Premium real-time collaboration group.'}</p>
                <span className="members-count">{chat.participants?.length || 0} Members</span>
            </div>

            <div className="group-actions-list">
                {isAdmin && (
                    <button className="group-action-item">
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
                                <span>{member.username}</span>
                                {chat.admin === member._id && <span className="admin-tag">Admin</span>}
                            </div>
                            {isAdmin && member._id !== (currentUser.id || currentUser._id) && (
                                <button className="member-more-btn"><MoreVertical size={16}/></button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GroupInfoView;
