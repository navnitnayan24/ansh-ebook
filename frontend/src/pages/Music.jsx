import React, { useState, useEffect } from 'react';
import { Search, Play, Pause, ArrowLeft, Headphones, Youtube, Facebook, Instagram, Linkedin, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories } from '../api';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Music.css';

const Music = () => {
    const [tracks, setTracks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [playingTrack, setPlayingTrack] = useState(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await fetchCategories('music');
                setCategories(data);
            } catch (err) {
                console.error(err);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadTracks = async () => {
            setLoading(true);
            try {
                const { data } = await fetchContentByType('music', {
                    q: query,
                    category: selectedCategory
                });
                setTracks(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadTracks();
    }, [query, selectedCategory]);

    const togglePlay = (track) => {
        if (playingTrack?._id === track._id) {
            setPlayingTrack(null);
        } else {
            setPlayingTrack(track);
        }
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
            className="music-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Soulful Music & Melodies" 
                description="Experience premium original music and soundscapes. Soulful tunes for relaxation, meditation, and inspiration." 
            />
            <div className="page-header mb-4">
                <Link to="/" className="back-btn btn btn-outline btn-sm btn-pill">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
            </div>

            <section className="section-hero-v2">
                <div className="section-header-centered animate-slide-in-top">
                    <motion.h1 className="centered-title" variants={itemVariants}>
                        Music <span className="pink-gradient-text">Library</span>
                    </motion.h1>
                    <motion.p className="centered-subtitle" variants={itemVariants}>
                        Original tracks and soulful melodies composed with passion.
                    </motion.p>
                    <motion.div 
                        className="music-youtube-integration mt-4" 
                        variants={itemVariants}
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <a href="https://youtube.com/@vibexmusicx?si=-h93up_MiovLiyS8" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm btn-pill shadow-neon d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} /> VIBEX MUSIC
                        </a>
                        <a href="https://youtube.com/@vibexmusicx2.0?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="btn btn-dark-outline btn-sm btn-pill d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} color="#FF0000" /> VIBEX 2.0
                        </a>
                        <a href="https://youtube.com/@vibexmusicx3.0?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="btn btn-dark-outline btn-sm btn-pill d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} color="#FF0000" /> VIBEX 3.0
                        </a>
                        <a href="https://youtube.com/@ToonXIndia-24?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="btn btn-dark-outline btn-sm btn-pill d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} color="#FF0000" /> TOONX INDIA
                        </a>
                    </motion.div>
                </div>
            </section>

            <motion.div className="music-filter-wrapper mb-5" variants={itemVariants}>
                <div className="pill-container-centered">
                    <button 
                        className={`music-pill-v2 ${!selectedCategory ? 'active' : ''}`} 
                        onClick={() => setSelectedCategory('')}
                    >
                        All Music
                    </button>
                    {categories && categories.length > 0 && categories.map(cat => (
                        <button 
                            key={cat._id} 
                            className={`music-pill-v2 ${selectedCategory === cat._id ? 'active' : ''}`} 
                            onClick={() => setSelectedCategory(cat._id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </motion.div>
            
            <AdSpace type="horizontal" id="music-mid-ad" />

            {loading ? (
                <div className="loader-container"><div className="loader"></div></div>
            ) : (
                <motion.div className="music-content-grid" variants={containerVariants}>
                    <AnimatePresence mode='wait'>
                        {Array.isArray(tracks) && tracks.length > 0 ? (
                            <div className="tracks-grid">
                                {tracks.map((track) => (
                                    <motion.div 
                                        key={track._id} 
                                        className="glass-card music-card-main"
                                        variants={itemVariants}
                                        whileHover={{ y: -10, scale: 1.02 }}
                                    >
                                        <div className="card-cover-area">
                                            <img src={track.cover_url || '/default-music.jpg'} alt={track.title} />
                                            <div className="cover-overlay">
                                                <button className="play-trigger" onClick={() => togglePlay(track)}>
                                                    {playingTrack?._id === track._id ? <Pause fill="white" size={32} /> : <Play fill="white" size={32} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="track-details">
                                            <h3>{track.title}</h3>
                                            <p className="artist-label">{track.artist}</p>
                                            {playingTrack?._id === track._id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="player-mount mt-3"
                                                >
                                                    <audio autoPlay controls className="compact-audio-player">
                                                        <source src={track.file_url} type="audio/mpeg" />
                                                    </audio>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div className="empty-state-centered glass-card" variants={itemVariants}>
                                <Headphones className="empty-icon-pink" size={60} style={{opacity: 0.1}} />
                                <h3>No Tracks Found</h3>
                                <p>No music uploaded matching this category yet.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            <AdSpace type="horizontal" id="music-footer-ad" />
        </motion.div>
    );
};

export default Music;
