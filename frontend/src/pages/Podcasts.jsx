import React, { useState, useEffect } from 'react';
import { Mic, Play, Pause, Headphones, Search, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType } from '../api';
import API from '../api';
import { MEDIA_URL } from '../config';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Podcasts.css';

const Podcasts = () => {
    const [podcasts, setPodcasts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [podRes, catRes] = await Promise.all([
                    fetchContentByType('podcasts'),
                    fetchCategories('podcasts')
                ]);
                setPodcasts(podRes.data);
                setAllCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleLike = async (id) => {
        try {
            setPodcasts(prev => prev.map(p => 
                p._id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
            ));
            const { data } = await API.post(`/podcast/${id}/like`);
            setPodcasts(prev => prev.map(p => 
                p._id === id ? { ...p, likes_count: data.likes_count } : p
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const categories = ['All', ...new Set(podcasts.map(p => p.category_id?.name || 'General'))];

    const filteredPodcasts = Array.isArray(podcasts) ? podcasts.filter(pod => {
        const matchesSearch = (pod.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (pod.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || pod.category_id?.name === activeCategory;
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
        <motion.div className="podcasts-page" initial="hidden" animate="visible" variants={containerVariants}>
            <SEO title="Original Podcasts | Ansh Ebook" description="Listen to soulful and inspiring podcasts by Ansh Sharma on Ansh Ebook." />
            
            <div className="podcasts-hero">
                <div className="hero-content container">
                    <motion.div variants={itemVariants}>
                        <Link to="/" className="back-link"><ArrowLeft size={16}/> Back to Home</Link>
                        <h1 className="hero-title mt-3">Soulful <span className="text-gradient">Podcasts</span></h1>
                        <p className="hero-subtitle">Kalam Se Dil Tak - Original voices, authentic stories.</p>
                    </motion.div>
                    
                    <motion.div className="hero-search-box" variants={itemVariants}>
                        <div className="glass-search">
                            <Search className="search-icon" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search episodes, stories..." 
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
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: activeCategory === cat ? 'var(--pink-primary)' : 'rgba(255,255,255,0.05)',
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
                        {filteredPodcasts.length > 0 ? (
                            <div className="podcast-list">
                                {filteredPodcasts.map((pod) => (
                                    <motion.div 
                                        key={pod._id} 
                                        className="glass-card podcast-card-premium"
                                        variants={itemVariants}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{ y: -5, scale: 1.01 }}
                                    >
                                        <div className="podcast-thumb">
                                            <img src={pod.thumbnail?.startsWith('/uploads') ? `${MEDIA_URL}${pod.thumbnail}` : (pod.thumbnail || pod.thumbnail_url || '/default-podcast.png')} alt={`${pod.title} - Ansh Ebook Podcast Episode`} />
                                            <div className="play-overlay-large">
                                                <Play fill="white" size={40} />
                                            </div>
                                        </div>
                                        <div className="podcast-details">
                                            <div className="podcast-meta">
                                                <span className="pill-small">{pod.category_id?.name || 'EPISODE'}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span className="date-small">{pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : 'New'}</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleLike(pod._id); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
                                                    >
                                                        <Heart size={16} fill={pod.liked_by_user ? "var(--accent)" : "transparent"} /> {pod.likes_count || 0}
                                                    </button>
                                                </div>
                                            </div>
                                            <h3>{pod.title}</h3>
                                            <p className="podcast-desc">{pod.description}</p>
                                            <div className="podcast-footer mt-auto">
                                                <audio controls className="custom-audio">
                                                    <source src={pod.file_url?.startsWith('/uploads') ? `${MEDIA_URL}${pod.file_url}` : pod.file_url} type="audio/mpeg" />
                                                </audio>
                                                <button className="btn btn-primary btn-pill shadow-neon">LISTEN ON WEB</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div className="empty-state-centered glass-card" variants={itemVariants} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Mic size={60} className="empty-icon-pink" style={{opacity: 0.1}} />
                                <h3>No Matches Found</h3>
                                <p>Try searching for a different topic or episode title.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            <AdSpace type="horizontal" id="podcasts-footer-ad" />
        </motion.div>
    );
};

export default Podcasts;
