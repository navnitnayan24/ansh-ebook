import React from 'react';
import { useSocket } from '../context/SocketContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import Avatar from '../../components/Avatar';

const CallModal = () => {
    const { call, answerCall, leaveCall, callAccepted, myVideoRef, userVideoRef } = useSocket();

    return (
        <div className="call-overlay flex-center">
            <div className="call-modal glass-card text-center">
                <div className="call-info mb-4">
                    <div className="flex-center mb-3">
                        <Avatar 
                            pic={call.fromProfile} 
                            username={call.name} 
                            style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--accent)' }}
                        />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>{call.name || "Unknown User"}</h2>
                    <p className="ringing-animation">
                        {callAccepted ? 'CONVERSING...' : (call.isCalling ? 'CALLING...' : 'INCOMING CALL...')}
                    </p>
                </div>

                {callAccepted && (
                    <div className="video-streams">
                        <video playsInline muted ref={myVideoRef} autoPlay className="my-video" />
                        <video playsInline ref={userVideoRef} autoPlay className="user-video" />
                    </div>
                )}

                <div className="call-actions mt-4">
                    {!callAccepted ? (
                        call.isCalling ? (
                            <button className="btn btn-secondary btn-pill hangup-btn" onClick={leaveCall}>
                                <PhoneOff size={18}/> CANCEL
                            </button>
                        ) : (
                            <div className="flex-center gap-4">
                                <button className="btn btn-primary btn-pill accept-btn" onClick={answerCall}>
                                    <Video size={18}/> {call.type === 'video' ? 'ANSWER' : 'ACCEPT'}
                                </button>
                                <button className="btn btn-secondary btn-pill reject-btn" onClick={leaveCall}>
                                    <PhoneOff size={18}/> REJECT
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="flex-center gap-4">
                            <button className="icon-btn"><Mic size={20}/></button>
                            <button className="icon-btn hangup-btn" onClick={leaveCall}><PhoneOff size={20}/></button>
                            {call.type === 'video' && <button className="icon-btn"><Video size={20}/></button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
