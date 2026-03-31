import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import GroupInfoView from './GroupInfoView';
import AdSpace from '../../components/AdSpace';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, MoreVertical, Pin, ArrowLeft, X, Image as ImageIcon } from 'lucide-react';
import { fetchMessages } from '../../api';
import { getAvatarUrl, maskEmail, MEDIA_URL } from '../../config';
import Avatar from '../../components/Avatar';

// Utility for clean display names (no email domains)
const getCleanName = (name) => {
    if (!name) return 'User';
    return name.split('@')[0];
};

const ChatWindow = ({ chat, setSelectedChat }) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState([]);
    const [showInfo, setShowInfo] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [chatWallpaper, setChatWallpaper] = useState(localStorage.getItem('chatWallpaper') || 'default');
    const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
    const { socket, callUser, onlineUsers } = useSocket();
    const scrollRef = useRef();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentId = currentUser?.id || currentUser?._id;
    
    // Find other participant, or self if chatting with self
    const otherUser = !chat.isGroup ? (
        chat.participants.find(p => (p._id || p.id)?.toString() !== currentId?.toString()) || 
        chat.participants[0] || 
        {}
    ) : null;

    // Clean display name (remove email domain if any)
    const rawName = chat.isGroup ? (chat.name || 'Group') : (otherUser?.username || 'Chat');
    const displayName = rawName.split('@')[0];
    
    // Reliable public notification sound
    const notificationSound = new Audio('https://res.cloudinary.com/dhpwp898n/video/upload/v1711516000/notification_vqc6vz.mp3'); 

    useEffect(() => {
        if (chat._id && chat._id.toString().startsWith('new-') === false && socket) {
            socket.emit('mark-seen', { chatId: chat._id });
        }
    }, [chat._id, messages.length]);

    useEffect(() => {
        if (chat._id && chat._id.toString().startsWith('new-') === false) {
            const fetchHistory = async () => {
                const res = await fetchMessages(chat._id);
                setMessages(res.data);
            };
            fetchHistory();
        } else {
            setMessages([]);
        }
    }, [chat._id]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('receive-message', (message) => {
            const isTempChat = !!(chat._id && chat._id.toString().startsWith('new-'));
            const isSenderMe = message.sender?._id === currentId || message.sender === currentId;
            const otherPid = isSenderMe ? message.receiverId : (message.sender?._id || message.sender);

            // Handle synchronization for new chats
            if (isTempChat && message.chat && !message.isGroup) {
                // If this message belongs to the current "new-" session, update without a hard reload
                if (chat._id === `new-${otherPid}`) {
                    setSelectedChat(prev => ({ ...prev, _id: message.chat }));
                    return;
                }
            }

            if (message.chat === chat._id || (isTempChat && `new-${otherPid}` === chat._id)) {
                setMessages((prev) => {
                    // Remove optimistic UI temp message duplicates if present
                    const filtered = prev.filter(m => !(m._id?.toString().startsWith('temp-') && m.text === message.text));
                    return [...filtered, message];
                });
                if (message.sender !== currentId) {
                    notificationSound.play().catch(() => {});
                }
                socket.emit('mark-seen', { chatId: message.chat });
            }
        });

        socket.on('messages-seen', ({ chatId, seenBy }) => {
            if (chatId === chat._id && seenBy !== currentId) {
                setMessages(prev => prev.map(m => m.sender === currentId ? { ...m, status: 'seen' } : m));
            }
        });

        socket.on('message-delivered', ({ messageId, chatId }) => {
            if (chatId === chat._id) {
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
            }
        });

        socket.on('user-typing', (data) => {
            if (data.chatId === chat._id) {
                setIsTyping(prev => {
                    if (data.isTyping) {
                        return [...new Set([...prev, data.senderId])];
                    } else {
                        return prev.filter(id => id !== data.senderId);
                    }
                });
            }
        });

        return () => {
            socket.off('receive-message');
            socket.off('messages-seen');
            socket.off('message-delivered');
            socket.off('user-typing');
        };
    }, [socket, chat._id]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const container = scrollRef.current?.parentElement;
            if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [messages]);

    useEffect(() => {
        const handlePopState = () => {
            if (previewImage) setPreviewImage(null);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [previewImage]);

    const handleBack = () => {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur(); // Dismiss mobile keyboard
        }
        if (window.location.hash.includes('chat')) {
            window.history.back();
        } else {
            setSelectedChat(null);
        }
    };

    // Helper to parse and render clickable URLs safely
    const renderMessageTextWithLinks = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return (
            <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {parts.map((part, i) => {
                    if (part.match(urlRegex)) {
                        return (
                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#8de8ff', textDecoration: 'underline', fontWeight: '500' }}>
                                {part}
                            </a>
                        );
                    }
                    return part;
                })}
            </p>
        );
    };

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        const url = chat.isGroup ? null : (otherUser?.profile_pic || null);
        if (url) {
            window.history.pushState({ imageModal: true }, '');
            setPreviewImage(url);
        }
    };

    const closeImageModal = () => {
        if (previewImage) {
            window.history.back(); // Triggers popstate to close properly
        }
    };

    const handleWallpaperSelect = (themeName) => {
        setChatWallpaper(themeName);
        localStorage.setItem('chatWallpaper', themeName);
        setShowWallpaperMenu(false);
    };

    const getWallpaperStyle = () => {
        switch (chatWallpaper) {
            case 'love': return { background: 'linear-gradient(to bottom right, #ff9a9e, #fecfef)' };
            case 'peace': return { background: 'linear-gradient(to bottom right, #a1c4fd, #c2e9fb)' };
            case 'nature': return { background: 'linear-gradient(to bottom right, #84fab0, #8fd3f4)' };
            case 'cat': return { background: 'linear-gradient(to bottom right, #243949, #517fa4)' };
            case 'meditation': return { background: 'linear-gradient(to bottom right, #fbc2eb, #a6c1ee)' };
            default: return {}; // default uses CSS theme vars
        }
    };

    const isKohinoor = (chat.name && typeof chat.name === 'string') ? chat.name.toLowerCase().includes('kohinoor') : chat.isGroup;

    return (
        <div className="chat-window">
            <div className="chat-header" onClick={() => setShowInfo(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                
                {/* Left Side: Back + Avatar + Text */}
                <div className="other-user-info" style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    
                    {/* Back Button Wrapper container */}
                    <div style={{ flexShrink: 0 }}>
                        <button className="mobile-back-btn" onClick={(e) => { e.stopPropagation(); handleBack(); }} style={{ flexShrink: 0, border: 'none', background: 'rgba(255,255,255,0.08)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginLeft: '-2px' }}/>
                        </button>
                    </div>

                    {/* Avatar Wrapper explicitly separated */}
                    <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={handleAvatarClick}>
                        {chat.isGroup ? (
                            <div className="group-avatar-main">💎</div>
                        ) : (
                            <Avatar 
                                pic={otherUser?.profile_pic} 
                                username={otherUser?.username} 
                                className="header-avatar"
                            />
                        )}
                    </div>

                    {/* Text Section highly constrained */}
                    <div className="chat-header-title-text" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '8px' }}>
                        <h4 className="header-username" onClick={handleAvatarClick} style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', letterSpacing: '-0.2px', cursor: 'pointer' }}>
                            {chat.isGroup && (displayName.toLowerCase().includes('kohinoor')) ? '🔥 🌹 Kohinoor 🌹 🔥' : displayName}
                        </h4>
                        <span className="user-status-text" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#ff69b4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {chat.isGroup ? `${chat.participants?.length || 0} members` : (onlineUsers[otherUser?._id] === 'online' ? 'Online' : 'Offline')}
                            {isTyping.length > 0 && ` • typing...`}
                        </span>
                    </div>

                </div>
                <div className="chat-actions" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                    {!chat.isGroup && !(chat._id && chat._id.toString().startsWith('new-')) && (
                        <>
                            <button onClick={() => callUser(otherUser?._id, 'audio')}><Phone size={20}/></button>
                            <button onClick={() => callUser(otherUser?._id, 'video')}><Video size={20}/></button>
                        </>
                    )}
                    {!(chat._id && chat._id.toString().startsWith('new-')) && (
                        <>
                            <button onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}><ImageIcon size={20}/></button>
                            <button onClick={() => setShowInfo(true)}><MoreVertical size={20}/></button>
                        </>
                    )}
                    
                    {/* Wallpaper Dropdown */}
                    {showWallpaperMenu && (
                        <div className="wallpaper-menu" style={{ position: 'absolute', top: '100%', right: '40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px 0', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '180px' }}>
                            <div style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Theme</div>
                            <div className="wallpaper-option" onClick={() => handleWallpaperSelect('default')} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>🧹 Default</div>
                            <div className="wallpaper-option" onClick={() => handleWallpaperSelect('love')} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>❤️ Love</div>
                            <div className="wallpaper-option" onClick={() => handleWallpaperSelect('peace')} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>☮️ Peace</div>
                            <div className="wallpaper-option" onClick={() => handleWallpaperSelect('nature')} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>🌿 Nature</div>
                            <div className="wallpaper-option" onClick={() => handleWallpaperSelect('cat')} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>🐈 Black Cat</div>
                            <div className="wallpaper-option" onClick={() => handleWallpaperSelect('meditation')} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>🧘 Meditation</div>
                        </div>
                    )}
                </div>
            </div>

            {chat.pinnedMessage && (
                <div className="pinned-message-banner" onClick={() => {/* Scroll to message logic */}}>
                    <Pin size={14} />
                    <span>Pinned: {chat.pinnedMessage.text || 'View Media'}</span>
                </div>
            )}

            <div className="messages-area" style={{ ...getWallpaperStyle(), backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`message-bubble ${msg.sender === currentId || msg.sender?._id === currentId ? 'sent' : 'received'}`} 
                    >
                        {chat.isGroup && msg.sender !== currentId && msg.sender?._id !== currentId && (
                            <div className="message-sender-name" style={{ fontSize: '0.7rem', color: '#ff69b4', fontWeight: '600', marginBottom: '2px' }}>
                                {msg.sender?.username || 'Member'}
                            </div>
                        )}
                        
                        {msg.text && renderMessageTextWithLinks(msg.text)}
                        
                        {msg.mediaUrl && (
                            <div className="media-content" style={{ marginTop: msg.text ? '5px' : '0' }}>
                                {msg.mediaType === 'image' && (
                                    <img src={msg.mediaUrl} alt="shared" className="message-media" style={{ maxWidth: '100%', borderRadius: '10px', cursor: 'pointer' }} onClick={() => window.open(msg.mediaUrl)} />
                                )}
                                {msg.mediaType === 'video' && (
                                    <video src={msg.mediaUrl} controls className="message-media" style={{ maxWidth: '100%', borderRadius: '10px' }} />
                                )}
                                {msg.mediaType === 'audio' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px', marginTop: '5px' }}>
                                        <div style={{flexShrink: 0}}>
                                            <Avatar 
                                                pic={msg.sender === currentId || msg.sender?._id === currentId ? currentUser?.profile_pic : msg.sender?.profile_pic || otherUser?.profile_pic} 
                                                username={msg.sender === currentId || msg.sender?._id === currentId ? currentUser?.username : msg.sender?.username || otherUser?.username} 
                                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <audio src={msg.mediaUrl} controls className="message-media-audio" style={{ flex: 1, height: '40px' }} />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="message-meta">
                            <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {(msg.sender === currentId || msg.sender?._id === currentId) && (
                                <span className={`status-icon ${msg.status}`}>
                                    {msg.status === 'sent' && '✓'}
                                    {msg.status === 'delivered' && '✓✓'}
                                    {msg.status === 'seen' && '✓✓'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef}></div>
            </div>

            <MessageInput chatId={chat._id} receiverId={otherUser?._id} setMessages={setMessages} />

            {showInfo && <GroupInfoView 
                chat={chat} 
                onClose={() => setShowInfo(false)} 
                onUpdate={(updatedChat) => {
                    Object.assign(chat, updatedChat);
                    setShowInfo(false);
                }}
            />}

            {previewImage && (
                <div className="fullscreen-image-modal" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px 20px', color: 'white', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)'}}>
                        <button onClick={closeImageModal} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex', cursor: 'pointer'}}><ArrowLeft size={24} /></button>
                        <span style={{fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.5px'}}>Profile Photo</span>
                        <button onClick={closeImageModal} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex', cursor: 'pointer'}}><X size={24} /></button>
                    </div>
                    <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'}} onClick={closeImageModal}>
                        <img src={previewImage.startsWith('/uploads') ? `${MEDIA_URL || ''}${previewImage}` : previewImage} alt="Profile" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
