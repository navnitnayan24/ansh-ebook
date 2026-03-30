import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight, Heart, Send, Share2, Trash2, Eye, MessageSquare } from 'lucide-react';
import { viewStatus, toggleStatusLike, replyToStatus, deleteStatus, addCommentToStatus } from '../api';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';

const StoryViewer = ({ group, onClose, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [replyText, setReplyText] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const progressInterval = useRef(null);
    
    const stories = group.stories;
    const currentStory = stories[currentIndex];
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = user.id || user._id;

    const isOwner = group.user._id === myId;

    // Helper to check if I liked/viewed
    const hasLiked = (story) => {
        return story.likes.some(l => (typeof l === 'string' ? l === myId : l._id === myId));
    };

    const nextStory = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
            setShowStats(false);
            setShowComments(false);
        } else {
            onComplete();
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
            setShowStats(false);
            setShowComments(false);
        }
    };

    useEffect(() => {
        if (isPaused || showStats || showComments) {
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

        if (myId && currentStory && !currentStory.views.some(v => (v.user._id || v.user) === myId)) {
            viewStatus(currentStory._id);
        }

        return () => clearInterval(progressInterval.current);
    }, [currentIndex, isPaused, myId, showStats, showComments]);

    const handleLike = async () => {
        if (!myId) return window.location.href = '/login';
        try {
            const res = await toggleStatusLike(currentStory._id);
            // Updating local state for UI
            currentStory.likes = res.data.likes; 
        } catch (err) {
            console.error('Like failed:', err);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!myId) return window.location.href = '/login';
        if (!replyText.trim()) return;
        try {
            if (showComments) {
                const res = await addCommentToStatus(currentStory._id, replyText);
                if (!currentStory.comments) currentStory.comments = [];
                currentStory.comments.push(res.data);
                setReplyText('');
            } else {
                await replyToStatus(currentStory._id, replyText);
                setReplyText('');
                alert('Reply sent to inbox!');
            }
        } catch (err) {
            console.error('Action failed:', err);
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

    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            if (currentStory.audioUrl && !isPaused && !showStats && !showComments) {
                audioRef.current.play().catch(e => console.log('Audio autoplay blocked'));
            }
        }
    }, [currentIndex, isPaused, showStats, showComments, currentStory.audioUrl]);

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
            {/* Hidden Background Audio */}
            {currentStory.audioUrl && (
                <audio ref={audioRef} src={currentStory.audioUrl} loop />
            )}

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
                                <video src={currentStory.mediaUrl} autoPlay muted={currentStory.isMuted} playsInline />
                            ) : (
                                <img src={currentStory.mediaUrl} alt="story" />
                            )}

                            {/* Music Badge in Viewer */}
                            {currentStory.audioUrl && (
                                <div className="viewer-music-badge">
                                    <MusicIcon size={14} className="animate-pulse" />
                                    <span>Background Music Playing</span>
                                </div>
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

                    {/* Interactions Overlay Buttons */}
                    <div className="story-side-actions">
                        <button 
                            className={`side-action-btn ${hasLiked(currentStory) ? 'active' : ''}`}
                            onClick={handleLike}
                        >
                            <Heart size={28} fill={hasLiked(currentStory) ? "#ff1493" : "none"} />
                            <span>{currentStory.likes?.length || 0}</span>
                        </button>
                        <button 
                            className="side-action-btn"
                            onClick={() => { setShowComments(!showComments); setShowStats(false); }}
                        >
                            <MessageSquare size={28} />
                            <span>{currentStory.comments?.length || 0}</span>
                        </button>
                    </div>

                    {/* Owner Stats Trigger */}
                    {isOwner && (
                        <div className="story-owner-stats-bar" onClick={() => { setShowStats(true); setShowComments(false); }}>
                            <Eye size={18} />
                            <span>{currentStory.views?.length || 0} Viewers</span>
                        </div>
                    )}
                </div>

                {/* Footer Input */}
                <div className="story-viewer-footer">
                    <form className="story-reply-form" onSubmit={handleReply}>
                        <input 
                            type="text" 
                            placeholder={showComments ? "Add a comment..." : "Reply to story..."}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                        />
                        <button type="submit" className="send-reply-btn"><Send size={20} /></button>
                    </form>
                </div>

                {/* SLIDE UP DRAWERS */}
                <AnimatePresence>
                    {showStats && isOwner && (
                        <motion.div 
                            className="story-drawer"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                        >
                            <div className="drawer-header">
                                <h3>Story Stats</h3>
                                <button onClick={() => setShowStats(false)}><X size={20} /></button>
                            </div>
                            <div className="drawer-tabs">
                                <div className="drawer-section">
                                    <h4>Viewers</h4>
                                    <div className="user-list">
                                        {currentStory.views.map((v, i) => (
                                            <div key={i} className="user-list-item">
                                                <Avatar pic={v.user.profile_pic} username={v.user.username} className="avatar-micro" />
                                                <span>{v.user.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="drawer-section">
                                    <h4>Likes</h4>
                                    <div className="user-list">
                                        {currentStory.likes.map((l, i) => (
                                            <div key={i} className="user-list-item">
                                                <Avatar pic={l.profile_pic} username={l.username} className="avatar-micro" />
                                                <span>{l.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {showComments && (
                        <motion.div 
                            className="story-drawer"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                        >
                            <div className="drawer-header">
                                <h3>Comments</h3>
                                <button onClick={() => setShowComments(false)}><X size={20} /></button>
                            </div>
                            <div className="comments-list">
                                {currentStory.comments?.length > 0 ? (
                                    currentStory.comments.map((c, i) => (
                                        <div key={i} className="comment-item">
                                            <Avatar pic={c.user.profile_pic} username={c.user.username} className="avatar-micro" />
                                            <div className="comment-text-box">
                                                <span className="comment-user">{c.user.username}</span>
                                                <p>{c.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-comments">No comments yet. Be the first!</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>,
        document.body
    );
};

export default StoryViewer;
