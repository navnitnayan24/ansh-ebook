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

        const newSocket = io(window.location.origin, {
            auth: { token }
        });

        newSocket.on('connect_error', (err) => {
            console.error("🔌 Socket Connection Error:", err.message);
        });

        newSocket.on('connect', () => {
            console.log("🔌 Socket Connected Successfully");
        });

        setSocket(newSocket);

        newSocket.on('user-status', (data) => {
            setOnlineUsers(prev => ({ ...prev, [data.userId]: data.status }));
        });

        newSocket.on('hey-calling', ({ from, name: callerName, signal, type }) => {
            setCall({ isReceivingCall: true, from, name: callerName, signal, type });
        });

        return () => newSocket.close();
    }, []);

    const answerCall = async () => {
        try {
            const constraints = { audio: true, video: call.type === 'video' };
            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);
            if (myVideoRef.current) myVideoRef.current.srcObject = currentStream;

            setCallAccepted(true);
            const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

            peer.on('signal', (data) => {
                socket.emit('accept-call', { signal: data, to: call.from });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream;
            });

            peer.signal(call.signal);
            connectionRefCurrent.current = peer;
        } catch (err) {
            console.error("Failed to answer call:", err);
            handleMediaError(err);
        }
    };

    const handleMediaError = (err) => {
        console.error("Media Error Detail:", err);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Call Failed: Insecure connection (HTTPS required) or unsupported browser.");
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert("Permission Denied: Please allow camera/mic access in browser settings.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            alert("Hardware Not Found: No camera or microphone detected.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'AbortError') {
            alert("Hardware Busy: Camera/Mic is being used by another app.");
        } else if (err.name === 'TypeError') {
            alert("Call Error: Browser blocked media access. Ensure you are on HTTPS and using a modern browser.");
        } else {
            alert(`Call Error: ${err.message || err.name}. Ensure you use HTTPS.`);
        }
    };

    const callUser = async (id, type) => {
        try {
            const constraints = { audio: true, video: type === 'video' };
            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);
            if (myVideoRef.current) myVideoRef.current.srcObject = currentStream;

            const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = currentUser.id || currentUser._id;

            peer.on('signal', (data) => {
                socket.emit('call-user', { 
                    userToCall: id, 
                    signalData: data, 
                    from: currentUserId,
                    name: currentUser.username, 
                    type 
                });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream;
            });

            socket.on('call-accepted', (signal) => {
                setCallAccepted(true);
                peer.signal(signal);
            });

            connectionRefCurrent.current = peer;
            setCall({ isReceivingCall: false, from: id, type, isCalling: true });
        } catch (err) {
            console.error("Failed to make call:", err);
            
            // Auto-fallback: If video failed, try audio only automatically
            if (type === 'video' && (err.name === 'NotFoundError' || err.name === 'NotReadableError' || err.name === 'TypeError')) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    setStream(audioStream);
                    alert("Camera issues detected. Switching to audio-only call.");
                    // Re-run peer logic for audio
                    const peer = new Peer({ initiator: true, trickle: false, stream: audioStream });
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    peer.on('signal', (data) => {
                        socket.emit('call-user', { 
                            userToCall: id, signalData: data, from: currentUser.id || currentUser._id, name: currentUser.username, type: 'audio' 
                        });
                    });
                    peer.on('stream', (remoteStream) => { if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream; });
                    socket.on('call-accepted', (signal) => { setCallAccepted(true); peer.signal(signal); });
                    connectionRefCurrent.current = peer;
                    setCall({ isReceivingCall: false, from: id, type: 'audio', isCalling: true });
                    return;
                } catch (audioErr) {
                    handleMediaError(audioErr);
                }
            } else {
                handleMediaError(err);
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
