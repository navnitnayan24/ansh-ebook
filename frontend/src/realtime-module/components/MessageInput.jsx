import React, { useState, useRef } from 'react';
import { Send, Image, Mic, Paperclip } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { findOrCreateChat, fetchCloudinarySignature } from '../../api';

const MessageInput = ({ chatId, receiverId, setMessages }) => {
    const [text, setText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const { socket } = useSocket();
    const fileInputRef = useRef();

    const uploadFile = async (file) => {
        try {
            setIsUploading(true);
            const sigRes = await fetchCloudinarySignature();
            const { signature, timestamp, cloudName, apiKey } = sigRes.data;

            let resourceType = 'auto';
            if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                resourceType = 'video';
            }

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp);
            fd.append('signature', signature);
            fd.append('access_mode', 'public');
            
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                method: 'POST',
                body: fd
            });
            const resData = await res.json();
            return { url: resData.secure_url, type: file.type.split('/')[0] };
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSend = async (e, mediaData = null) => {
        if (e) e.preventDefault();
        if (!text.trim() && !mediaData) return;

        let currentChatId = chatId.startsWith('new-') ? null : chatId;
        
        if (chatId.startsWith('new-')) {
            const res = await findOrCreateChat(receiverId);
            currentChatId = res.data._id;
        }

        const messageData = {
            chatId: currentChatId,
            receiverId,
            text: text,
            mediaUrl: mediaData?.url || null,
            mediaType: mediaData?.type || 'none',
            createdAt: new Date().toISOString()
        };

        socket.emit('send-message', messageData);
        setText('');
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const media = await uploadFile(file);
        if (media) {
            handleSend(null, media);
        }
    };

    const handleTyping = (e) => {
        setText(e.target.value);
        socket.emit('typing', { receiverId, isTyping: e.target.value.length > 0 });
    };

    return (
        <form className="message-input-form" onSubmit={handleSend}>
            <div className="input-field-container">
                <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                
                <button type="button" className="action-icon-btn left" onClick={() => fileInputRef.current?.click()}>
                    <Image size={20}/>
                </button>

                <input 
                    type="text" 
                    className="main-chat-input"
                    placeholder={isUploading ? "Uploading..." : "Type a message..."} 
                    value={text}
                    onChange={handleTyping}
                    disabled={isUploading}
                />

                <div className="right-actions">
                    <button type="button" className="action-icon-btn" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip size={18}/>
                    </button>
                    
                    {text.trim() ? (
                        <button type="submit" className="send-btn-minimal" disabled={isUploading}>
                            <Send size={20}/>
                        </button>
                    ) : (
                        <>
                            <button type="button" className="action-icon-btn"><Mic size={18}/></button>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
};

export default MessageInput;
