import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Quote, Heart, Copy, Search, ArrowLeft, Share2, PenTool, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories } from '../api';
import { maskEmail } from '../config';
import SEO from '../components/SEO';
import AdSpace from '../components/AdSpace';
import '../styles/Shayari.css';

const Shayari = () => {
    const [shayaris, setShayaris] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [commentingOn, setCommentingOn] = useState(null);
    const [commentText, setCommentText] = useState('');
    const navigate = useNavigate();

    const currentUser = (() => {
        try {
            const saved = localStorage.getItem('user');
            return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
        } catch { return null; }
    })();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const catParam = selectedCategory && selectedCategory !== 'All' ? selectedCategory : '';
                const [shRes, catRes] = await Promise.all([
                    fetchContentByType('shayari', catParam, searchQuery),
                    fetchCategories('shayari')
                ]);
                setShayaris(shRes.data);
                setAllCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => {};
    }, [selectedCategory, searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const toggleLike = async (id) => {
        if (!currentUser) {
            alert('Please login to like this Shayari!');
            return;
        }
        try {
            const { data } = await (await import('../api')).API.post(`shayari/${id}/like`);
            setShayaris(shayaris.map(s => 
                s._id === id ? { ...s, likes_count: data.likes_count, liked_by: data.liked_by } : s
            ));
        } catch (err) {
            console.error("Like error:", err);
            alert(err.response?.data?.error || 'Failed to like');
        }
    };

    const submitComment = async (id) => {
        if (!currentUser) {
            alert('Please login to comment!');
            return;
        }
        if (!commentText.trim()) return;
        try {
            const { data } = await (await import('../api')).API.post(`shayari/${id}/comment`, {
                text: commentText,
                username: currentUser.username
            });
            setShayaris(shayaris.map(s => 
                s._id === id ? { ...s, comments: data.comments } : s
            ));
            setCommentText('');
        } catch (err) {
            console.error("Comment error:", err);
            alert(err.response?.data?.error || 'Failed to post comment');
        }
    };

    const handleShare = async (text) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Shayari by Ansh Ebook',
                    text: text,
                    url: window.location.origin
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(text + " \n\nRead more at: " + window.location.origin);
            alert('Shayari copied to clipboard!');
        }
    };

    const shareToWhatsApp = (text) => {
        const message = encodeURIComponent(text + " \n\n📍 Read more soulful Shayari at: " + window.location.origin);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            className="shayari-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Ansh Ebook - Premium Hindi Shayari" 
                description="Explore original premium Hindi Shayari on Ansh Ebook. Beautiful words for love, life, and motivation by Ansh Sharma." 
            />

            <motion.div className="main-title-area text-center mb-5" variants={itemVariants}>
                <Link to="/" className="back-link pink-text" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1rem', textDecoration: 'none', fontWeight: 'bold'}}>
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                <h1 className="main-title display-4">Ansh Ebook <span className="pink-gradient-text">Shayari Collection</span></h1>
                <p className="sub-title muted-text">Explore words that resonate with your soul.</p>
            </motion.div>

            <div className="shayari-layout">
                <motion.aside className="sidebar" variants={itemVariants}>
                    <div className="glass-card sidebar-widget search-widget mb-4">
                        <h3 className="widget-title">Search</h3>
                        <div className="sidebar-search-wrapper">
                            <input 
                                type="text" 
                                placeholder="Keywords..." 
                                className="glass-input-sidebar"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            <Search className="search-icon-sidebar" size={18} />
                        </div>
                    </div>

                    <div className="glass-card sidebar-widget category-widget mb-4">
                        <h3 className="widget-title">Categories</h3>
                        <div className="category-list-sidebar">
                            <button 
                                className={`cat-link-sidebar ${!selectedCategory || selectedCategory === 'All' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                All Shayari
                            </button>
                            {allCategories && allCategories.length > 0 && allCategories.map(cat => (
                                <button 
                                    key={cat._id} 
                                    className={`cat-link-sidebar ${selectedCategory === cat._id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat._id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card sidebar-widget ad-widget">
                        <AdSpace type="square" id="shayari-sidebar-ad" />
                    </div>
                </motion.aside>

                <main className="content-area">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', letterSpacing: '2px', fontSize: '0.85rem' }}>LOADING...</div>
                    ) : (
                        <motion.div className="shayari-content-wrapper" variants={containerVariants}>
                            <AnimatePresence mode='popLayout'>
                                {Array.isArray(shayaris) && shayaris.length > 0 ? (
                                    <div className="shayari-grid">
                                        {shayaris.map((s) => (
                                            <motion.div 
                                                key={s._id} 
                                                className="glass-card shayari-card"
                                                variants={itemVariants}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                whileHover={{ y: -5 }}
                                            >
                                                <Quote className="quote-icon" />
                                                <p className="shayari-content">{s.content}</p>
                                                <div className="shayari-footer">
                                                    <button className="like-btn" onClick={() => toggleLike(s._id)}>
                                                        <Heart size={18} fill={(currentUser && s.liked_by?.includes(currentUser._id)) ? "#ff2e63" : "none"} color={(currentUser && s.liked_by?.includes(currentUser._id)) ? "#ff2e63" : "currentColor"} />
                                                        <span>{s.likes_count}</span>
                                                    </button>
                                                    <button className="icon-btn-plain ml-2" onClick={() => setCommentingOn(commentingOn === s._id ? null : s._id)}>
                                                        <MessageCircle size={18} />
                                                        <span style={{marginLeft: '5px', fontSize:'0.9rem'}}>{s.comments?.length || 0}</span>
                                                    </button>
                                                    <button className="icon-btn-plain ml-2" onClick={() => handleShare(s.content)} title="Share">
                                                        <Share2 size={16} />
                                                    </button>
                                                    <button className="icon-btn-plain ml-2" onClick={() => shareToWhatsApp(s.content)} title="Share to WhatsApp" style={{ color: '#25D366' }}>
                                                        <MessageCircle size={16} fill="#25D366" />
                                                    </button>
                                                    <div className="shayari-meta ml-auto">
                                                        <span className="date-tag mr-2">{new Date(s.createdAt).toLocaleDateString()}</span>
                                                        <span className="cat-tag">{s.category_id?.name || 'General'}</span>
                                                    </div>
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {commentingOn === s._id && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }} 
                                                            animate={{ height: 'auto', opacity: 1 }} 
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="comments-section mt-3"
                                                            style={{overflow: 'hidden', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem'}}
                                                        >
                                                            <div className="comments-list mb-3" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                                                {s.comments && s.comments.length > 0 ? s.comments.map((c, i) => (
                                                                    <div key={i} className="comment-item" style={{background: 'var(--bg-glass-light)', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.5rem'}}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                            <div>
                                                                                <strong style={{color: 'var(--pink-primary)', fontSize: '0.85rem'}}>{maskEmail(c.username)}</strong>
                                                                                <p style={{margin: '0.3rem 0 0', fontSize: '0.9rem', color: 'var(--text-primary)'}}>{c.text}</p>
                                                                            </div>
                                                                            {currentUser && c.user_id && (c.user_id !== currentUser._id && c.user_id !== currentUser.id) && (
                                                                                <button 
                                                                                    className="icon-btn-plain" 
                                                                                    title="Message User"
                                                                                    onClick={() => navigate(`/chat?dm=${c.user_id}`)}
                                                                                    style={{ color: 'var(--pink-primary)', opacity: 0.8, padding: '2px' }}
                                                                                >
                                                                                    <MessageCircle size={14} fill="currentColor" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                )) : <p className="text-muted" style={{fontSize: '0.85rem'}}>No comments yet. Be the first!</p>}
                                                            </div>
                                                            <div className="comment-input-area" style={{display: 'flex', gap: '10px'}}>
                                                                <input 
                                                                    type="text" 
                                                                    value={commentText} 
                                                                    onChange={(e) => setCommentText(e.target.value)}
                                                                    placeholder="Add a comment..."
                                                                    style={{flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-glass-light)', color: 'var(--text-primary)', outline: 'none'}}
                                                                    onKeyPress={(e) => e.key === 'Enter' && submitComment(s._id)}
                                                                />
                                                                <button className="btn btn-primary" style={{padding: '0.5rem 1rem', borderRadius: '8px'}} onClick={() => submitComment(s._id)}>
                                                                    <Send size={16} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <motion.div className="glass-card empty-card-main" variants={itemVariants}>
                                        <div className="empty-icon-wrapper">
                                            <PenTool className="pink-text pulse-animation" size={60} />
                                        </div>
                                        <h3 className="mt-4">No Shayari Found</h3>
                                        <p className="muted-text">Try adjusting your search or category filter.</p>
                                        <button className="btn btn-outline btn-pill mt-3 btn-sm" onClick={() => {setSearchQuery(''); setSelectedCategory('');}}>
                                            CLEAR FILTERS
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>
        </motion.div>
    );
};

export default Shayari;
