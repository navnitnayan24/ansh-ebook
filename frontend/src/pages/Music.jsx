import React, { useState, useEffect } from 'react';
import { Search, Play, Pause, Headphones, Music as MusicIcon, Heart, ArrowLeft, Youtube, Plus, ListMusic, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories, fetchUserLibrary, toggleMusicFavorite, createMusicPlaylist, addToMusicPlaylist } from '../api';
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
    const [userLibrary, setUserLibrary] = useState({ favorites: [], playlists: [] });
    const [showLibrary, setShowLibrary] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const currentUser = (() => {
        try {
            const saved = localStorage.getItem('user');
            return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
        } catch { return null; }
    })();

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await fetchCategories('music');
                setAllCategories(data);
            } catch (err) {
                console.error(err);
            }
        };

        const loadLibrary = async () => {
            if (!currentUser) return;
            try {
                const { data } = await fetchUserLibrary();
                setUserLibrary(data);
            } catch (err) {
                console.error("Library fetch error:", err);
            }
        };

        loadCategories();
        loadLibrary();
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

    const toggleFavorite = async (id) => {
        if (!currentUser) {
            alert('Please login to favorite tracks!');
            return;
        }
        try {
            const { data } = await toggleMusicFavorite(id);
            setUserLibrary(prev => ({ ...prev, favorites: data.favorites }));
            // Also update likes_count in the tracks list for real-time feedback
            setTracks(prev => prev.map(t => t._id === id ? { ...t, likes_count: data.likes_count } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        try {
            const { data } = await createMusicPlaylist(newPlaylistName);
            setUserLibrary(prev => ({ ...prev, playlists: data.playlists }));
            setNewPlaylistName('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddToPlaylist = async (playlistId) => {
        if (!selectedSongForPlaylist) return;
        try {
            const { data } = await addToMusicPlaylist(playlistId, selectedSongForPlaylist);
            setUserLibrary(prev => ({ ...prev, playlists: data.playlists }));
            setShowPlaylistModal(false);
            setSelectedSongForPlaylist(null);
            alert('Added to playlist!');
        } catch (err) {
            console.error(err);
        }
    };

    const isFavorite = (id) => userLibrary.favorites.some(favId => (favId._id || favId) === id);

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
                title="Ansh Ebook - Soulful Music & Melodies" 
                description="Experience soulful melodies and original tracks on Ansh Ebook. Premium soundscapes for relaxation, inspiration, and meditation." 
            />

            <section className="section-hero-v2">
                <div className="section-header-centered animate-slide-in-top">
                    <motion.div variants={itemVariants} style={{marginBottom: '1rem'}}>
                        <Link to="/" className="back-link pink-text" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 'bold'}}>
                            <ArrowLeft size={20} /> Back to Home
                        </Link>
                    </motion.div>
                    <motion.h1 className="centered-title" variants={itemVariants}>
                        Ansh Ebook <span className="pink-gradient-text">Music Library</span>
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
                            <Youtube size={18} /> VIBEX MUSICX
                        </a>
                        <a href="https://youtube.com/@vibexmusicx2.0?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="btn btn-dark-outline btn-sm btn-pill d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} color="#FF0000" /> VIBEX MUSICX 2.0
                        </a>
                        <a href="https://youtube.com/@vibexmusicx3.0?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="btn btn-dark-outline btn-sm btn-pill d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} color="#FF0000" /> VIBEX MUSICX 3.0
                        </a>
                        <a href="https://youtube.com/@ToonXIndia-24?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="btn btn-dark-outline btn-sm btn-pill d-flex align-items-center" style={{ gap: '8px', padding: '0.8rem 1.5rem', textDecoration: 'none' }}>
                            <Youtube size={18} color="#FF0000" /> TOONXINDIA-24
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
                    {currentUser && (
                        <button 
                            className={`music-pill-v2 ${showLibrary ? 'active' : ''}`} 
                            onClick={() => setShowLibrary(!showLibrary)}
                            style={{ background: showLibrary ? 'var(--gradient-primary)' : 'var(--bg-glass-light)', color: showLibrary ? 'white' : 'var(--text-primary)', border: '1px solid var(--pink-primary)' }}
                        >
                            <Bookmark size={14} style={{ marginRight: '5px' }} /> MY LIBRARY
                        </button>
                    )}
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
                                            {(() => {
                                                const albumArt = track.thumbnail || track.cover_url || track.thumbnail_url;
                                                let rawUrl = track.imageUrl || albumArt;
                                                if (rawUrl && rawUrl.includes('\\uploads\\')) rawUrl = '/uploads/' + rawUrl.split('\\uploads\\').pop();
                                                else if (rawUrl && rawUrl.includes('/uploads/')) rawUrl = '/uploads/' + rawUrl.split('/uploads/').pop();
                                                
                                                const imageUrl = rawUrl?.startsWith('/uploads') ? `${MEDIA_URL}${rawUrl}` : (rawUrl || '/default-music.png');
                                                return <img src={imageUrl} alt={`${track.title} - Music by Ansh Ebook`} />;
                                            })()}
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
                                                        onClick={() => toggleFavorite(track._id)}
                                                        style={{ background: 'transparent', border: 'none', color: isFavorite(track._id) ? 'var(--pink-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: '0.3s' }}
                                                        title="Favorite"
                                                    >
                                                        <Heart size={16} fill={isFavorite(track._id) ? "var(--pink-primary)" : "transparent"} />
                                                        {track.likes_count > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{track.likes_count}</span>}
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedSongForPlaylist(track._id); setShowPlaylistModal(true); }}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                        title="Add to Playlist"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                            {playingTrack?._id === track._id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="player-mount mt-3"
                                                >
                                                    {(() => {
                                                        let rawAudio = track.audioUrl || track.file_url;
                                                        if (rawAudio && rawAudio.includes('\\uploads\\')) rawAudio = '/uploads/' + rawAudio.split('\\uploads\\').pop();
                                                        else if (rawAudio && rawAudio.includes('/uploads/')) rawAudio = '/uploads/' + rawAudio.split('/uploads/').pop();
                                                        
                                                        const finalAudioSrc = rawAudio?.startsWith('/uploads') ? `${MEDIA_URL}${rawAudio}` : rawAudio;
                                                        return (
                                                            <audio 
                                                                key={track.file_url}
                                                                autoPlay 
                                                                controls 
                                                                className="compact-audio-player"
                                                                src={finalAudioSrc}
                                                            >
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                        );
                                                    })()}
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

            {/* Playlist Modal */}
            <AnimatePresence>
                {showPlaylistModal && (
                    <div className="modal-overlay" style={{ zIndex: 1100 }}>
                        <motion.div 
                            className="glass-card modal-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="modal-header">
                                <h3 className="pink-gradient-text">Manage Playlists</h3>
                                <button className="close-btn" onClick={() => setShowPlaylistModal(false)}><ArrowLeft size={20} /></button>
                            </div>
                            <div className="modal-body" style={{ padding: '1rem' }}>
                                <div className="create-playlist mb-4">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Playlist Name</label>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                        <input 
                                            type="text" 
                                            value={newPlaylistName} 
                                            onChange={(e) => setNewPlaylistName(e.target.value)}
                                            placeholder="My Hits..."
                                            style={{ flex: 1, background: 'var(--bg-glass-light)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0.5rem' }}
                                        />
                                        <button className="btn btn-primary btn-sm" onClick={handleCreatePlaylist}>CREATE</button>
                                    </div>
                                </div>
                                <div className="playlist-list">
                                    <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Select Playlist:</p>
                                    {userLibrary.playlists.map(pl => (
                                        <button 
                                            key={pl._id} 
                                            className="glass-card mb-2 w-100 text-left" 
                                            onClick={() => handleAddToPlaylist(pl._id)}
                                            style={{ padding: '1rem', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass-light)' }}
                                        >
                                            <span style={{ color: 'var(--text-primary)' }}>{pl.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pl.songs.length} tracks</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* My Library Display */}
            <AnimatePresence>
                {showLibrary && (
                    <motion.div 
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="my-library-panel glass-card"
                        style={{ position: 'fixed', right: 0, top: '80px', bottom: 0, width: '350px', zIndex: 1000, padding: '2rem', overflowY: 'auto', borderLeft: '1px solid var(--glass-border)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 className="pink-gradient-text" style={{ fontSize: '1.5rem' }}>My Library</h2>
                            <button onClick={() => setShowLibrary(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><ArrowLeft size={24} /></button>
                        </div>

                        <div className="lib-section mb-4">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><Heart size={18} fill="var(--pink-primary)" /> FAVORITES</h4>
                            {userLibrary.favorites.length > 0 ? userLibrary.favorites.map(track => (
                                <div key={track._id} className="lib-track-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.8rem', background: 'var(--bg-glass-light)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <img src={(track.imageUrl || track.cover_url)?.startsWith('/uploads') ? `${MEDIA_URL}${track.imageUrl || track.cover_url}` : (track.imageUrl || track.cover_url || '/default-music.png')} style={{ width: '40px', height: '40px', borderRadius: '4px' }} alt="" />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{track.title}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{track.artist}</p>
                                    </div>
                                    <button onClick={() => togglePlay(track)} style={{ background: 'transparent', border: 'none', color: 'var(--pink-primary)' }}>
                                        {playingTrack?._id === track._id ? <Pause size={16} fill="var(--pink-primary)" /> : <Play size={16} fill="var(--pink-primary)" />}
                                    </button>
                                </div>
                            )) : <p className="text-muted" style={{ fontSize: '0.8rem' }}>No favorites yet.</p>}
                        </div>

                        <div className="lib-section">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><ListMusic size={18} color="var(--pink-primary)" /> PLAYLISTS</h4>
                            {userLibrary.playlists.map(pl => (
                                <div key={pl._id} className="mb-3">
                                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>{pl.name}</p>
                                    {pl.songs.map(track => (
                                        <div key={track._id} className="lib-track-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                                            <p style={{ fontSize: '0.8rem', flex: 1, color: 'var(--text-primary)' }}>{track.title}</p>
                                            <button onClick={() => togglePlay(track)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
                                                {playingTrack?._id === track._id ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                        </div>
                                    ))}
                                    {pl.songs.length === 0 && <p className="text-muted" style={{ fontSize: '0.75rem', paddingLeft: '0.5rem' }}>Empty</p>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Music;
