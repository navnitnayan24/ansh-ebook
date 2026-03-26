import React from 'react';
import { useSocket } from '../context/SocketContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const CallModal = () => {
    const { call, answerCall, leaveCall, callAccepted, myVideoRef, userVideoRef } = useSocket();

    return (
        <div className="call-overlay flex-center">
            <div className="call-modal glass-card text-center">
                <div className="call-info mb-4">
                    <img src={call.fromProfile || '/default-avatar.png'} alt="caller" className="caller-avatar" />
                    <h2>{call.name || "Unknown User"}</h2>
                    <p className="muted-text">{call.type.toUpperCase()} CALLING...</p>
                </div>

                {callAccepted && !call.callEnded ? (
                    <div className="video-streams">
                        <video playsInline muted ref={myVideoRef} autoPlay className="my-video" />
                        <video playsInline ref={userVideoRef} autoPlay className="user-video" />
                    </div>
                ) : null}

                <div className="call-actions mt-4">
                    {!callAccepted ? (
                        <div className="flex-center gap-4">
                            <button className="btn btn-primary btn-pill accept-btn" onClick={answerCall}>
                                <Video size={18}/> ANSWER
                            </button>
                            <button className="btn btn-secondary btn-pill reject-btn" onClick={leaveCall}>
                                <PhoneOff size={18}/> REJECT
                            </button>
                        </div>
                    ) : (
                        <div className="flex-center gap-4">
                            <button className="icon-btn"><Mic size={20}/></button>
                            <button className="icon-btn hangup-btn" onClick={leaveCall}><PhoneOff size={20}/></button>
                            <button className="icon-btn"><Video size={20}/></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
