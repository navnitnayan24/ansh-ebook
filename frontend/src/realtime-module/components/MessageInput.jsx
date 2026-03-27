import React, { useState, useRef } from 'react';
import { Send, Image, Mic, Paperclip, Camera, Smile, Plus } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { findOrCreateChat, fetchCloudinarySignature } from '../../api';
import CameraModal from './CameraModal';

const MessageInput = ({ chatId, receiverId, setMessages }) => {
    const [text, setText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const { socket } = useSocket();
    const fileInputRef = useRef();
    const audioChunksRef = useRef([]);

    const uploadFile = async (file) => {
        if (file.size > 100 * 1024 * 1024) {
            alert("File size exceeds 100MB limit!");
            return null;
        }
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

        if (!chatId) return;
        let currentChatId = (typeof chatId === 'string' && chatId.startsWith('new-')) ? null : chatId;
        
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

    const handleCameraCapture = async (file) => {
        const media = await uploadFile(file);
        if (media) {
            handleSend(null, media);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                const media = await uploadFile(file);
                if (media) handleSend(null, media);
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording error:", err);
            alert("Microphone access needed!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleTyping = (e) => {
        setText(e.target.value);
        socket.emit('typing', { chatId, isTyping: e.target.value.length > 0 });
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
                
                {/* Fixed camera button on the left as per screenshot */}
                <button type="button" className="camera-btn-round" onClick={() => setIsCameraOpen(true)}>
                    <Camera size={20}/>
                </button>

                <input 
                    type="text" 
                    className="main-chat-input"
                    placeholder={isUploading ? "Uploading..." : "Message..."} 
                    value={text}
                    onChange={handleTyping}
                    disabled={isUploading}
                />

                <div className="input-actions-right">
                    {isRecording ? (
                        <div className="recording-indicator">Recording...</div>
                    ) : (
                        <>
                            <Mic size={20} className="input-action-icon" onMouseDown={startRecording} onMouseUp={stopRecording} />
                            <Image size={20} className="input-action-icon" onClick={() => fileInputRef.current?.click()} />
                            <Smile size={20} className="input-action-icon" />
                            <Plus size={20} className="input-action-icon" onClick={() => fileInputRef.current?.click()} />
                        </>
                    )}
                    
                    {text.trim() && (
                        <button type="submit" className="send-btn-minimal" style={{ marginLeft: '5px' }}>
                            <Send size={18} />
                        </button>
                    )}
                </div>
            </div>
            
            <CameraModal 
                isOpen={isCameraOpen} 
                onClose={() => setIsCameraOpen(false)} 
                onCapture={handleCameraCapture} 
            />
        </form>
    );
};

export default MessageInput;
