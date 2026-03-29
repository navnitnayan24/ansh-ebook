import React, { useState, useRef } from 'react';
import { Send, Image, Mic, Paperclip, Camera, Smile, Plus, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { findOrCreateChat, fetchCloudinarySignature } from '../../api';
import CameraModal from './CameraModal';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ chatId, receiverId, setMessages }) => {
    const [text, setText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
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

    const handleSend = async (e, directMedia = null) => {
        if (e) e.preventDefault();
        
        let mediaData = directMedia;
        
        // If there's a file queued, upload it first
        if (selectedFile) {
            mediaData = await uploadFile(selectedFile);
            if (!mediaData && !text.trim()) {
                clearFile(); // clear everything if upload failed and no text
                return;
            }
        }

        if (!text.trim() && !mediaData) return;

        if (!chatId) return;
        const normalizedChatId = chatId.toString();
        let currentChatId = normalizedChatId.startsWith('new-') ? null : normalizedChatId;
        
        if (normalizedChatId.startsWith('new-')) {
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
        clearFile(); // Clear preview after sending
        setShowPicker(false); // Hide picker on send
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl('placeholder');
        }
        e.target.value = ''; // Reset the input physically
    };

    const handleCameraCapture = (file) => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
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
        if (chatId && !chatId.startsWith('new-')) {
            socket.emit('typing', { chatId, isTyping: e.target.value.length > 0 });
        }
    };

    return (
        <form className="message-input-form" onSubmit={handleSend} style={{ position: 'relative' }}>
            {showPicker && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', right: '16px', zIndex: 50, boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                    <EmojiPicker 
                        onEmojiClick={(emojiObj) => setText(prev => prev + emojiObj.emoji)} 
                        theme="dark" 
                        searchDisabled={false}
                        skinTonesDisabled={true}
                    />
                </div>
            )}
            {selectedFile && (
                <div className="file-preview-banner" style={{
                    position: 'absolute', bottom: '100%', left: '16px', right: '16px', 
                    background: 'var(--c-sidebar)', padding: '10px 14px', borderRadius: '12px 12px 0 0',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    border: '1px solid var(--c-border)', borderBottom: 'none',
                    zIndex: 20
                }}>
                    {previewUrl && previewUrl !== 'placeholder' ? (
                        <img src={previewUrl} alt="Preview" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                        <div style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color: '#fff' }}>FILE</div>
                    )}
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--c-txt)', fontWeight: '500' }}>
                        {selectedFile.name}
                        <div style={{ fontSize: '0.7rem', color: 'var(--c-muted)', marginTop: '2px' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button" onClick={clearFile} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display:'flex', padding:'6px', borderRadius:'50%' }}>
                        <X size={16} />
                    </button>
                </div>
            )}
            <div className="input-field-container" style={{ borderTopLeftRadius: selectedFile ? '0' : '28px', borderTopRightRadius: selectedFile ? '0' : '28px' }}>
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
                            <Mic size={20} className="input-action-icon" onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} />
                            <Image size={20} className="input-action-icon" onClick={() => fileInputRef.current?.click()} />
                            <Smile size={20} className="input-action-icon" onClick={() => setShowPicker(prev => !prev)} />
                            <Plus size={20} className="input-action-icon" onClick={() => fileInputRef.current?.click()} />
                        </>
                    )}
                    
                    {(text.trim() || selectedFile) && (
                        <button type="submit" className="send-btn-minimal" style={{ marginLeft: '5px' }} disabled={isUploading}>
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
