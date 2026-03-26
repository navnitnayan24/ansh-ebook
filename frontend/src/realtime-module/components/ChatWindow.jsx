import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { fetchMessages } from '../../api';

const ChatWindow = ({ chat }) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const { socket, callUser, onlineUsers } = useSocket();
    const scrollRef = useRef();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentId = currentUser?.id || currentUser?._id;
    const otherUser = chat.participants.find(p => p._id !== currentId) || {};
    // Reliable public notification sound
    const notificationSound = new Audio('https://res.cloudinary.com/dhpwp898n/video/upload/v1711516000/notification_vqc6vz.mp3'); 

    const formatUsername = (name) => {
        if (!name) return 'User';
        if (name.includes('@')) return name.split('@')[0];
        return name;
    };
    useEffect(() => {
        if (chat._id && socket) {
            socket.emit('mark-seen', { chatId: chat._id, senderId: otherUser._id });
        }
    }, [chat._id, messages.length]);

    useEffect(() => {
        // Fetch message history
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
            const isMatch = message.chat === chat._id || 
                           (chat._id.startsWith('new-') && 
                            (message.sender === otherUser._id || message.receiverId === otherUser._id));
            
            if (isMatch) {
                setMessages(prev => [...prev, message]);
                notificationSound.play().catch(e => console.log("Sound play error:", e));
                socket.emit('mark-seen', { chatId: message.chat, senderId: otherUser._id });
            }
        });

        socket.on('messages-seen', ({ chatId }) => {
            if (chatId === chat._id) {
                setMessages(prev => prev.map(m => m.sender === currentId ? { ...m, status: 'seen' } : m));
            }
        });

        socket.on('message-delivered', ({ messageId }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
        });

        socket.on('message-sent', (message) => {
            const isMatch = message.chat === chat._id || 
                           (chat._id.startsWith('new-') && 
                            (message.sender === currentId || message.receiverId === otherUser._id));
                            
            if (isMatch) {
                setMessages(prev => [...prev, message]);
            }
        });

        socket.on('user-typing', (data) => {
            if (data.senderId === otherUser._id) {
                setIsTyping(data.isTyping);
            }
        });

        return () => {
            socket.off('receive-message');
            socket.off('message-sent');
            socket.off('user-typing');
        };
    }, [socket, chat._id]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-window glass-card">
            <div className="chat-header">
                <div className="other-user-info">
                    <img 
                        src={otherUser.profile_pic || 'https://ui-avatars.com/api/?name=' + (otherUser.username || 'U')} 
                        alt="avatar" 
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + (otherUser.username || 'U'); }}
                    />
                    <div className="text-info">
                        <h4>{formatUsername(otherUser.username)}</h4>
                        {isTyping ? (
                            <span className="typing-pulse">typing...</span>
                        ) : (
                            <span className="user-status-text">
                                {onlineUsers[otherUser._id] === 'online' ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="chat-actions">
                    <button onClick={() => callUser(otherUser._id, 'audio')}><Phone size={20}/></button>
                    <button onClick={() => callUser(otherUser._id, 'video')}><Video size={20}/></button>
                    <button><MoreVertical size={20}/></button>
                </div>
            </div>

            <div className="messages-area">
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`message-bubble ${msg.sender === currentId ? 'sent' : 'received'}`} 
                    >
                        {msg.text && <p>{msg.text}</p>}
                        
                        {msg.mediaUrl && (
                            <div className="media-content">
                                {msg.mediaType === 'image' && (
                                    <img src={msg.mediaUrl} alt="shared" className="message-media" onClick={() => window.open(msg.mediaUrl)} />
                                )}
                                {msg.mediaType === 'video' && (
                                    <video src={msg.mediaUrl} controls className="message-media" />
                                )}
                                {msg.mediaType === 'audio' && (
                                    <audio src={msg.mediaUrl} controls className="message-media-audio" />
                                )}
                                {(msg.mediaType === 'application' || msg.mediaType === 'file') && (
                                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="file-link">
                                        📄 View Document
                                    </a>
                                )}
                            </div>
                        )}
                        
                        <div className="message-meta">
                            <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.sender === currentId && (
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

            <MessageInput chatId={chat._id} receiverId={otherUser._id} setMessages={setMessages} />
        </div>
    );
};

export default ChatWindow;
