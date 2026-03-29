import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('user'); // Default to front camera

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, facingMode]); // Restart on flip

    const startCamera = async () => {
        stopCamera(); // Ensure old stream stops before starting new
        try {
            const s = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode }, 
                audio: false 
            });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (err) {
            console.error("Camera error:", err);
            alert("Could not access camera.");
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const takePhoto = () => {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
            const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
            onCapture(file);
            onClose();
        }, 'image/jpeg');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay flex-center">
            <div className="camera-modal glass-card">
                <div className="modal-header">
                    <h3>Take Photo</h3>
                    <div style={{display: 'flex', gap: '15px'}}>
                        <button onClick={toggleCamera} title="Flip Camera" style={{ background: 'transparent', border: 'none', color: '#fff' }}><RefreshCw size={20}/></button>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={20}/></button>
                    </div>
                </div>
                <div className="video-container" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', minHeight: '300px' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div className="modal-footer">
                    <button className="capture-btn" onClick={takePhoto}>
                        <Camera size={30} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
