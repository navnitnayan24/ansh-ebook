import React, { useState, useEffect } from 'react';
import { fetchActiveStories } from '../api';
import Avatar from './Avatar';
import { Plus } from 'lucide-react';
import StatusUploadModal from './StatusUploadModal';
import StoryViewer from './StoryViewer';
import { useSocket } from '../realtime-module/context/SocketContext';

const StoriesBar = () => {
    const [storyGroups, setStoryGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user._id;

    const loadStories = async () => {
        try {
            const res = await fetchActiveStories();
            setStoryGroups(res.data);
        } catch (err) {
            console.error('Failed to load stories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStories();

        if (socket) {
            socket.on('new-status', () => {
                loadStories();
            });
            return () => socket.off('new-status');
        }
    }, [socket]);

    const myGroup = storyGroups.find(g => g.user._id === userId);
    const otherGroups = storyGroups.filter(g => g.user._id !== userId);

    return (
        <div className="stories-container-outer">
            <div className="stories-scroll-wrapper">
                {/* My Status / Upload Button (Only if logged in) */}
                {userId && (
                    <div className="story-item-wrapper" onClick={() => myGroup ? setSelectedGroup(myGroup) : setIsUploadOpen(true)}>
                        <div className={`story-ring ${myGroup ? 'has-story' : 'no-story'}`}>
                            <Avatar 
                                pic={user.profile_pic} 
                                username={user.username} 
                                className="story-avatar"
                            />
                            {!myGroup && (
                                <div className="plus-icon-badge">
                                    <Plus size={12} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <span className="story-username">My Status</span>
                    </div>
                )}

                {/* Other Users' Stories */}
                {otherGroups.map((group) => {
                    const hasUnseen = group.stories.some(s => !s.views.some(v => v.user === userId));
                    return (
                        <div 
                            key={group.user._id} 
                            className="story-item-wrapper" 
                            onClick={() => setSelectedGroup(group)}
                        >
                            <div className={`story-ring ${hasUnseen ? 'unseen' : 'seen'}`}>
                                <Avatar 
                                    pic={group.user.profile_pic} 
                                    username={group.user.username} 
                                    className="story-avatar"
                                />
                            </div>
                            <span className="story-username">{group.user.username}</span>
                        </div>
                    );
                })}

                {loading && storyGroups.length === 0 && (
                    <div className="story-skeleton-wrapper">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="story-skeleton-circle"></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isUploadOpen && (
                <StatusUploadModal 
                    onClose={() => setIsUploadOpen(false)} 
                    onSuccess={() => {
                        setIsUploadOpen(false);
                        loadStories();
                    }}
                />
            )}

            {selectedGroup && (
                <StoryViewer 
                    group={selectedGroup} 
                    onClose={() => setSelectedGroup(null)} 
                    onComplete={() => {
                        setSelectedGroup(null);
                        loadStories();
                    }}
                />
            )}
        </div>
    );
};

export default StoriesBar;
