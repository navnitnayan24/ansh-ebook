import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Book, Mic, Quote, ArrowRight, BookOpen, Instagram, Youtube, MessageCircle, PlayCircle, Music, Star, ThumbsUp, ThumbsDown, User, Share2, MessageSquare, Send, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHomeContent, fetchReviews, addReview, updateReviewReaction, API } from '../api';
import { MEDIA_URL } from '../config';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState({ latest_shayari: [], latest_music: [], latest_podcasts: [], featured_ebooks: [] });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [subStatus, setSubStatus] = useState({ message: '', success: false });
    const [contactStatus, setContactStatus] = useState({ message: '', success: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review States
    const [reviews, setReviews] = useState([]);
    const [reviewForm, setReviewForm] = useState({ 
        username: user?.username || '', 
        content: '', 
        rating: 5 
    });
    const [isReviewing, setIsReviewing] = useState(false);
    
    // Comment States
    const [activeCommentsId, setActiveCommentsId] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [editingComment, setEditingComment] = useState(null); // { id, text }

    // Hash Scroll Handling
    useEffect(() => {
        const handleHashScroll = () => {
            const hash = window.location.hash;
            if (hash) {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        handleHashScroll();
        window.addEventListener('hashchange', handleHashScroll);
        return () => window.removeEventListener('hashchange', handleHashScroll);
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser && savedUser !== 'undefined') {
            try {
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error("User state error:", err);
            }
        }
    }, []);

    useEffect(() => {
        const getHomeData = async () => {
            try {
                const homeRes = await fetchHomeContent();
                setContent(homeRes.data);
                
                const reviewsRes = await fetchReviews();
                setReviews(reviewsRes.data);
            } catch (err) {
                console.error('Error fetching home data:', err);
            } finally {
                setLoading(false);
            }
        };
        getHomeData();
    }, []);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        setIsReviewing(true);
        try {
            const { data } = await addReview({
                ...reviewForm,
                username: user.username || 'Anonymous User'
            });
            setReviews([data, ...reviews]);
            setReviewForm({ username: user.username || '', content: '', rating: 5 });
            alert('Thank you for your review! ✨');
        } catch (err) {
            alert('Failed to submit review.');
        } finally {
            setIsReviewing(false);
        }
    };

    const handleReviewReaction = async (id, type) => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const { data } = await updateReviewReaction(id, type);
            setReviews(reviews.map(r => r._id === id ? data : r));
        } catch (err) {
            console.error('Reaction failed:', err);
        }
    };

    const handleShayariLike = async (id) => {
        try {
            const { data } = await API.post(`shayari/${id}/like`);
            setContent(prev => ({
                ...prev,
                latest_shayari: prev.latest_shayari.map(s => 
                    s._id === id ? { ...s, likes_count: data.likes_count } : s
                )
            }));
        } catch (err) {
            console.error('Shayari like failed:', err);
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        try {
            const { subscribeUser } = await import('../api');
            await subscribeUser(email);
            setSubStatus({ message: 'Welcome to the Inner Circle! ✨', success: true });
            setEmail('');
        } catch (err) {
            setSubStatus({ message: err.response?.data?.message || 'Subscription failed.', success: false });
        }
    };

    // --- SHAYARI COMMENT HANDLERS ---
    const handleAddComment = async (shayariId) => {
        if (!user) { navigate('/login'); return; }
        if (!commentText.trim()) return;
        try {
            const { data } = await API.post(`shayari/${shayariId}/comment`, { 
                text: commentText, 
                username: user.username || 'User' 
            });
            setContent(prev => ({
                ...prev,
                latest_shayari: prev.latest_shayari.map(s => s._id === shayariId ? { ...s, comments: data.comments } : s)
            }));
            setCommentText('');
        } catch (err) { alert('Comment failed'); }
    };

    const handleDeleteComment = async (shayariId, commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            const { data } = await API.delete(`shayari/${shayariId}/comment/${commentId}`);
            setContent(prev => ({
                ...prev,
                latest_shayari: prev.latest_shayari.map(s => s._id === shayariId ? { ...s, comments: data.comments } : s)
            }));
        } catch (err) { alert('Delete failed'); }
    };

    const handleUpdateComment = async (shayariId) => {
        if (!editingComment || !editingComment.text.trim()) return;
        try {
            const { data } = await API.put(`shayari/${shayariId}/comment/${editingComment.id}`, { text: editingComment.text });
            setContent(prev => ({
                ...prev,
                latest_shayari: prev.latest_shayari.map(s => s._id === shayariId ? { ...s, comments: data.comments } : s)
            }));
            setEditingComment(null);
        } catch (err) { alert('Update failed'); }
    };

    const handleShayariShare = (item) => {
        if (navigator.share) {
            navigator.share({
                title: 'Ansh Ebook Shayari',
                text: `${item.content}\n\nRead more at Ansh Ebook:`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(item.content)} - Read at ${window.location.href}`;
            window.open(shareUrl, '_blank');
        }
    };

    const handleShayariWhatsApp = (item) => {
        const text = `*Ansh Ebook Original Shayari*\n\n"${item.content}"\n\nRead more at: ${window.location.origin}/shayari`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;
        const diffInMin = Math.floor(diffInMs / (1000 * 60));
        const diffInHrs = Math.floor(diffInMin / 60);
        const diffInDays = Math.floor(diffInHrs / 24);

        if (diffInDays > 0) return `${diffInDays}d ago`;
        if (diffInHrs > 0) return `${diffInHrs}h ago`;
        if (diffInMin > 0) return `${diffInMin}m ago`;
        return 'Just now';
    };

    // Only lock Music, Podcast, Ebook — NOT Shayari
    const checkPremiumAccess = (e, targetPath) => {
        if (!user) {
            e.preventDefault();
            navigate('/login');
        } else if (targetPath) {
            navigate(targetPath);
        }
    };

    const sendEmail = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setContactStatus({ message: '', success: false });
        
        import('@emailjs/browser').then((emailjs) => {
            emailjs.sendForm(
                import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id',
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id',
                e.target,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
            ).then(() => {
                setContactStatus({ message: 'Message sent! We\'ll connect soon. ✨', success: true });
                e.target.reset();
            }).catch(() => {
                setContactStatus({ message: 'Failed to send. Please email us directly.', success: false });
            }).finally(() => setIsSubmitting(false));
        });
    };

    const faqData = [
        { q: "What is Ansh Ebook?", a: "Ansh-Ebook is a premium creative platform specializing in original Shayari, music, podcasts, and E-books." },
        { q: "Is the content original?", a: "Yes, 100%. Every piece is an original creation by Ansh Sharma or our verified partners." },
        { q: "Can I download E-books?", a: "Yes, our E-books are available in PDF format. Some are free, while premium ones can be purchased securely." },
        { q: "How can I stay updated?", a: "Subscribe to our newsletter or join our official WhatsApp and YouTube channels." }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="premium-loader-container">
            <motion.div 
                className="premium-loader"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <p className="loading-text">UNFOLDING CREATIVITY...</p>
        </div>
    );

    return (
        <motion.div 
            className="home-page"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Ansh Ebook - Free Shayari, Music, Podcasts" 
                description="Welcome to Ansh-Ebook. Explore original premium Hindi Shayari, soulful Music, Podcasts, and E-Books."
            />
            
            {/* HERO SECTION */}
            <section id="hero" className="hero-section">
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <div className="bg-blob blob-3"></div>
                <motion.div className="hero-content" variants={itemVariants}>
                    <motion.h1 className="hero-main-branding">Welcome to <span className="pink-gradient-text">Ansh Ebook</span></motion.h1>
                    <motion.p className="hero-description-v2">A digital sanctuary where words find meaning, melodies touch the soul, and stories inspire greatness.</motion.p>
                    <div className="hero-actions-v2">
                        <Link to="/shayari" className="btn btn-primary btn-lg shadow-neon">READ SHAYARI</Link>
                        <Link to="/music" className="btn btn-dark-outline btn-lg">PREMIUM CONTENT</Link>
                    </div>
                </motion.div>
            </section>

            {/* EXPLORE SECTION */}
            <section id="explore" className="featured-section container">
                <motion.div className="section-header text-center" variants={itemVariants}>
                    <h2 className="w-100">Explore the <span className="text-gradient">Ansh Ebook World</span></h2>
                </motion.div>
                <div className="explore-grid">
                    {/* Shayari — FREE, no login needed */}
                    <motion.div onClick={() => navigate('/shayari')} className="explore-card glass-card" variants={itemVariants} whileHover={{ y: -10 }} style={{ cursor: 'pointer' }}>
                        <Quote size={40} className="pink-text mb-3" />
                        <h3>Shayari</h3>
                        <p>Deep words for every emotion.</p>
                        <span className="access-label free">🔓 FREE</span>
                    </motion.div>

                    {/* Music — Login Required */}
                    <motion.div onClick={(e) => checkPremiumAccess(e, '/music')} className="explore-card glass-card" variants={itemVariants} whileHover={{ y: -10 }} style={{ cursor: 'pointer' }}>
                        <Play size={40} className="pink-text mb-3" />
                        <h3>Music</h3>
                        <p>Soulful melodies.</p>
                        <span className="access-label locked">🔒 LOGIN</span>
                    </motion.div>

                    {/* Podcast — Login Required */}
                    <motion.div onClick={(e) => checkPremiumAccess(e, '/podcasts')} className="explore-card glass-card" variants={itemVariants} whileHover={{ y: -10 }} style={{ cursor: 'pointer' }}>
                        <Mic size={40} className="pink-text mb-3" />
                        <h3>Podcast</h3>
                        <p>Inspiring stories.</p>
                        <span className="access-label locked">🔒 LOGIN</span>
                    </motion.div>

                    {/* E-Books — Login Required */}
                    <motion.div onClick={(e) => checkPremiumAccess(e, '/ebooks')} className="explore-card glass-card" variants={itemVariants} whileHover={{ y: -10 }} style={{ cursor: 'pointer' }}>
                        <Book size={40} className="pink-text mb-3" />
                        <h3>E-Books</h3>
                        <p>Literary gems.</p>
                        <span className="access-label locked">🔒 LOGIN</span>
                    </motion.div>
                </div>
            </section>

            {/* AD SPACE 1 */}
            <AdSpace type="horizontal" id="home-ad-1" />

            {/* SHAYARI SECTION — FREE for everyone, no login required */}
            <section id="shayari" className="featured-section container">
                <motion.div className="section-header" variants={itemVariants}>
                    <h2>Ansh Ebook <span className="text-gradient">Original Shayari</span> <span className="access-label free ml-3">🔓 FREE</span></h2>
                    <Link to="/shayari" className="view-all-link">View All <ArrowRight size={16} /></Link>
                </motion.div>
                <div className="grid-3">
                    {content?.latest_shayari?.slice(0, 6).map((item, idx) => (
                        <motion.div key={item?._id || idx} className="glass-card shayari-card-premium hover-tilt" variants={itemVariants}>
                            <div className="shayari-header">
                                <Quote className="quote-icon" size={28} />
                                <span className="card-timestamp"><Clock size={12} className="mr-1"/> {formatTimeAgo(item.createdAt)}</span>
                            </div>
                            <p className="shayari-text">{item?.content}</p>
                            <div className="shayari-action-bar">
                                <div className="action-group">
                                    <button className="action-btn like" onClick={() => handleShayariLike(item._id)}>
                                        <ThumbsUp size={18} /> <span>{item?.likes_count || 0}</span>
                                    </button>
                                    <button className="action-btn comment" onClick={() => setActiveCommentsId(activeCommentsId === item._id ? null : item._id)}>
                                        <MessageSquare size={18} /> <span>{item?.comments?.length || 0}</span>
                                    </button>
                                </div>
                                <div className="action-group">
                                    <button className="action-btn share" onClick={() => handleShayariShare(item)}>
                                        <Share2 size={18} />
                                    </button>
                                    <button className="action-btn whatsapp" onClick={() => handleShayariWhatsApp(item)}>
                                        <MessageCircle size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* PERSISTENT COMMENT SECTION */}
                            <AnimatePresence>
                                {activeCommentsId === item._id && (
                                    <motion.div 
                                        className="shayari-comments-section"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <div className="comments-list-mini">
                                            {item.comments?.map(c => (
                                                <div key={c._id} className="comment-item-mini">
                                                    <div className="comment-meta">
                                                        <span className="comment-user">{c.username}</span>
                                                        <span className="comment-time">{formatTimeAgo(c.createdAt)}</span>
                                                    </div>
                                                    {editingComment?.id === c._id ? (
                                                        <div className="edit-box-mini">
                                                            <textarea 
                                                                value={editingComment.text} 
                                                                onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                                                className="glass-input-sidebar"
                                                            />
                                                            <div className="edit-actions">
                                                                <button onClick={() => handleUpdateComment(item._id)} className="save-btn">SAVE</button>
                                                                <button onClick={() => setEditingComment(null)} className="cancel-btn">CANCEL</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="comment-text-mini">{c.text}</p>
                                                    )}
                                                    {user && (user.id === c.user_id || user._id === c.user_id) && !editingComment && (
                                                        <div className="comment-controls-mini">
                                                            <button onClick={() => setEditingComment({ id: c._id, text: c.text })}>Edit</button>
                                                            <button onClick={() => handleDeleteComment(item._id, c._id)}>Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="add-comment-mini">
                                            <textarea 
                                                placeholder="Write a comment..." 
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                className="glass-input-sidebar"
                                            />
                                            <button onClick={() => handleAddComment(item._id)} className="btn btn-primary btn-sm">POST</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* PREMIUM SECTION — Music, Podcast, E-Books (Login Required) */}
            <section id="premium" className="featured-section container">
                <motion.div className="section-header" variants={itemVariants}>
                    <h2>Ansh Ebook <span className="text-gradient">Premium Collection</span> <span className="access-label locked ml-3">🔒 LOGIN</span></h2>
                </motion.div>
                
                <div className="premium-tabs-v2">
                    <div id="music-section" className="premium-sub-section mb-5">
                        <h3 className="premium-sub-title mb-4"><PlayCircle size={20} className="mr-2"/> Music & Melodies</h3>
                        <div className="grid-3">
                            {content?.latest_music?.map((track, idx) => (
                                <motion.div key={track?._id || idx} className={`glass-card music-card-mini ${!user ? 'restricted-content' : ''}`} variants={itemVariants} style={{ cursor: 'pointer' }}>
                                    <div className="music-thumb" onClick={(e) => checkPremiumAccess(e, '/music')}>
                                        {(() => {
                                            const albumArt = track?.thumbnail || track?.cover_url || track?.thumbnail_url;
                                            const imgSrc = albumArt?.startsWith('/uploads') ? `${MEDIA_URL}${albumArt}` : (albumArt || '/default-music.png');
                                            return <img src={imgSrc} alt={`${track?.title} - Ansh Ebook Music`} loading="lazy" />;
                                        })()}
                                        {!user && <div className="lock-overlay"><div className="lock-circle">🔒</div></div>}
                                    </div>
                                    <div className="music-info" onClick={(e) => checkPremiumAccess(e, '/music')}>
                                        <h3>{track?.title}</h3>
                                        <p>{track?.artist || 'Original Mix'}</p>
                                    </div>
                                    {user && (
                                        <div className="play-overlay-mini">
                                            <button className="play-mini-btn" onClick={() => navigate('/music')}>
                                                <Play size={16} fill="white" /> Play
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div id="podcast-section" className="premium-sub-section mb-5">
                        <h3 className="premium-sub-title mb-4"><Mic size={20} className="mr-2"/> Podcasts</h3>
                        <div className="grid-2">
                            {content?.latest_podcasts?.map((pod, idx) => (
                                <motion.div key={pod?._id || idx} className={`glass-card podcast-card-mini ${!user ? 'restricted-content' : ''}`} onClick={(e) => checkPremiumAccess(e, '/podcasts')} variants={itemVariants} style={{ cursor: 'pointer' }}>
                                        <div className="podcast-thumb">
                                            {(() => {
                                                const albumArt = pod?.thumbnail || pod?.cover_url || pod?.thumbnail_url;
                                                const imgSrc = albumArt?.startsWith('/uploads') ? `${MEDIA_URL}${albumArt}` : (albumArt || '/default-podcast.png');
                                                return <img src={imgSrc} alt={`${pod?.title} - Ansh Ebook Podcast`} loading="lazy" />;
                                            })()}
                                            {!user && <div className="lock-overlay"><div className="lock-circle">🔒</div></div>}
                                        </div>
                                    <div className="podcast-info">
                                        <h3>{pod?.title}</h3>
                                        <p>{pod?.description?.substring(0, 80)}...</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div id="ebook-section" className="premium-sub-section">
                        <h3 className="premium-sub-title mb-4"><BookOpen size={20} className="mr-2"/> E-Books</h3>
                        <div className="grid-4">
                            {content?.featured_ebooks?.length > 0 ? (
                                content.featured_ebooks.map((book, idx) => (
                                    <motion.div key={book?._id || idx} className={`glass-card ebook-card-mini ${!user ? 'restricted-content' : ''}`} onClick={(e) => checkPremiumAccess(e, '/ebooks')} variants={itemVariants} style={{ cursor: 'pointer' }}>
                                        <div className="ebook-cover">
                                            {(() => {
                                                const albumArt = book?.cover_url || book?.thumbnail || book?.thumbnail_url;
                                                const imgSrc = albumArt?.startsWith('/uploads') ? `${MEDIA_URL}${albumArt}` : (albumArt || '/default-ebook.png');
                                                return <img src={imgSrc} alt={`${book?.title} - Ansh Ebook`} loading="lazy" />;
                                            })()}
                                            {!user && <div className="lock-overlay"><div className="lock-circle">🔒</div></div>}
                                        </div>
                                        <div className="ebook-info">
                                            <h3>{book?.title}</h3>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="glass-card text-center w-100 placeholder-card-premium" style={{ gridColumn: '1/-1', padding: '4rem 2rem' }}>
                                    <BookOpen size={48} className="pink-text mb-3" style={{ opacity: 0.3 }} />
                                    <h4 className="text-muted">Coming Soon</h4>
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>We are crafting some extraordinary literary gems. Stay tuned!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* AD SPACE 2 */}
            <AdSpace type="horizontal" id="home-ad-2" />

            {/* ABOUT & FAQ SECTION */}
            <section id="about" className="featured-section container">
                <div className="grid-2">
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">The Ansh Ebook Story</h2>
                        <p style={{ lineHeight: '1.8', opacity: 0.9 }}>
                            Ansh-Ebook is a digital sanctuary dedicated to the beauty of words and the profound impact of melodies. Founded by <strong>Ansh Sharma</strong>, we bring together high-quality original Shayari, soulful Music, and inspiring Podcasts.
                        </p>
                        <p className="mt-3" style={{ lineHeight: '1.8', opacity: 0.9 }}>
                            Every piece of content is crafted with passion and authenticity, ensuring a premium experience for every visitor.
                        </p>
                    </div>
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">FAQ</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {faqData.map(faq => (
                                <div key={faq.q}>
                                    <h4 className="pink-text mb-1" style={{fontSize: '1rem'}}>{faq.q}</h4>
                                    <p style={{fontSize: '0.9rem', opacity: 0.7}}>{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SUBSCRIBE SECTION */}
            <section id="subscribe" className="newsletter-banner container">
                <div className="glass-card shadow-neon newsletter-inner">
                    <h2>Join the <span className="pink-gradient-text">Inner Circle</span></h2>
                    <p>Subscribe for exclusive poetry and early access to original content.</p>
                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email..."
                            className="glass-input-sidebar"
                        />
                        <button type="submit" className="btn btn-primary shadow-neon">JOIN</button>
                    </form>
                    {subStatus.message && (
                        <p style={{ 
                            marginTop: '1rem', 
                            fontSize: '0.9rem',
                            color: subStatus.success ? '#4ade80' : '#f87171',
                            fontWeight: '500'
                        }}>
                            {subStatus.message}
                        </p>
                    )}
                </div>
            </section>

            {/* REVIEWS SECTION */}
            <section id="reviews" className="featured-section container mb-5">
                <div className="section-header text-center mb-5">
                    <h2 className="pink-gradient-text">Ansh Ebook <span style={{ color: 'var(--text-primary)' }}>Community Voices</span></h2>
                    <p className="opacity-70" style={{ color: 'var(--text-secondary)' }}>See what our premium circle members are saying about their experience.</p>
                </div>

                <div className="grid-2">
                    {/* Review Form */}
                    <div className="glass-card" style={{ padding: '2.5rem' }}>
                        <h3 className="pink-text mb-4">Share Your Experience</h3>
                        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label className="mb-2 block" style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>Rating</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star}
                                            size={24}
                                            fill={star <= reviewForm.rating ? "var(--color-pink)" : "none"}
                                            stroke={star <= reviewForm.rating ? "var(--color-pink)" : "var(--star-unselected)"}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Your Name/ID" 
                                className="glass-input-sidebar"
                                value={reviewForm.username}
                                onChange={(e) => setReviewForm({ ...reviewForm, username: e.target.value })}
                            />
                            <textarea 
                                placeholder="Write your review here... (Good/Bad/Amazing)"
                                className="glass-input-sidebar"
                                style={{ minHeight: '120px' }}
                                required
                                value={reviewForm.content}
                                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                            ></textarea>
                            <button 
                                type="submit" 
                                disabled={isReviewing}
                                className="btn btn-primary shadow-neon w-100"
                            >
                                {isReviewing ? 'SUBMITTING...' : 'POST REVIEW'}
                            </button>
                        </form>
                    </div>

                    {/* Review List */}
                    <div className="reviews-list" style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '10px' }}>
                        <AnimatePresence>
                            {reviews.map((rev) => (
                                <motion.div 
                                    key={rev._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass-card"
                                    style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-pink)' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                                        <div>
                                            <h4 className="mb-1" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{rev.username}</h4>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < rev.rating ? "var(--color-pink)" : "none"} stroke="var(--color-pink)" />
                                                ))}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="mb-3" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)', opacity: 0.9 }}>
                                        "{rev.content}"
                                    </p>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button 
                                            className="reaction-btn" 
                                            onClick={() => handleReviewReaction(rev._id, 'like')}
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: user && rev.likedBy?.includes(user.id || user._id) ? 'var(--color-pink)' : 'var(--text-primary)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '5px', 
                                                cursor: 'pointer', 
                                                opacity: user && rev.likedBy?.includes(user.id || user._id) ? 1 : 0.7 
                                            }}
                                        >
                                            <ThumbsUp size={16} fill={user && rev.likedBy?.includes(user.id || user._id) ? "var(--color-pink)" : "none"} /> {rev.likes}
                                        </button>
                                        <button 
                                            className="reaction-btn" 
                                            onClick={() => handleReviewReaction(rev._id, 'dislike')}
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: user && rev.dislikedBy?.includes(user.id || user._id) ? '#ff4b2b' : 'var(--text-primary)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '5px', 
                                                cursor: 'pointer', 
                                                opacity: user && rev.dislikedBy?.includes(user.id || user._id) ? 1 : 0.7 
                                            }}
                                        >
                                            <ThumbsDown size={16} fill={user && rev.dislikedBy?.includes(user.id || user._id) ? "#ff4b2b" : "none"} /> {rev.dislikes}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {reviews.length === 0 && <p className="text-center opacity-40 mt-5">No reviews yet. Be the first!</p>}
                    </div>
                </div>
            </section>

            {/* CONNECT & CONTACT SECTION */}
            <section id="connect" className="featured-section container mb-5">
                <div className="grid-2">
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">Let's Connect</h2>
                        <div className="mb-4">
                            <h4 className="pink-text mb-1">Email</h4>
                            <a href="mailto:anshbgmi24@gmail.com" style={{color:'var(--text-primary)', textDecoration:'none'}}>anshbgmi24@gmail.com</a>
                        </div>
                        <div>
                            <h4 className="pink-text mb-3">Follow Us</h4>
                            <div className="drawer-socials" style={{ justifyContent: 'flex-start', padding: 0, border: 'none', gap: '20px' }}>
                                <a href="https://www.instagram.com/_.unknown_shadow?igsh=MXczMmZ2a3N2cGs0Mw==" target="_blank" rel="noopener noreferrer"><Instagram size={28} /></a>
                                <a href="https://youtube.com/@vibexmusicx?si=-h93up_MiovLiyS8" target="_blank" rel="noopener noreferrer"><Youtube size={28} /></a>
                                <a href="https://whatsapp.com/channel/0029VaFlezo3QxSA5zNTQF0b" target="_blank" rel="noopener noreferrer"><MessageCircle size={28} /></a>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">Send a Message</h2>
                        <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" name="user_name" required placeholder="Your Name" className="glass-input-sidebar" />
                            <input type="email" name="user_email" required placeholder="Your Email" className="glass-input-sidebar" />
                            <textarea name="message" required placeholder="Your Message" className="glass-input-sidebar" style={{ minHeight: '100px' }}></textarea>
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary shadow-neon w-100">
                                {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                            </button>
                            {contactStatus.message && <p className={`mt-2 text-center ${contactStatus.success ? 'text-success' : 'text-danger'}`}>{contactStatus.message}</p>}
                        </form>
                    </div>
                </div>
            </section>

        </motion.div>
    );
};

export default Home;
