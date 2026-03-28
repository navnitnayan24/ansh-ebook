import React, { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import { useSocket } from '../context/SocketContext';
import { searchUsers, fetchChats, joinGroupByCode } from '../../api';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import '../../styles/Realtime.css';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const { socket, call } = useSocket();
    const searchRef = React.useRef(null);

    const handleStartChatting = () => {
        searchRef.current?.focus();
    };

    const location = useLocation();
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            const chatRes = await fetchChats();
            setChats(chatRes.data);

            const userRes = await searchUsers();
            setUsers(userRes.data);
        } catch (err) {
            console.error("Failed to load chat data:", err);
        }
    };

    useEffect(() => {
        const handleJoinLink = async () => {
            const params = new URLSearchParams(location.search);
            const joinCode = params.get('join')?.trim();
            if (joinCode) {
                // Clear param immediately to prevent loops
                navigate('/chat', { replace: true });
                
                if (window.confirm(`Join this Kohinoor group?`)) {
                    try {
                        const res = await joinGroupByCode(joinCode.toUpperCase());
                        setSelectedChat(res.data);
                        loadData(); // Refresh list
                    } catch (err) {
                        alert("Join link invalid or expired");
                    }
                }
            }
        };
        handleJoinLink();
    }, [location.search]);

    useEffect(() => {
        loadData();
        
        if (socket) {
            socket.on('receive-message', () => loadData());
            socket.on('chat-created', () => loadData());
            socket.on('chat-added', () => loadData());
            socket.on('chat-removed', ({ chatId }) => {
                setChats(prev => prev.filter(c => c._id !== chatId));
                if (selectedChat?._id === chatId) setSelectedChat(null);
            });
        }

        return () => {
            if (socket) {
                socket.off('receive-message');
                socket.off('chat-created');
                socket.off('chat-added');
                socket.off('chat-removed');
            }
        };
    }, [socket]);

    return (
        <ErrorBoundary>
            <div className="realtime-chat-page">
                <div className={`chat-layout ${selectedChat ? 'has-selected-chat' : ''}`}>
                    <ChatSidebar 
                        chats={chats}
                        users={users} 
                        setSelectedChat={setSelectedChat} 
                        selectedChat={selectedChat} 
                        searchRef={searchRef}
                    />
                    
                    <div className="chat-window-container">
                        {selectedChat ? (
                            <ErrorBoundary>
                                <ChatWindow 
                                    chat={selectedChat} 
                                    setSelectedChat={setSelectedChat} 
                                />
                            </ErrorBoundary>
                        ) : (
                            <div className="no-chat-selected">
                                <div className="chat-welcome-icon">💎</div>
                                <h2>Kohinoor Premium</h2>
                                <p className="muted-text">Real-time collaboration & private messaging</p>
                                <button className="btn-premium-start" onClick={handleStartChatting}>
                                    Start a conversation
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {(call.isReceivingCall || call.isCalling) && !call.callEnded && (
                    <CallModal />
                )}
            </div>
        </ErrorBoundary>
    );
};

export default ChatPage;
