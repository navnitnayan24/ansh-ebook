import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Search, Heart, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories } from '../api';
import API from '../api';
import { MEDIA_URL } from '../config';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Podcasts.css'; // Reusing styles for now, but will customize

const News = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // We still call 'podcasts' endpoint but treat it as news
                const [newsRes, catRes] = await Promise.all([
                    fetchContentByType('podcasts'),
                    fetchCategories('podcasts')
                ]);
                setNewsItems(newsRes.data);
                setAllCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => {};
    }, []);

    const toggleLike = async (id) => {
        try {
            setNewsItems(prev => prev.map(p => 
                p._id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
            ));
            const { data } = await API.post(`/podcast/${id}/like`);
            setNewsItems(prev => prev.map(p => 
                p._id === id ? { ...p, likes_count: data.likes_count } : p
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const categories = ['All', ...new Set(newsItems.map(p => p.category_id?.name || 'General'))];

    const filteredNews = Array.isArray(newsItems) ? newsItems.filter(item => {
        const matchesSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category_id?.name === activeCategory;
        return matchesSearch && matchesCategory;
    }) : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div className="podcasts-page news-page" initial="hidden" animate="visible" variants={containerVariants}>
            <SEO title="Ansh Ebook - Trending News & Blogs" description="Stay updated with the latest news, blogs, and insights on Ansh Ebook. Your daily dose of inspiration and information." />
            
            <div className="podcasts-hero news-hero">
                <div className="hero-content container">
                    <motion.div variants={itemVariants}>
                        <Link to="/" className="back-link pink-text" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1rem', textDecoration: 'none', fontWeight: 'bold'}}>
                            <ArrowLeft size={20} /> Back to Home
                        </Link>
                        <h1 className="hero-title mt-3">Ansh <span className="text-gradient">Gazette</span></h1>
                        <p className="hero-subtitle">Latest news, blogs, and soulful insights by Ansh Sharma.</p>
                    </motion.div>
                    
                    <motion.div className="hero-search-box" variants={itemVariants}>
                        <div className="glass-search">
                            <Search className="search-icon" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search news or topics..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="category-bar-sticky">
                <div className="category-scroll container">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                            style={{
                                padding: '0.6rem 1.5rem',
                                borderRadius: '30px',
                                border: '1px solid var(--glass-border)',
                                background: activeCategory === cat ? 'var(--pink-primary)' : 'var(--bg-glass-light)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                flexShrink: 0
                            }}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loader-container"><div className="loader"></div></div>
            ) : (
                <motion.div className="podcast-wrapper" variants={containerVariants} layout>
                    <AnimatePresence mode='popLayout'>
                        {filteredNews.length > 0 ? (
                            <div className="podcast-list news-list">
                                {filteredNews.map((item, index) => (
                                    <React.Fragment key={item._id}>
                                        <motion.div 
                                            className="glass-card podcast-card-premium news-card"
                                            variants={itemVariants}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            whileHover={{ y: -5, scale: 1.01 }}
                                        >
                                            <div className="podcast-thumb news-thumb">
                                                {(() => {
                                                    const albumArt = item.thumbnail_url || item.thumbnail || item.cover_url;
                                                    const imgSrc = albumArt?.startsWith('/uploads') ? `${MEDIA_URL}${albumArt}` : (albumArt || '/default-news.png');
                                                    return <img src={imgSrc} alt={`${item.title} - Ansh Gazette news`} />;
                                                })()}
                                            </div>
                                            <div className="podcast-details news-details">
                                                <div className="podcast-meta">
                                                    <span className="pill-small">{item.category_id?.name || 'NEWS'}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <span className="date-small" style={{display:'flex', alignItems:'center', gap: '4px'}}>
                                                            <Calendar size={12} /> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'New'}
                                                        </span>
                                                        <span className="date-small" style={{display:'flex', alignItems:'center', gap: '4px'}}>
                                                            <Clock size={12} /> {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3>{item.title}</h3>
                                                <p className="podcast-desc">{item.description}</p>
                                                <div className="podcast-footer mt-auto" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleLike(item._id); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                                                    >
                                                        <Heart size={18} fill={item.liked_by_user ? "var(--accent)" : "transparent"} /> {item.likes_count || 0}
                                                    </button>
                                                    
                                                    <Link 
                                                        to={`/news/${item._id}`}
                                                        className="btn btn-primary btn-xs btn-pill shadow-neon"
                                                        style={{ fontSize: '0.7rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        READ MORE <ExternalLink size={12} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                        {(index + 1) % 3 === 0 && (
                                            <div className="news-ad-wrapper" style={{ gridColumn: '1 / -1', margin: '1rem 0' }}>
                                                <AdSpace type="horizontal" id={`news-ad-${index}`} />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <motion.div className="empty-state-centered glass-card" variants={itemVariants} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Newspaper size={60} className="empty-icon-pink" style={{opacity: 0.1}} />
                                <h3>No News Found</h3>
                                <p>Try searching for a different headline or topic.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            <AdSpace type="horizontal" id="podcasts-footer-ad" />
        </motion.div>
    );
};

export default News;
