import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';
import { viewStatus, toggleStatusLike, replyToStatus } from '../api';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';

const StoryViewer = ({ group, onClose, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [replyText, setReplyText] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const progressInterval = useRef(null);
    
    const stories = group.stories;
    const currentStory = stories[currentIndex];
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = user.id || user._id;

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
        }, 50); // Adjust for story duration (approx 5s per story)

        // Mark as viewed when story changes
        if (currentStory && !currentStory.views.some(v => v.user === myId)) {
            viewStatus(currentStory._id);
        }

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPaused]);

    const handleLike = async () => {
        try {
            await toggleStatusLike(currentStory._id);
            // Local update for UI feedback
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
        if (!replyText.trim()) return;
        try {
            await replyToStatus(currentStory._id, replyText);
            setReplyText('');
            alert('Reply sent to inbox!');
        } catch (err) {
            console.error('Reply failed:', err);
        }
    };

    return (
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
                        <span className="header-username">{group.user.username}</span>
                        <span className="story-time">{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button className="close-story-btn" onClick={onClose}><X size={24} /></button>
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
                            animate={{ opacity: 1, scale: 1 }}
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
        </div>
    );
};

export default StoryViewer;
