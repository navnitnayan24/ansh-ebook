import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import GroupInfoView from './GroupInfoView';
import AdSpace from '../../components/AdSpace';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, MoreVertical, Pin, ArrowLeft, X, Image as ImageIcon, Reply, Smile, Heart, ThumbsUp } from 'lucide-react';
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
    const [replyTo, setReplyTo] = useState(null);
    const [reactionMenu, setReactionMenu] = useState(null); // { messageId, x, y }

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

            if (message.chat === chat._id || (isTempChat && `new-${otherPid}` === chat._id)) {
                setMessages((prev) => {
                    const filtered = prev.filter(m => !(m._id?.toString().startsWith('temp-') && m.text === message.text));
                    return [...filtered, message];
                });
                if (message.sender !== currentId) {
                    notificationSound.play().catch(() => {});
                }
                socket.emit('mark-seen', { chatId: message.chat });
            }
        });

        socket.on('message-reaction-updated', ({ messageId, reactions }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
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
            socket.off('message-reaction-updated');
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

    const handleBack = () => {
        if (window.location.hash.includes('chat')) {
            window.history.back();
        } else {
            setSelectedChat(null);
        }
    };

    const handleEmojiReaction = (messageId, emoji) => {
        if (socket) {
            socket.emit('message-reaction', { messageId, chatId: chat._id, emoji });
        }
        setReactionMenu(null);
    };

    const handleLongPress = (e, messageId) => {
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        setReactionMenu({ messageId, x: touch.clientX, y: touch.clientY });
    };

    const getWallpaperStyle = () => {
        switch (chatWallpaper) {
            case 'love': return { background: 'linear-gradient(to bottom right, #ff9a9e, #fecfef)' };
            case 'peace': return { background: 'linear-gradient(to bottom right, #a1c4fd, #c2e9fb)' };
            case 'nature': return { background: 'linear-gradient(to bottom right, #84fab0, #8fd3f4)' };
            case 'cat': return { background: 'linear-gradient(to bottom right, #243949, #517fa4)' };
            case 'meditation': return { background: 'linear-gradient(to bottom right, #fbc2eb, #a6c1ee)' };
            default: return {}; 
        }
    };

    const renderMessageTextWithLinks = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return (
            <p className="message-text">
                {parts.map((part, i) => urlRegex.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#00d2ff', textDecoration: 'underline' }}>{part}</a>
                ) : part)}
            </p>
        );
    };

    return (
        <div className="chat-window">
            {/* ELITE PREMIUM HEADER */}
            <div className="chat-header">
                <div className="chat-header-profile">
                    <div className="header-avatar-stack">
                        <button className="mobile-back-btn-bubble" onClick={handleBack}>
                            <ArrowLeft size={18} />
                        </button>
                        <div onClick={() => setPreviewImage(chat.isGroup ? null : otherUser?.profile_pic)} style={{ cursor: 'pointer' }}>
                            {chat.isGroup ? (
                                <div className="group-avatar-main" style={{ width: '44px', height: '44px', fontSize: '18px' }}>💎</div>
                            ) : (
                                <Avatar pic={otherUser?.profile_pic} username={otherUser?.username} className="header-avatar-img" />
                            )}
                        </div>
                    </div>
                    <div className="header-user-info" onClick={() => setShowInfo(true)}>
                        <h4 className="header-username">{displayName}</h4>
                        <span className={`header-status-pink ${isTyping.length > 0 ? 'typing' : ''}`}>
                            {isTyping.length > 0 ? 'typing...' : (chat.isGroup ? `${chat.participants?.length || 0} members` : (onlineUsers[otherUser?._id] === 'online' ? 'Online' : 'Offline'))}
                        </span>
                    </div>
                </div>
                <div className="chat-actions">
                    {!chat.isGroup && (
                        <>
                            <button className="header-action-btn" onClick={() => callUser(otherUser?._id, 'audio')}><Phone size={20}/></button>
                            <button className="header-action-btn" onClick={() => callUser(otherUser?._id, 'video')}><Video size={20}/></button>
                            <button className="header-action-btn" onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}><ImageIcon size={20}/></button>
                        </>
                    )}
                    <button className="header-action-btn" onClick={() => setShowInfo(true)}><MoreVertical size={20}/></button>
                </div>

                {showWallpaperMenu && (
                    <div className="wallpaper-menu">
                        {['default', 'love', 'peace', 'nature', 'cat', 'meditation'].map(w => (
                            <div key={w} className="wallpaper-option" onClick={() => { setChatWallpaper(w); localStorage.setItem('chatWallpaper', w); setShowWallpaperMenu(false); }}>
                                {w.toUpperCase()}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="messages-area" style={getWallpaperStyle()}>
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === currentId || msg.sender?._id === currentId;
                    const repliedMsg = msg.replyTo ? messages.find(m => m._id === msg.replyTo) : null;

                    return (
                        <div key={idx} 
                             className={`message-bubble ${isMe ? 'sent' : 'received'}`}
                             onContextMenu={(e) => handleLongPress(e, msg._id)}
                             onTouchStart={(e) => {
                                 const timer = setTimeout(() => handleLongPress(e, msg._id), 600);
                                 e.target.ontouchend = () => clearTimeout(timer);
                             }}
                        >
                            {repliedMsg && (
                                <div className="reply-preview-bubble">
                                    <span className="reply-sender">{repliedMsg.sender === currentId ? 'You' : (repliedMsg.sender?.username || 'User')}</span>
                                    <p className="reply-text-small">{repliedMsg.text || 'Media'}</p>
                                </div>
                            )}

                            {chat.isGroup && !isMe && (
                                <div className="message-sender-name">{msg.sender?.username || 'Member'}</div>
                            )}
                            
                            {msg.text && renderMessageTextWithLinks(msg.text)}
                            {msg.mediaUrl && (
                                <div className="media-content">
                                    {msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="shared" className="message-media" onClick={() => window.open(msg.mediaUrl)} />}
                                    {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls className="message-media" />}
                                    {msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls className="message-media-audio" />}
                                </div>
                            )}
                            
                            {msg.reactions?.length > 0 && (
                                <div className="message-reactions-display">
                                    {msg.reactions.slice(0, 3).map((r, i) => <span key={i}>{r.emoji}</span>)}
                                    {msg.reactions.length > 1 && <span className="reaction-count">{msg.reactions.length}</span>}
                                </div>
                            )}

                            <div className="message-meta">
                                <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && <span className={`status-icon ${msg.status}`}>{msg.status === 'seen' ? '✓✓' : (msg.status === 'delivered' ? '✓✓' : '✓')}</span>}
                                <button className="btn-quick-reply" onClick={() => setReplyTo(msg)}><Reply size={14} /></button>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef}></div>
            </div>

            {/* REACTION MENU */}
            {reactionMenu && (
                <div className="reaction-floating-menu" style={{ top: reactionMenu.y - 60, left: Math.min(reactionMenu.x, window.innerWidth - 200) }} onClick={() => setReactionMenu(null)}>
                    {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
                        <span key={emoji} onClick={() => handleEmojiReaction(reactionMenu.messageId, emoji)}>{emoji}</span>
                    ))}
                </div>
            )}

            <MessageInput 
                chatId={chat._id} 
                receiverId={otherUser?._id} 
                setMessages={setMessages} 
                replyTo={replyTo} 
                setReplyTo={setReplyTo} 
            />

            {showInfo && <GroupInfoView chat={chat} onClose={() => setShowInfo(false)} />}

            {previewImage && (
                <div className="fullscreen-image-modal" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(10px)'}} onClick={() => setPreviewImage(null)}>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px 20px', color: 'white', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)'}}>
                        <button onClick={() => setPreviewImage(null)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex', cursor: 'pointer'}}><ArrowLeft size={24} /></button>
                        <span style={{fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.5px'}}>Profile Photo</span>
                        <button onClick={() => setPreviewImage(null)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex', cursor: 'pointer'}}><X size={24} /></button>
                    </div>
                    <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'}}>
                        <img src={previewImage.startsWith('/uploads') ? `${MEDIA_URL || ''}${previewImage}` : previewImage} alt="Profile" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
