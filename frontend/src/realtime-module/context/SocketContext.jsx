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
                peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
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
                peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
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
            console.error("Unexpected Make Call Error:", err);
            
            if (type === 'video') {
                try {
                    console.log("Attempting audio-only fallback after video failure...");
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setStream(audioStream);
                    alert("Camera issues detected. Continuing with audio-only.");
                    
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
