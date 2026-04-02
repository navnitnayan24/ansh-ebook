import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState();
    const [name, setName] = useState('');
    const [myVideo, setMyVideo] = useState();
    const [userVideo, setUserVideo] = useState();
    const [connectionRef, setConnectionRef] = useState();

    const myVideoRef = useRef();
    const userVideoRef = useRef();
    const connectionRefCurrent = useRef();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Determine socket URL: Use VITE_API_URL (minus /api) if available, else fallback to origin
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const socketUrl = apiUrl.replace(/\/api$/, '') || window.location.origin;
        
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'] // Ensure maximum compatibility
        });

        newSocket.on('connect_error', (err) => {
            console.error("🔌 Socket Connection Error:", err.message);
        });

        newSocket.on('connect', () => {
            console.log("🔌 Socket Connected Successfully");
        });

        setSocket(newSocket);

        // --- BROWSER NOTIFICATIONS ---
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const showNotification = (title, body, type = 'message') => {
            if (document.visibilityState === 'visible') return; 
            if ("Notification" in window && Notification.permission === "granted") {
                const notification = new Notification(title, {
                    body,
                    icon: '/logo192.png',
                    tag: type // prevents stacking too many call alerts
                });
                notification.onclick = () => {
                    window.focus();
                };
            }
        };

        newSocket.on('receive-message', (data) => {
            showNotification(
                `New Message from ${data.message.sender?.username || 'Ansh Ebook'}`,
                data.message.text
            );
        });

        newSocket.on('hey-calling', ({ from, name: callerName, type }) => {
            setCall({ isReceivingCall: true, from, name: callerName, type });
            showNotification(
                `Incoming ${type === 'video' ? 'Video' : 'Voice'} Call`,
                `${callerName} is calling you...`,
                'call'
            );
        });

        return () => {
            newSocket.off('receive-message');
            newSocket.off('user-status');
            newSocket.off('hey-calling');
            newSocket.close();
        };
    }, []);

    const answerCall = async () => {
        try {
            const constraints = { audio: true };
            if (call.type === 'video') constraints.video = true;
            
            console.log("Answering call with constraints:", constraints);
            let currentStream;
            try {
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (mediaErr) {
                console.error("Answer Call - getUserMedia Failed:", mediaErr);
                handleMediaError(mediaErr, "getUserMedia");
                return;
            }

            setStream(currentStream);
            if (myVideoRef.current) myVideoRef.current.srcObject = currentStream;

            setCallAccepted(true);
            
            let peer;
            try {
                const iceConfig = { 
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }, 
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ] 
                };
                peer = new Peer({ initiator: false, trickle: false, stream: currentStream, config: iceConfig });
            } catch (peerErr) {
                console.error("Answer Call - Peer Constructor Failed:", peerErr);
                alert("Call Library Error: " + peerErr.message);
                return;
            }

            peer.on('signal', (data) => {
                socket.emit('accept-call', { signal: data, to: call.from });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream;
            });

            peer.on('error', (err) => {
                console.error("Peer Connection Error:", err);
                leaveCall();
            });

            peer.signal(call.signal);
            connectionRefCurrent.current = peer;
        } catch (err) {
            console.error("Unexpected Answer Call Error:", err);
            handleMediaError(err, "Unexpected");
        }
    };

    const handleMediaError = (err, phase = "") => {
        console.error(`🔴 Media Error [${phase}]:`, {
            name: err.name,
            message: err.message,
            stack: err.stack,
            secure: window.isSecureContext,
            origin: window.location.origin
        });
        
        const contextMsg = window.isSecureContext ? " (Secure Context: Yes)" : " (INSECURE CONTEXT: NO HTTPS)";
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Call Failed: Insecure connection (HTTPS required). Browser blocked access." + contextMsg);
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert("Permission Denied: Please allow camera/mic access in your browser settings.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            alert("Hardware Not Found: No camera or microphone detected.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'AbortError') {
            alert("Hardware Busy: Camera/Mic is being used by another app.");
        } else if (err.name === 'TypeError') {
            alert(`Call Error (TypeError) at ${phase}: Potential browser restriction. Ensure HTTPS and valid hardware.` + contextMsg);
        } else {
            alert(`Call Error at ${phase}: ${err.message || err.name}. Please ensure you are on HTTPS.`);
        }
    };

    const callUser = async (id, type) => {
        try {
            const constraints = { audio: true };
            if (type === 'video') constraints.video = true;

            console.log("Initiating call with constraints:", constraints);
            let currentStream;
            try {
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (mediaErr) {
                console.error("Make Call - getUserMedia Failed:", mediaErr);
                handleMediaError(mediaErr, "getUserMedia");
                return;
            }

            setStream(currentStream);
            if (myVideoRef.current) myVideoRef.current.srcObject = currentStream;

            let peer;
            try {
                const iceConfig = { 
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }, 
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ] 
                };
                peer = new Peer({ initiator: true, trickle: false, stream: currentStream, config: iceConfig });
            } catch (peerErr) {
                console.error("Make Call - Peer Constructor Failed:", peerErr);
                alert("Call Library Error: " + peerErr.message);
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = currentUser.id || currentUser._id;

            peer.on('signal', (data) => {
                socket.emit('call-user', { 
                    userToCall: id, 
                    signalData: data, 
                    from: currentUserId,
                    name: currentUser.username, 
                    profile_pic: currentUser.profile_pic,
                    type 
                });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream;
            });

            peer.on('error', (err) => {
                console.error("Peer Connection Error (Caller):", err);
                leaveCall();
            });

            socket.on('call-accepted', (signal) => {
                setCallAccepted(true);
                peer.signal(signal);
            });

            connectionRefCurrent.current = peer;
            setCall({ isReceivingCall: false, from: id, type, isCalling: true });
        } catch (err) {
            console.error("Unexpected Make Call Error:", err);
            
            if (type === 'video') {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setStream(audioStream);
                    alert("Camera issues detected. Continuing with audio-only.");
                    
                    const iceConfig = { 
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' }, 
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:stun2.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ] 
                    };
                    const peer = new Peer({ initiator: true, trickle: false, stream: audioStream, config: iceConfig });
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    peer.on('signal', (data) => {
                        socket.emit('call-user', { 
                            userToCall: id, signalData: data, from: currentUser.id || currentUser._id, name: currentUser.username, profile_pic: currentUser.profile_pic, type: 'audio' 
                        });
                    });
                    peer.on('stream', (remoteStream) => { if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream; });
                    socket.on('call-accepted', (signal) => { setCallAccepted(true); peer.signal(signal); });
                    connectionRefCurrent.current = peer;
                    setCall({ isReceivingCall: false, from: id, type: 'audio', isCalling: true });
                    return;
                } catch (audioErr) {
                    handleMediaError(audioErr, "Auto-Fallback");
                }
            } else {
                handleMediaError(err, "Unexpected");
            }
        }
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRefCurrent.current) connectionRefCurrent.current.destroy();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        window.location.reload();
    };

    return (
        <SocketContext.Provider value={{
            socket,
            call,
            callAccepted,
            myVideoRef,
            userVideoRef,
            stream,
            name,
            setName,
            callEnded,
            me: socket?.id,
            callUser,
            leaveCall,
            answerCall,
            onlineUsers,
            setStream
        }}>
            {children}
        </SocketContext.Provider>
    );
};
