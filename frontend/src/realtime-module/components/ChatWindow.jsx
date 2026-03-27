import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import GroupInfoView from './GroupInfoView';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, MoreVertical, Pin } from 'lucide-react';
import { fetchMessages } from '../../api';
import { getAvatarUrl } from '../../config';

const ChatWindow = ({ chat }) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState([]);
    const [showInfo, setShowInfo] = useState(false);
    const { socket, callUser, onlineUsers } = useSocket();
    const scrollRef = useRef();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentId = currentUser?.id || currentUser?._id;

    const otherUser = !chat.isGroup ? (chat.participants.find(p => p._id !== currentId) || {}) : null;
    
    // Reliable public notification sound
    const notificationSound = new Audio('https://res.cloudinary.com/dhpwp898n/video/upload/v1711516000/notification_vqc6vz.mp3'); 

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };

    useEffect(() => {
        if (chat._id && socket) {
            socket.emit('mark-seen', { chatId: chat._id });
        }
    }, [chat._id, messages.length]);

    useEffect(() => {
        if (chat._id && !chat._id.startsWith('new-')) {
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
            if (message.chat === chat._id) {
                setMessages(prev => [...prev, message]);
                if (message.sender !== currentId) {
                    notificationSound.play().catch(e => console.log("Sound play error:", e));
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
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const isKohinoor = chat.name?.toLowerCase().includes('kohinoor') || chat.isGroup;

    return (
        <div className="chat-window">
            <div className="chat-header" onClick={() => setShowInfo(true)} style={{ cursor: 'pointer' }}>
                <div className="other-user-info">
                    {chat.isGroup ? (
                        <div className="group-avatar-main">💎</div>
                    ) : (
                        <img 
                            src={getAvatarUrl(otherUser?.profile_pic, otherUser?.username)} 
                            alt="avatar" 
                            onError={(e) => { e.target.src = getAvatarUrl(null, otherUser?.username); }}
                        />
                    )}
                    <div className="chat-header-title">
                        <h4>
                            {chat.isGroup ? (isKohinoor ? '🔥 🌹 Kohinoor 🌹 🔥' : chat.name) : formatUsername(otherUser?.username)}
                        </h4>
                        <span className="user-status-text" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            {chat.isGroup ? `${chat.participants?.length || 0} members` : (onlineUsers[otherUser?._id] === 'online' ? 'Online' : 'Offline')}
                            {isTyping.length > 0 && ` • typing...`}
                        </span>
                    </div>
                </div>
                <div className="chat-actions" onClick={(e) => e.stopPropagation()}>
                    {!chat.isGroup && (
                        <>
                            <button onClick={() => callUser(otherUser?._id, 'audio')}><Phone size={20}/></button>
                            <button onClick={() => callUser(otherUser?._id, 'video')}><Video size={20}/></button>
                        </>
                    )}
                    <button><MoreVertical size={20}/></button>
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
                                {msg.sender?.username || 'Member'}
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

            {showInfo && <GroupInfoView chat={chat} onClose={() => setShowInfo(false)} />}
        </div>
    );
};

export default ChatWindow;
