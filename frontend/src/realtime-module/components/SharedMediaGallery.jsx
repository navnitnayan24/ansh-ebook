import React, { useState, useEffect } from 'react';
import { Image, FileText, Link2, Play, Download, X, ExternalLink } from 'lucide-react';
import { fetchChatMedia } from '../../api';
import '../../styles/SharedMediaGallery.css';

const SharedMediaGallery = ({ chatId, onClose }) => {
    const [activeTab, setActiveTab] = useState('media');
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState(null);

    useEffect(() => {
        if (!chatId) return;
        loadMedia();
    }, [chatId]);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const { data } = await fetchChatMedia(chatId);
            setAllItems(data);
        } catch (err) {
            console.error('Failed to load chat media:', err);
        } finally {
            setLoading(false);
        }
    };

    const extractLinks = (text) => {
        if (!text) return [];
        const urlRegex = /https?:\/\/[^\s]+/gi;
        return text.match(urlRegex) || [];
    };

    // Categorize items
    const mediaItems = allItems.filter(m => m.mediaType === 'image' || m.mediaType === 'video');
    const docItems = allItems.filter(m => m.mediaType === 'file' || m.mediaType === 'document' || m.mediaType === 'audio');
    const linkItems = allItems.filter(m => {
        const links = extractLinks(m.text);
        return links.length > 0 && m.mediaType !== 'image' && m.mediaType !== 'video';
    });

    const tabs = [
        { key: 'media', label: 'Media', icon: <Image size={16} />, count: mediaItems.length },
        { key: 'docs', label: 'Docs', icon: <FileText size={16} />, count: docItems.length },
        { key: 'links', label: 'Links', icon: <Link2 size={16} />, count: linkItems.length }
    ];

    const formatDate = (d) => {
        const date = new Date(d);
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getDomain = (url) => {
        try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
    };

    return (
        <div className="shared-media-gallery">
            <div className="smg-header">
                <h3>Shared Content</h3>
                {onClose && <button className="smg-close" onClick={onClose}><X size={20} /></button>}
            </div>

            {/* Tab Bar */}
            <div className="smg-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`smg-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span className="smg-tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="smg-content">
                {loading ? (
                    <div className="smg-loading">
                        <div className="loader"></div>
                        <p>Loading shared content...</p>
                    </div>
                ) : activeTab === 'media' ? (
                    mediaItems.length === 0 ? (
                        <div className="smg-empty">
                            <Image size={40} />
                            <p>No photos or videos shared yet</p>
                        </div>
                    ) : (
                        <div className="smg-media-grid">
                            {mediaItems.map((item, idx) => (
                                <div
                                    key={item._id || idx}
                                    className="smg-media-item"
                                    onClick={() => setPreviewItem(item)}
                                >
                                    {item.mediaType === 'video' ? (
                                        <div className="smg-video-thumb">
                                            <video src={item.mediaUrl} preload="metadata" />
                                            <div className="smg-play-overlay"><Play size={24} /></div>
                                        </div>
                                    ) : (
                                        <img src={item.mediaUrl} alt="" loading="lazy" />
                                    )}
                                    <div className="smg-media-meta">
                                        <span>{item.sender?.username}</span>
                                        <span>{formatDate(item.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'docs' ? (
                    docItems.length === 0 ? (
                        <div className="smg-empty">
                            <FileText size={40} />
                            <p>No documents shared yet</p>
                        </div>
                    ) : (
                        <div className="smg-docs-list">
                            {docItems.map((item, idx) => (
                                <a
                                    key={item._id || idx}
                                    href={item.mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="smg-doc-item"
                                >
                                    <div className="smg-doc-icon">
                                        {item.mediaType === 'audio' ? '🎵' : '📄'}
                                    </div>
                                    <div className="smg-doc-info">
                                        <span className="smg-doc-name">{item.text || 'Document'}</span>
                                        <span className="smg-doc-meta">
                                            {item.sender?.username} • {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                    <Download size={16} className="smg-doc-dl" />
                                </a>
                            ))}
                        </div>
                    )
                ) : (
                    linkItems.length === 0 ? (
                        <div className="smg-empty">
                            <Link2 size={40} />
                            <p>No links shared yet</p>
                        </div>
                    ) : (
                        <div className="smg-links-list">
                            {linkItems.map((item, idx) => {
                                const links = extractLinks(item.text);
                                return links.map((url, li) => (
                                    <a
                                        key={`${item._id || idx}-${li}`}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="smg-link-item"
                                    >
                                        <div className="smg-link-favicon">
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=32`}
                                                alt=""
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div className="smg-link-info">
                                            <span className="smg-link-domain">{getDomain(url)}</span>
                                            <span className="smg-link-url">{url}</span>
                                            <span className="smg-link-meta">
                                                {item.sender?.username} • {formatDate(item.createdAt)}
                                            </span>
                                        </div>
                                        <ExternalLink size={14} className="smg-link-ext" />
                                    </a>
                                ));
                            })}
                        </div>
                    )
                )}
            </div>

            {/* Full Preview Modal */}
            {previewItem && (
                <div className="smg-preview-overlay" onClick={() => setPreviewItem(null)}>
                    <button className="smg-preview-close" onClick={() => setPreviewItem(null)}>
                        <X size={28} />
                    </button>
                    <div className="smg-preview-content" onClick={(e) => e.stopPropagation()}>
                        {previewItem.mediaType === 'video' ? (
                            <video src={previewItem.mediaUrl} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px' }} />
                        ) : (
                            <img src={previewItem.mediaUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }} />
                        )}
                        <div className="smg-preview-info">
                            <span>{previewItem.sender?.username}</span>
                            <span>{formatDate(previewItem.createdAt)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedMediaGallery;
