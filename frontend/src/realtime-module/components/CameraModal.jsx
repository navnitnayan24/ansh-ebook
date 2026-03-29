import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('user'); // Default to front camera
    const [previewUrl, setPreviewUrl] = useState(null);
    const [capturedFile, setCapturedFile] = useState(null);

    useEffect(() => {
        if (isOpen && !previewUrl) {
            startCamera();
        } else if (!isOpen) {
            stopCamera();
            setPreviewUrl(null);
            setCapturedFile(null);
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
            setCapturedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
        }, 'image/jpeg');
    };

    const handleRetake = () => {
        setPreviewUrl(null);
        setCapturedFile(null);
        startCamera();
    };

    const handleConfirmSend = () => {
        onCapture(capturedFile);
        setPreviewUrl(null);
        setCapturedFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay flex-center">
            <div className="camera-modal glass-card">
                <div className="modal-header">
                    <h3>Take Photo</h3>
                    {previewUrl ? null : (
                        <>
                            <button onClick={toggleCamera} title="Flip Camera" style={{ background: 'transparent', border: 'none', color: '#fff' }}><RefreshCw size={20}/></button>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff' }}><X size={20}/></button>
                        </>
                    )}
                </div>
                <div className="video-container" style={{ transform: !previewUrl && facingMode === 'user' ? 'scaleX(-1)' : 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden', minHeight: '300px' }}>
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '400px' }} />
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
                    {previewUrl ? (
                        <>
                            <button className="btn-cancel" onClick={handleRetake} style={{ padding: '10px 20px', borderRadius: '25px', border: '1px solid #fff', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Retake</button>
                            <button className="btn-confirm" onClick={handleConfirmSend} style={{ padding: '10px 20px', borderRadius: '25px', background: 'var(--c-pink)', color: '#fff', border: 'none', cursor: 'pointer' }}>Send Photo</button>
                        </>
                    ) : (
                        <button className="capture-btn" onClick={takePhoto} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={30} color="#000" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
