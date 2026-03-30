import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight, Heart, Send, Share2, Trash2 } from 'lucide-react';
import { viewStatus, toggleStatusLike, replyToStatus, deleteStatus } from '../api';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';

const StoryViewer = ({ group, onClose, onComplete }) => {
    // ... logic remains same ...
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [replyText, setReplyText] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const progressInterval = useRef(null);
    
    const stories = group.stories;
    const currentStory = stories[currentIndex];
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = user.id || user._id;

    const isOwner = group.user._id === myId;

    const nextStory = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onComplete();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    useEffect(() => {
        if (isPaused) {
            clearInterval(progressInterval.current);
            return;
        }

        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory();
                    return 0;
                }
                return prev + 1;
            });
        }, 50);

        // Mark as viewed when story changes (Only if logged in)
        if (myId && currentStory && !currentStory.views.some(v => v.user === myId)) {
            viewStatus(currentStory._id);
        }

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPaused, myId]);

    const handleLike = async () => {
        if (!myId) return window.location.href = '/login';
        try {
            await toggleStatusLike(currentStory._id);
            if (currentStory.likes.includes(myId)) {
                currentStory.likes = currentStory.likes.filter(id => id !== myId);
            } else {
                currentStory.likes.push(myId);
            }
        } catch (err) {
            console.error('Like failed:', err);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!myId) return window.location.href = '/login';
        if (!replyText.trim()) return;
        try {
            await replyToStatus(currentStory._id, replyText);
            setReplyText('');
            alert('Reply sent to inbox!');
        } catch (err) {
            console.error('Reply failed:', err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this status?')) return;
        try {
            await deleteStatus(currentStory._id);
            if (stories.length === 1) {
                onComplete();
            } else {
                nextStory();
            }
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Story from ' + group.user.username,
                text: currentStory.caption || 'Check out my story on Ansh Ebook!',
                url: window.location.origin
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.origin);
            alert('Link copied to clipboard!');
        }
    };

    return ReactDOM.createPortal(
        <div className="story-viewer-overlay" onClick={onClose}>
            <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
                {/* Progress Bars */}
                <div className="story-progress-container">
                    {stories.map((_, idx) => (
                        <div key={idx} className="story-progress-bg">
                            <div 
                                className="story-progress-fill" 
                                style={{ 
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-viewer-header">
                    <div className="story-user-info">
                        <Avatar pic={group.user.profile_pic} username={group.user.username} className="header-avatar-small" />
                        <div className="user-text-meta">
                            <span className="header-username">{group.user.username}</span>
                            <span className="story-time">{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div className="story-header-actions">
                        <button className="story-action-btn share" onClick={handleShare} title="Share"><Share2 size={20} /></button>
                        {isOwner && (
                            <button className="story-action-btn delete" onClick={handleDelete} title="Delete"><Trash2 size={20} /></button>
                        )}
                        <button className="close-story-btn" onClick={onClose}><X size={24} /></button>
                    </div>
                </div>

                {/* Media Content */}
                <div 
                    className="story-media-container"
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentStory._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 0.9 }} 
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="media-wrapper"
                        >
                            {currentStory.mediaType === 'video' ? (
                                <video src={currentStory.mediaUrl} autoPlay muted playsInline />
                            ) : (
                                <img src={currentStory.mediaUrl} alt="story" />
                            )}
                            {currentStory.caption && (
                                <div className="story-caption-overlay">
                                    <p>{currentStory.caption}</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Areas */}
                    <div className="nav-area left" onClick={prevStory} />
                    <div className="nav-area right" onClick={nextStory} />
                </div>

                {/* Footer Reactions */}
                <div className="story-viewer-footer">
                    <form className="story-reply-form" onSubmit={handleReply}>
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                        />
                        <button type="submit" className="send-reply-btn"><Send size={20} /></button>
                    </form>
                    <button 
                        className={`like-story-btn ${currentStory.likes.includes(myId) ? 'active' : ''}`} 
                        onClick={handleLike}
                    >
                        <Heart size={24} fill={currentStory.likes.includes(myId) ? "#ff1493" : "none"} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default StoryViewer;
