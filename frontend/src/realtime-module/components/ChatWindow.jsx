import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import GroupInfoView from './GroupInfoView';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, MoreVertical, Pin, ArrowLeft } from 'lucide-react';
import { fetchMessages } from '../../api';
import { getAvatarUrl, maskEmail } from '../../config';
import Avatar from '../../components/Avatar';

const ChatWindow = ({ chat, setSelectedChat }) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState([]);
    const [showInfo, setShowInfo] = useState(false);
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
    
    // Reliable public notification sound
    const notificationSound = new Audio('https://res.cloudinary.com/dhpwp898n/video/upload/v1711516000/notification_vqc6vz.mp3'); 

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };

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
                // If this message belongs to the current "new-" session, refresh the chat
                if (chat._id === `new-${otherPid}`) {
                    window.location.reload(); // Hard refresh is safest to sync all lists
                    return;
                }
            }

            if (message.chat === chat._id || (isTempChat && `new-${otherPid}` === chat._id)) {
                setMessages((prev) => [...prev, message]);
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
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timeout);
    }, [messages]);

    const handleBack = () => {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur(); // Dismiss mobile keyboard
        }
        setSelectedChat(null);
    };

    const isKohinoor = (chat.name && typeof chat.name === 'string') ? chat.name.toLowerCase().includes('kohinoor') : chat.isGroup;

    return (
        <div className="chat-window">
            <div className="chat-header" onClick={() => setShowInfo(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                
                {/* Left Side: Back + Avatar + Text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    
                    {/* Back Button Wrapper container */}
                    <div style={{ flexShrink: 0 }}>
                        <button className="mobile-back-btn" onClick={(e) => { e.stopPropagation(); handleBack(); }} style={{ flexShrink: 0, border: 'none', background: 'rgba(255,255,255,0.08)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0 }}>
                            <ArrowLeft size={20} color="#fff" style={{ marginLeft: '-2px' }}/>
                        </button>
                    </div>

                    {/* Avatar Wrapper explicitly separated */}
                    <div style={{ flexShrink: 0 }}>
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
                        <h4 className="header-username" style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', letterSpacing: '-0.2px' }}>
                            {chat.isGroup ? (isKohinoor ? '🔥 🌹 Kohinoor 🌹 🔥' : chat.name) : maskEmail(otherUser?.username)}
                        </h4>
                        <span className="user-status-text" style={{ fontSize: '0.78rem', fontWeight: '600', color: '#ff69b4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {chat.isGroup ? `${chat.participants?.length || 0} members` : (onlineUsers[otherUser?._id] === 'online' ? 'Online' : 'Offline')}
                            {isTyping.length > 0 && ` • typing...`}
                        </span>
                    </div>

                </div>
                <div className="chat-actions" onClick={(e) => e.stopPropagation()}>
                    {!chat.isGroup && !(chat._id && chat._id.toString().startsWith('new-')) && (
                        <>
                            <button onClick={() => callUser(otherUser?._id, 'audio')}><Phone size={20}/></button>
                            <button onClick={() => callUser(otherUser?._id, 'video')}><Video size={20}/></button>
                        </>
                    )}
                    {!(chat._id && chat._id.toString().startsWith('new-')) && (
                        <button onClick={() => setShowInfo(true)}><MoreVertical size={20}/></button>
                    )}
                </div>
            </div>

            {chat.pinnedMessage && (
                <div className="pinned-message-banner" onClick={() => {/* Scroll to message logic */}}>
                    <Pin size={14} />
                    <span>Pinned: {chat.pinnedMessage.text || 'View Media'}</span>
                </div>
            )}

            <div className="messages-area" style={{ flex: 1 }}>
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`message-bubble ${msg.sender === currentId || msg.sender?._id === currentId ? 'sent' : 'received'}`} 
                    >
                        {chat.isGroup && msg.sender !== currentId && msg.sender?._id !== currentId && (
                            <div className="message-sender-name" style={{ fontSize: '0.7rem', color: '#ff69b4', fontWeight: '600', marginBottom: '2px' }}>
                                {maskEmail(msg.sender?.username || 'Member')}
                            </div>
                        )}
                        
                        {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}
                        
                        {msg.mediaUrl && (
                            <div className="media-content" style={{ marginTop: msg.text ? '5px' : '0' }}>
                                {msg.mediaType === 'image' && (
                                    <img src={msg.mediaUrl} alt="shared" className="message-media" style={{ maxWidth: '100%', borderRadius: '10px' }} onClick={() => window.open(msg.mediaUrl)} />
                                )}
                                {msg.mediaType === 'video' && (
                                    <video src={msg.mediaUrl} controls className="message-media" style={{ maxWidth: '100%', borderRadius: '10px' }} />
                                )}
                                {msg.mediaType === 'audio' && (
                                    <audio src={msg.mediaUrl} controls className="message-media-audio" style={{ width: '100%' }} />
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
                    // This will ideally be handled by a parent state or the chat object itself
                    // For now, we update the local chat object reference if possible
                    Object.assign(chat, updatedChat);
                    setShowInfo(false);
                }}
            />}
        </div>
    );
};

export default ChatWindow;
