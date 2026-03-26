import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [hasPhoto, setHasPhoto] = useState(false);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
                    <button onClick={onClose}><X size={20}/></button>
                </div>
                <div className="video-container">
                    <video ref={videoRef} autoPlay playsInline />
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
