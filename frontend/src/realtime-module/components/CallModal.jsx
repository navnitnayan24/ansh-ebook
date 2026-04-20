import React, { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone, X } from 'lucide-react';
import Avatar from '../../components/Avatar';

const CallModal = () => {
    const { call, answerCall, leaveCall, rejectCall, callAccepted, myVideoRef, userVideoRef } = useSocket();
    const ringtoneRef = useRef(new Audio('https://res.cloudinary.com/dhpwp898n/video/upload/v1711516002/whatsapp_ringtone_vqc6vz.mp3'));

    useEffect(() => {
        const ringtone = ringtoneRef.current;
        ringtone.loop = true;
        
        if (!callAccepted && !call.isCalling && call.isReceivingCall) {
            ringtone.play().catch(e => console.log('Autoplay blocked'));
        }

        return () => {
            ringtone.pause();
            ringtone.currentTime = 0;
        };
    }, [callAccepted, call.isCalling, call.isReceivingCall]);

    const handleReject = () => {
        rejectCall();
    };

    return (
        <div className="premium-call-overlay">
            <div className="premium-call-container">
                <div className="call-bg-blur">
                    <Avatar pic={call.fromProfile} username={call.name} className="blur-avatar" />
                </div>
                
                <div className="call-content">
                    <div className="call-header-status">
                        <div className="secure-badge">
                            <span className="lock-icon">🔒</span> End-to-end encrypted
                        </div>
                    </div>

                    <div className="caller-main-info">
                        <div className="caller-avatar-glow">
                            <Avatar 
                                pic={call.fromProfile} 
                                username={call.name} 
                                className="main-caller-avatar"
                            />
                        </div>
                        <h2 className="caller-name-display">{call.name || "Unknown User"}</h2>
                        <div className="call-status-pill">
                            {callAccepted ? (
                                <span className="status-ongoing">00:00</span>
                            ) : (
                                <span className="status-pulsing">
                                    {call.isCalling ? 'Calling...' : (call.type === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call')}
                                </span>
                            )}
                        </div>
                    </div>

                    {callAccepted && (
                        <div className="premium-video-grid">
                            <video playsInline ref={userVideoRef} autoPlay className="peer-video-large" />
                            <video playsInline muted ref={myVideoRef} autoPlay className="my-video-pip" />
                        </div>
                    )}

                    <div className="premium-call-footer">
                        {!callAccepted ? (
                            <div className="pre-call-actions">
                                {call.isCalling ? (
                                    <button className="call-action-btn hangup" onClick={handleReject}>
                                        <PhoneOff size={28}/>
                                        <span>Cancel</span>
                                    </button>
                                ) : (
                                    <div className="incoming-actions-row">
                                        <button className="call-action-btn reject" onClick={handleReject}>
                                            <X size={28}/>
                                            <span>Decline</span>
                                        </button>
                                        <button className={`call-action-btn accept ${call.type === 'video' ? 'video' : 'voice'}`} onClick={answerCall}>
                                            {call.type === 'video' ? <Video size={28}/> : <Phone size={28}/>}
                                            <span>Accept</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="in-call-toolbar">
                                <button className="tool-btn"><MicOff size={22}/></button>
                                <button className="tool-btn hangup-main" onClick={leaveCall}><PhoneOff size={28}/></button>
                                <button className="tool-btn"><VideoOff size={22}/></button>
                                <button className="tool-btn"><Phone size={22}/></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallModal;
