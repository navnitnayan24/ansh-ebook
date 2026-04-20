import React, { useState, useRef } from 'react';
import { Send, Image, Mic, Paperclip, Camera, Smile, Plus, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { findOrCreateChat, fetchCloudinarySignature } from '../../api';
import CameraModal from './CameraModal';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

const MessageInput = ({ chatId, receiverId, setMessages, replyTo, setReplyTo }) => {
    const [text, setText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const { socket } = useSocket();
    const fileInputRef = useRef();
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const closeReply = () => {
        if (setReplyTo) setReplyTo(null);
    };

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
        
        if (!text.trim() && !selectedFile && !directMedia) return;

        if (!chatId) return;
        const normalizedChatId = chatId.toString();
        let currentChatId = normalizedChatId.startsWith('new-') ? null : normalizedChatId;
        
        if (normalizedChatId.startsWith('new-')) {
            const res = await findOrCreateChat(receiverId);
            currentChatId = res.data._id;
        }

        // 1. Capture payload instantly
        const textToSend = text;
        const fileToSend = selectedFile;
        const currentReplyTo = replyTo?._id;

        // 2. Clear UI Inputs immediately
        setText('');
        clearFile();
        setShowPicker(false);
        closeReply();

        // 3. Create Optimistic Message for instantaneous UX
        const currUserObj = JSON.parse(localStorage.getItem('user') || '{}');
        const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            chatId: currentChatId,
            receiverId,
            text: textToSend,
            mediaUrl: fileToSend ? URL.createObjectURL(fileToSend) : (directMedia?.url || null),
            mediaType: fileToSend ? (fileToSend.type.startsWith('video/') ? 'video' : 'image') : (directMedia?.type || 'none'),
            replyTo: currentReplyTo,
            createdAt: new Date().toISOString(),
            sender: { 
                _id: currUserObj.id || currUserObj._id, 
                username: currUserObj.username, 
                profile_pic: currUserObj.profile_pic 
            },
            status: 'sending'
        };

        if (setMessages && currentChatId && !currentChatId.startsWith('new-')) {
            setMessages(prev => [...prev, optimisticMessage]);
        }

        // 4. Run Upload & Emit in the Background (Non-Blocking)
        (async () => {
            let mediaData = directMedia;
            if (fileToSend) {
                mediaData = await uploadFile(fileToSend);
                if (!mediaData && !textToSend.trim()) {
                    // Update state to failed? For now we just return
                    return;
                }
            }

            const messageData = {
                tempId: optimisticMessage._id,
                chatId: currentChatId,
                receiverId,
                text: textToSend,
                mediaUrl: mediaData?.url || null,
                mediaType: mediaData?.type || 'none',
                replyTo: currentReplyTo,
                createdAt: new Date().toISOString()
            };

            socket.emit('send-message', messageData);
        })();
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
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // We fake a generic name. On send, it uploads and gets mediaUrl
                const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                
                clearInterval(recordingTimerRef.current);
                setRecordingTime(0);
                setIsRecording(false);
                
                setSelectedFile(file);
                setPreviewUrl('placeholder'); // Forces 'FILE' icon in preview
                
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 59) {
                        recorder.stop();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err) {
            console.error("Recording error:", err);
            alert("Microphone access needed!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
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
            {replyTo && (
                <div className="reply-input-banner" style={{
                    position: 'absolute', bottom: '100%', left: '16px', right: '16px', 
                    background: 'rgba(233,30,140,0.1)', padding: '10px 14px', borderRadius: '12px 12px 0 0',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    border: '1px solid rgba(233,30,140,0.3)', borderBottom: 'none',
                    zIndex: 25, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ width: '4px', height: '30px', background: 'var(--c-pink)', borderRadius: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--c-pink)' }}>
                            Replying to {replyTo.sender?.username || 'User'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {replyTo.text || (replyTo.mediaType !== 'none' ? 'Media' : '...')}
                        </div>
                    </div>
                    <button type="button" onClick={closeReply} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display:'flex', padding:'6px', borderRadius:'50%' }}>
                        <X size={16} />
                    </button>
                </div>
            )}
            {showPicker && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', right: '16px', zIndex: 50, boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                    <EmojiPicker 
                        onEmojiClick={(emojiObj) => setText(prev => prev + emojiObj.emoji)} 
                        theme="dark" 
                        emojiStyle={EmojiStyle.GOOGLE}
                        searchDisabled={false}
                        skinTonesDisabled={true}
                        lazyLoadEmojis={true}
                        width={320}
                        height={380}
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

            <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx"/>

            <div className="input-field-container">
                {/* Camera Button */}
                <button type="button" className="camera-btn-round" onClick={() => setIsCameraOpen(true)}>
                    <Camera size={22}/>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#ff1493', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                00:{recordingTime.toString().padStart(2, '0')}
                            </span>
                            <div onClick={stopRecording} style={{ background: '#ff1493', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(255,20,147,0.5)' }}>
                                <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '2px' }} />
                                </div>
                        </div>
                    ) : (
                        <>
                            <Mic size={20} className="input-action-icon" onClick={startRecording} />
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
