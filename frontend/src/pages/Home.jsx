import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Book, Mic, Quote, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchHomeContent } from '../api';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Home.css';

const Home = () => {
    const [content, setContent] = useState({ latest_shayari: [], latest_podcasts: [], featured_ebooks: [] });
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    const [email, setEmail] = useState('');
    const [subStatus, setSubStatus] = useState({ message: '', success: false });

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
                const { data } = await fetchHomeContent();
                setContent(data);
            } catch (err) {
                console.error('Error fetching home content:', err);
            } finally {
                setLoading(false);
            }
        };
        getHomeData();
    }, []);

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return null;

    return (
        <motion.div 
            className="home-page"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Home - Premium Poetry & Art" 
                description="Welcome to The Alfaz-E-Diaries. Explore original premium Hindi Shayari, soulful Music, Podcasts, and E-Books."
            />
            <section className="hero-section">
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <div className="bg-blob blob-3"></div>
                
                <motion.div 
                    className="hero-content"
                    variants={itemVariants}
                >
                    <motion.h1 className="hero-welcome-v2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        Welcome to
                    </motion.h1>
                    <motion.h2 className="hero-main-branding">
                        The <span className="pink-gradient-text">Alfaz-E-Diaries</span>
                    </motion.h2>
                    <motion.p className="hero-description-v2">
                        A digital sanctuary where words find meaning, melodies touch the soul, and stories inspire greatness.
                    </motion.p>
                    <div className="hero-actions-v2">
                        <Link to="/shayari" className="btn btn-primary btn-lg shadow-neon">
                            READ SHAYARI
                        </Link>
                        {user?.role === 'admin' ? (
                            <Link to="/admin" className="btn btn-warning btn-lg ml-3 shadow-glow">
                                GOTO DASHBOARD
                            </Link>
                        ) : (
                            <Link to="/music" className="btn btn-dark-outline btn-lg ml-3">
                                EXPLORE MUSIC
                            </Link>
                        )}
                    </div>
                </motion.div>
            </section>

            {content && (
                <motion.div className="content-reveal" variants={containerVariants}>
                    {/* Latest Shayari */}
                    <section className="featured-section container">
                        <motion.div className="section-header" variants={itemVariants}>
                            <h2>Heartfelt <span className="text-gradient">Shayari</span></h2>
                            <Link to="/shayari" className="view-all-link">View All <ArrowRight size={16} /></Link>
                        </motion.div>
                        <div className="grid-3">
                            {content?.latest_shayari && Array.isArray(content.latest_shayari) && content.latest_shayari.length > 0 ? (
                                content.latest_shayari.map((item, idx) => (
                                    <motion.div 
                                        key={item?._id || idx} 
                                        className="glass-card shayari-card hover-tilt"
                                        variants={itemVariants}
                                        whileHover={{ y: -10, scale: 1.02 }}
                                    >
                                        <Quote className="quote-icon pink-text" size={32} />
                                        <p className="shayari-text">{item?.content || 'Words failing to load...'}</p>
                                        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', opacity: 0.7 }}>
                                            <span>{item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}</span>
                                            <button className="like-btn" style={{ background: 'transparent', border: 'none', color: 'white' }}>❤️ {item?.likes_count || 0}</button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-muted text-center" style={{gridColumn: '1/-1'}}>No Shayari posted yet.</p>
                            )}
                        </div>
                    </section>

                    <AdSpace type="horizontal" id="home-ad-1" />

                    {/* Latest Podcasts */}
                    <section className="featured-section container">
                        <motion.div className="section-header" variants={itemVariants}>
                            <h2>Inspiring <span className="text-gradient">Podcasts</span></h2>
                            <Link to="/podcasts" className="view-all-link">View All <ArrowRight size={16} /></Link>
                        </motion.div>
                        <div className="grid-2">
                            {content?.latest_podcasts && Array.isArray(content.latest_podcasts) && content.latest_podcasts.length > 0 ? (
                                content.latest_podcasts.map((pod, idx) => (
                                    <motion.div 
                                        key={pod?._id || idx} 
                                        className="glass-card podcast-card-mini hover-glow"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.03 }}
                                    >
                                        <div className="podcast-thumb">
                                            <img src={pod?.thumbnail_url || pod?.thumbnail || '/default-podcast.jpg'} alt={pod?.title || 'Podcast'} />
                                            <div className="play-overlay"><Play fill="white" size={30}/></div>
                                        </div>
                                        <div className="podcast-info">
                                            <h3>{pod?.title || 'Untitled Podcast'}</h3>
                                            <p>{pod?.description?.substring(0, 100) || 'Listen to this amazing podcast.'}...</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-muted text-center" style={{gridColumn: '1/-1'}}>No Podcasts posted yet.</p>
                            )}
                        </div>
                    </section>

                    {/* Premium Newsletter Section */}
                    <section className="newsletter-banner container" style={{ margin: '4rem auto' }}>
                        <div className="glass-card premium-newsletter shadow-neon" style={{ 
                            padding: '4rem 2rem', 
                            textAlign: 'center', 
                            background: 'linear-gradient(135deg, rgba(25,25,25,0.7) 0%, rgba(255,20,147,0.1) 100%)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div className="bg-blob" style={{ width: '200px', height: '200px', top: '-100px', right: '-100px', opacity: 0.2 }}></div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Join the <span className="pink-gradient-text">Inner Circle</span></h2>
                            <p style={{ maxWidth: '600px', margin: '0 auto 2.5rem', opacity: 0.8, fontSize: '1.1rem' }}>
                                Subscribe to receive exclusive poetry, early access to podcasts, and soulful updates directly from us.
                            </p>
                            <form className="newsletter-form-home" onSubmit={handleSubscribe} style={{ 
                                display: 'flex', 
                                maxWidth: '500px', 
                                margin: '0 auto', 
                                gap: '10px',
                                flexWrap: 'wrap',
                                justifyContent: 'center'
                            }}>
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address" 
                                    className="glass-input-sidebar" 
                                    style={{ flex: 1, minWidth: '250px', padding: '1rem', borderRadius: '12px' }}
                                />
                                <button type="submit" className="btn btn-primary shadow-neon" style={{ padding: '0 2.5rem', borderRadius: '12px', height: '54px' }}>
                                    SUBSCRIBE
                                </button>
                            </form>
                            {subStatus.message && (
                                <p className={`mt-3 ${subStatus.success ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                    {subStatus.message}
                                </p>
                            )}
                            <p className="mt-4" style={{ fontSize: '0.85rem', opacity: 0.5 }}>No spam. Only deep melodies and beautiful words.</p>
                        </div>
                    </section>

                    {/* Featured Ebooks */}
                    <section className="featured-section container">
                        <motion.div className="section-header" variants={itemVariants}>
                            <h2>Featured <span className="text-gradient">E-Books</span></h2>
                            <Link to="/ebooks" className="view-all-link">View All <ArrowRight size={16} /></Link>
                        </motion.div>
                        <div className="grid-4">
                            {content?.featured_ebooks && Array.isArray(content.featured_ebooks) && content.featured_ebooks.length > 0 ? (
                                content.featured_ebooks.map((book, idx) => (
                                    <motion.div 
                                        key={book?._id || idx} 
                                        className="glass-card ebook-card-mini hover-tilt"
                                        variants={itemVariants}
                                        whileHover={{ y: -10 }}
                                    >
                                        <div className="ebook-cover">
                                            <img src={book?.cover_url || book?.thumbnail || '/default-ebook.jpg'} alt={book?.title || 'E-book'} />
                                        </div>
                                        <div className="ebook-info">
                                            <h3>{book?.title || 'Untitled Book'}</h3>
                                            <p className="price-tag">{book?.price === 0 || !book?.price ? 'FREE' : `₹${book.price}`}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-muted text-center" style={{gridColumn: '1/-1'}}>No E-Books posted yet.</p>
                            )}
                        </div>
                    </section>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Home;
