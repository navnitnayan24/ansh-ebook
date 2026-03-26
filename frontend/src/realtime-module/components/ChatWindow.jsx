import React, { useState, useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { fetchMessages } from '../../api';

const ChatWindow = ({ chat }) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const { socket, callUser } = useSocket();
    const scrollRef = useRef();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const otherUser = chat.participants.find(p => p._id !== currentUser.id);

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
            if (message.chat === chat._id) {
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
                    <img src={otherUser.profilePic || '/default-avatar.png'} alt={otherUser.name} />
                    <div className="text-info">
                        <h4>{otherUser.name}</h4>
                        {isTyping && <span className="typing-pulse">typing...</span>}
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
                        className={`message-bubble ${msg.sender === currentUser.id ? 'sent' : 'received'}`}
                    >
                        {msg.text && <p>{msg.text}</p>}
                        {msg.mediaUrl && msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="media" />}
                        <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                <div ref={scrollRef}></div>
            </div>

            <MessageInput chatId={chat._id} receiverId={otherUser._id} setMessages={setMessages} />
        </div>
    );
};

export default ChatWindow;
