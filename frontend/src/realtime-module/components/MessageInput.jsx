import React, { useState } from 'react';
import { Send, Image, Mic, Paperclip } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { findOrCreateChat } from '../../api';

const MessageInput = ({ chatId, receiverId, setMessages }) => {
    const [text, setText] = useState('');
    const { socket } = useSocket();

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const messageData = {
            chatId: chatId.startsWith('new-') ? null : chatId,
            receiverId,
            text,
            mediaUrl: null,
            mediaType: 'none',
            createdAt: new Date().toISOString()
        };

        // If it's a new chat, findOrCreate it first
        if (chatId.startsWith('new-')) {
            const res = await findOrCreateChat(receiverId);
            messageData.chatId = res.data._id;
        }

        socket.emit('send-message', messageData);
        setText('');
    };

    const handleTyping = (e) => {
        setText(e.target.value);
        socket.emit('typing', { receiverId, isTyping: e.target.value.length > 0 });
    };

    return (
        <form className="message-input-wrapper" onSubmit={handleSend}>
            <button type="button" className="icon-btn"><Paperclip size={20}/></button>
            <button type="button" className="icon-btn"><Image size={20}/></button>
            <input 
                type="text" 
                placeholder="Type a message..." 
                value={text}
                onChange={handleTyping}
            />
            {text.trim() ? (
                <button type="submit" className="send-btn"><Send size={20}/></button>
            ) : (
                <button type="button" className="icon-btn"><Mic size={20}/></button>
            )}
        </form>
    );
};

export default MessageInput;
