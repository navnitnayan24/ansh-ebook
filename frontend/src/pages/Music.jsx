import React, { useState, useEffect } from 'react';
import { Search, Play, Pause, Headphones, Music as MusicIcon, Heart, ArrowLeft, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories } from '../api';
import { MEDIA_URL } from '../config';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Music.css';

const Music = () => {
    const [tracks, setTracks] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [playingTrack, setPlayingTrack] = useState(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await fetchCategories('music');
                setAllCategories(data);
            } catch (err) {
                console.error(err);
            }
        };
        loadCategories();
        return () => {};
    }, []);

    useEffect(() => {
        const loadTracks = async () => {
            setLoading(true);
            try {
                const { data } = await fetchContentByType('music', selectedCategory === 'All' ? '' : selectedCategory, query);
                setTracks(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadTracks();
    }, [query, selectedCategory]);

    const toggleLike = async (id) => {
        try {
            const { API } = await import('../api');
            const { data } = await API.post(`music/${id}/like`);
            setTracks(tracks.map(t => t._id === id ? { ...t, likes_count: data.likes_count } : t));
        } catch (err) {
            console.error(err);
        }
    };

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

            <section className="section-hero-v2">
                <div className="section-header-centered animate-slide-in-top">
                    <motion.div variants={itemVariants} style={{marginBottom: '1rem'}}>
                        <Link to="/" className="back-link pink-text" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 'bold'}}>
                            <ArrowLeft size={20} /> Back to Home
                        </Link>
                    </motion.div>
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
                <div className="search-bar-centered mb-4">
                    <div className="glass-card search-input-wrapper-v2">
                        <Search size={20} className="search-icon-v2" />
                        <input 
                            type="text" 
                            placeholder="Search by track name or artist..." 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)} 
                            className="search-input-v2"
                        />
                    </div>
                </div>
                <div className="pill-container-centered">
                    <button 
                        className={`music-pill-v2 ${!selectedCategory ? 'active' : ''}`} 
                        onClick={() => setSelectedCategory('')}
                    >
                        All Music
                    </button>
                    {allCategories && allCategories.length > 0 && allCategories.map(cat => (
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
                                            <img src={track.thumbnail?.startsWith('/uploads') ? `${MEDIA_URL}${track.thumbnail}` : (track.thumbnail || track.thumbnail_url || '/default-music.png')} alt={`${track.title} - Music by Ansh Ebook`} />
                                            <div className="cover-overlay">
                                                <button className="play-trigger" onClick={() => togglePlay(track)}>
                                                    {playingTrack?._id === track._id ? <Pause fill="white" size={32} /> : <Play fill="white" size={32} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="track-details">
                                            <h3>{track.title}</h3>
                                            <div className="track-meta-bottom">
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <p className="artist-label">{track.artist}</p>
                                                    <span className="badge" style={{ fontSize: '0.65rem', alignSelf: 'flex-start', marginTop: '4px' }}>{track.category_id?.name || 'MUSIC'}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="date-tag-mini">{new Date(track.createdAt).toLocaleDateString()}</span>
                                                    <button 
                                                        onClick={() => toggleLike(track._id)}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--pink-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem' }}
                                                    >
                                                        <Heart size={14} fill={track.likes_count > 0 ? "var(--pink-primary)" : "transparent"} /> {track.likes_count || 0}
                                                    </button>
                                                </div>
                                            </div>
                                            {playingTrack?._id === track._id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="player-mount mt-3"
                                                >
                                                    <audio 
                                                        key={track.file_url}
                                                        autoPlay 
                                                        controls 
                                                        className="compact-audio-player"
                                                        src={track.file_url?.startsWith('/uploads') ? `${MEDIA_URL}${track.file_url}` : track.file_url}
                                                    >
                                                        Your browser does not support the audio element.
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
