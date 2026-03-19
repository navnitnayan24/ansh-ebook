import React, { useState, useEffect } from 'react';
import { Play, Mic, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType } from '../api';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Podcasts.css';

const Podcasts = () => {
    const [podcasts, setPodcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const loadPodcasts = async () => {
            try {
                const { data } = await fetchContentByType('podcasts');
                setPodcasts(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadPodcasts();
    }, []);

    const categories = ['All', ...new Set(podcasts.map(p => p.category || 'Inspiration'))];

    const filteredPodcasts = Array.isArray(podcasts) ? podcasts.filter(pod => {
        const matchesSearch = (pod.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (pod.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || pod.category === activeCategory;
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
        <motion.div 
            className="podcasts-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Original Podcasts & Stories" 
                description="Listen to premium original podcasts, stories, and reflections. Deep dives into life, art, and creativity." 
            />
            <div className="page-header mb-4">
                <Link to="/" className="back-btn btn btn-outline btn-sm btn-pill">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
            </div>

            <section className="section-hero-v2">
                <div className="section-header-centered animate-slide-in-top">
                    <motion.h1 className="centered-title" variants={itemVariants}>
                        Inspiring <span className="pink-gradient-text">Podcasts</span>
                    </motion.h1>
                    <motion.p className="centered-subtitle" variants={itemVariants}>
                        Deep conversations, motivational talks, and stories that matter.
                    </motion.p>
                </div>
            </section>

            <div className="search-filter-controls mb-5">
                <div className="search-box-premium glass-card mb-4" style={{ maxWidth: '600px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', padding: '0.5rem 1.5rem', borderRadius: '50px' }}>
                    <Mic size={20} className="pink-text mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search episodes, topics, or stories..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.8rem 0', width: '100%', outline: 'none' }}
                    />
                </div>

                <div className="filter-chips" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            className={`pill-btn ${activeCategory === cat ? 'active shadow-neon' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                            style={{ 
                                padding: '0.6rem 1.5rem', 
                                borderRadius: '50px', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: activeCategory === cat ? 'var(--pink-primary)' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
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
                                            <img src={pod.thumbnail || pod.thumbnail_url || '/default-podcast.jpg'} alt={pod.title} />
                                            <div className="play-overlay-large">
                                                <Play fill="white" size={40} />
                                            </div>
                                        </div>
                                        <div className="podcast-details">
                                            <div className="podcast-meta">
                                                <span className="pill-small">{pod.category || 'EPISODE'}</span>
                                                <span className="date-small">{pod.createdAt ? new Date(pod.createdAt).toLocaleDateString() : 'New'}</span>
                                            </div>
                                            <h3>{pod.title}</h3>
                                            <p className="podcast-desc">{pod.description}</p>
                                            <div className="podcast-footer mt-auto">
                                                <audio controls className="custom-audio">
                                                    <source src={pod.file_url} type="audio/mpeg" />
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
