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
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: call.type === 'video', audio: true });
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
            console.error("Failed to get media stream:", err);
            alert("Please allow camera/mic access to answer the call.");
        }
    };

    const callUser = async (id, type) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
            setStream(currentStream);
            if (myVideoRef.current) myVideoRef.current.srcObject = currentStream;

            const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

            peer.on('signal', (data) => {
                socket.emit('call-user', { userToCall: id, signalData: data, from: socket.id, name, type });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideoRef.current) userVideoRef.current.srcObject = remoteStream;
            });

            socket.on('call-accepted', (signal) => {
                setCallAccepted(true);
                peer.signal(signal);
            });

            connectionRefCurrent.current = peer;
            setCall({ isReceivingCall: false, from: id, type, isCalling: true }); // Mark as calling
        } catch (err) {
            console.error("Failed to get media stream:", err);
            alert("Please allow camera/mic access to make a call.");
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
