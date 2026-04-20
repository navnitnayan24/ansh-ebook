import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Camera, Image as ImageIcon, X, Send, Loader2, Music as MusicIcon, Volume2, VolumeX, Search, AtSign } from 'lucide-react';
import { createStatus, searchMusic, searchUsers } from '../api';
import Avatar from './Avatar';

const StatusUploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    
    // New Audio/Music States
    const [isMuted, setIsMuted] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [musicQuery, setMusicQuery] = useState('');
    const [musicResults, setMusicResults] = useState([]);

    // Mentions States
    const [showMentionsPicker, setShowMentionsPicker] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionResults, setMentionResults] = useState([]);
    const [selectedMentions, setSelectedMentions] = useState([]);
    
    
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Music Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (musicQuery.trim()) {
                try {
                    // Use iTunes Search API: Permanent, Secure, Lightning Fast, Global Library
                    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(musicQuery)}&media=music&entity=song&limit=15`);
                    if (!response.ok) throw new Error('Search failed');
                    const data = await response.json();
                    
                    const mappedSongs = data.results
                        .filter(song => song.previewUrl) // Ensure it has playable audio
                        .map(song => ({
                            _id: song.trackId.toString(),
                            title: song.trackName,
                            artist: song.artistName,
                            cover_url: song.artworkUrl100 || song.artworkUrl60,
                            file_url: song.previewUrl // 30s High-Quality Apple Music preview snippet
                        }));
                    setMusicResults(mappedSongs);
                } catch (err) {
                    console.error('iTunes API search failed:', err);
                }
            } else {
                setMusicResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [musicQuery]);

    // Mention Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (mentionQuery.trim()) {
                try {
                    const res = await searchUsers(mentionQuery);
                    setMentionResults(res.data);
                } catch (err) {
                    console.error('User search failed:', err);
                }
            } else {
                setMentionResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [mentionQuery]);

    const toggleMention = (user) => {
        if (selectedMentions.some(m => m._id === user._id)) {
            setSelectedMentions(prev => prev.filter(m => m._id !== user._id));
        } else {
            setSelectedMentions(prev => [...prev, user]);
        }
    };

    const handleUpload = async () => {
        if (!file) return alert('Please select a file');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('media', file);
            formData.append('caption', caption);
            formData.append('audioUrl', selectedMusic ? selectedMusic.file_url : '');
            formData.append('isMuted', isMuted);
            
            if (selectedMentions.length > 0) {
                formData.append('mentions', JSON.stringify(selectedMentions.map(m => m._id)));
            }

            await createStatus(formData);
            onSuccess();
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload status');
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="status-upload-overlay" onClick={onClose}>
            <div className="status-upload-card" onClick={e => e.stopPropagation()}>
                <div className="upload-card-header">
                    <h3>{showMusicPicker ? 'Select Music' : (showMentionsPicker ? 'Mention Friends' : 'New Status')}</h3>
                    <button className="close-upload-btn" onClick={showMusicPicker ? () => setShowMusicPicker(false) : (showMentionsPicker ? () => setShowMentionsPicker(false) : onClose)}>
                        <X size={20} />
                    </button>
                </div>

                {showMusicPicker ? (
                    <div className="music-picker-container">
                        <div className="music-search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search songs..." 
                                value={musicQuery}
                                onChange={e => setMusicQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="music-results-list">
                            {musicResults.map((song) => (
                                <div key={song._id} className="music-result-item" onClick={() => { setSelectedMusic(song); setShowMusicPicker(false); }}>
                                    <img src={song.cover_url} alt={song.title} />
                                    <div className="song-info">
                                        <span className="song-title">{song.title}</span>
                                        <span className="song-artist">{song.artist}</span>
                                    </div>
                                </div>
                            ))}
                            {musicQuery && musicResults.length === 0 && <div className="no-music">No songs found...</div>}
                        </div>
                    </div>
                ) : showMentionsPicker ? (
                    <div className="music-picker-container">
                        <div className="music-search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search friends to mention..." 
                                value={mentionQuery}
                                onChange={e => setMentionQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="music-results-list">
                            {mentionResults.map((user) => {
                                const isSelected = selectedMentions.some(m => m._id === user._id);
                                return (
                                    <div 
                                        key={user._id} 
                                        className="music-result-item" 
                                        onClick={() => toggleMention(user)}
                                        style={{ background: isSelected ? 'rgba(255,20,147,0.2)' : '' }}
                                    >
                                        <Avatar pic={user.profile_pic} username={user.username} className="avatar-micro" />
                                        <div className="song-info">
                                            <span className="song-title">{user.username}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {mentionQuery && mentionResults.length === 0 && <div className="no-music">No users found...</div>}
                        </div>
                        <button 
                            className="btn-status-send" 
                            style={{ margin: '10px', width: 'auto' }}
                            onClick={() => setShowMentionsPicker(false)}
                        >
                            Done ({selectedMentions.length})
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="upload-preview-area">
                            {preview ? (
                                <>
                                    {file.type.startsWith('video/') ? (
                                        <video src={preview} controls={false} autoPlay muted={isMuted} loop />
                                    ) : (
                                        <img src={preview} alt="preview" />
                                    )}
                                    
                                        {/* Overlay Controls */}
                                    <div className="upload-overlay-controls">
                                        {file.type.startsWith('video/') && (
                                            <button className="preview-control-btn" onClick={() => setIsMuted(!isMuted)}>
                                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                            </button>
                                        )}
                                        <button 
                                            className={`preview-control-btn ${selectedMentions.length > 0 ? 'active' : ''}`} 
                                            onClick={() => setShowMentionsPicker(true)}
                                        >
                                            <AtSign size={18} />
                                        </button>
                                        <button 
                                            className={`preview-control-btn ${selectedMusic ? 'active' : ''}`} 
                                            onClick={() => setShowMusicPicker(true)}
                                        >
                                            <MusicIcon size={18} />
                                        </button>
                                        <button className="preview-control-btn remove" onClick={() => { setFile(null); setPreview(null); setSelectedMusic(null); setSelectedMentions([]); }}>
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Selected Mentions Badge */}
                                    {selectedMentions.length > 0 && (
                                        <div className="selected-music-badge" style={{ top: '50px' }}>
                                            <AtSign size={14} />
                                            <span>Mentioning {selectedMentions.length} user(s)</span>
                                            <X size={14} onClick={(e) => { e.stopPropagation(); setSelectedMentions([]); }} />
                                        </div>
                                    )}

                                    {/* Selected Music Badge */}
                                    {selectedMusic && (
                                        <div className="selected-music-badge">
                                            <MusicIcon size={14} className="animate-pulse" />
                                            <span>{selectedMusic.title} - {selectedMusic.artist}</span>
                                            <X size={14} onClick={(e) => { e.stopPropagation(); setSelectedMusic(null); }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="upload-placeholders">
                                    <button onClick={() => fileInputRef.current.click()} className="upload-action-btn">
                                        <ImageIcon size={32} />
                                        <span>Gallery</span>
                                    </button>
                                    <button onClick={() => fileInputRef.current.click()} className="upload-action-btn">
                                        <Camera size={32} />
                                        <span>Camera</span>
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        hidden 
                                        accept="image/*,video/*" 
                                        onChange={handleFileChange} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="upload-card-footer">
                            <input 
                                type="text" 
                                placeholder="Add a caption..." 
                                value={caption} 
                                onChange={e => setCaption(e.target.value)}
                                className="story-caption-input"
                            />
                            <button 
                                className="btn-status-send" 
                                onClick={handleUpload} 
                                disabled={loading || !file}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                <span>Status</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default StatusUploadModal;
