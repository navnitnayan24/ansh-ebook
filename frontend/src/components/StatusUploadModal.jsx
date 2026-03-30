import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Send, Loader2 } from 'lucide-react';
import { createStatus } from '../api';

const StatusUploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!file) return alert('Please select a file');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('media', file);
            formData.append('caption', caption);
            await createStatus(formData);
            onSuccess();
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="status-upload-overlay" onClick={onClose}>
            <div className="status-upload-card" onClick={e => e.stopPropagation()}>
                <div className="upload-card-header">
                    <h3>New Status</h3>
                    <button className="close-upload-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="upload-preview-area">
                    {preview ? (
                        <>
                            {file.type.startsWith('video/') ? (
                                <video src={preview} controls={false} autoPlay muted />
                            ) : (
                                <img src={preview} alt="preview" />
                            )}
                            <button className="remove-preview-btn" onClick={() => { setFile(null); setPreview(null); }}><X size={16} /></button>
                        </>
                    ) : (
                        <div className="upload-placeholders">
                            <button onClick={() => fileInputRef.current.click()} className="upload-action-btn">
                                <ImageIcon size={32} />
                                <span>Gallery</span>
                            </button>
                            <button onClick={() => fileInputRef.current.click()} className="upload-action-btn">
                                <Camera size={32} />
                                <span>Camera</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                hidden 
                                accept="image/*,video/*" 
                                onChange={handleFileChange} 
                            />
                        </div>
                    )}
                </div>

                <div className="upload-card-footer">
                    <input 
                        type="text" 
                        placeholder="Add a caption..." 
                        value={caption} 
                        onChange={e => setCaption(e.target.value)}
                        className="story-caption-input"
                    />
                    <button 
                        className="btn-status-send" 
                        onClick={handleUpload} 
                        disabled={loading || !file}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        <span>Status</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusUploadModal;
