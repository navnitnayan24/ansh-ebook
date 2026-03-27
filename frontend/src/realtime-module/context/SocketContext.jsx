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
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(d => d.kind === 'videoinput');
            const requestVideo = call.type === 'video' && hasVideo;

            const currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: requestVideo, 
                audio: true 
            });
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
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Call Failed: Your browser does not support audio/video calls or you are in an insecure connection (requires HTTPS).");
        } else if (err.name === 'NotAllowedError') {
            alert("Permission Denied: Please allow camera/mic access in your browser settings to continue.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            alert("Hardware Not Found: We couldn't find a camera or microphone. Please check your connections.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            alert("Hardware Busy: Your camera or microphone is being used by another app. Please close other apps and try again.");
        } else {
            alert(`Call Error (${err.name}): Could not access media devices. Ensure you use HTTPS and no other app is using the camera.`);
        }
    };

    const callUser = async (id, type) => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(d => d.kind === 'videoinput');
            const hasAudio = devices.some(d => d.kind === 'audioinput');

            if (!hasAudio) {
                alert("Microphone not found. You need a microphone to make a call.");
                return;
            }

            const requestVideo = type === 'video' && hasVideo;
            if (type === 'video' && !hasVideo) {
                alert("Camera not found. Starting an audio-only call.");
            }

            const currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: requestVideo, 
                audio: true 
            });
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
            setCall({ isReceivingCall: false, from: id, type: requestVideo ? 'video' : 'audio', isCalling: true });
        } catch (err) {
            console.error("Failed to make call:", err);
            handleMediaError(err);
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
