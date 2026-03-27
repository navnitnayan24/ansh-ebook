import React, { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import { useSocket } from '../context/SocketContext';
import { searchUsers, fetchChats, joinGroupByCode } from '../../api';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/Realtime.css';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const { socket, call } = useSocket();

    const location = useLocation();
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            const chatRes = await fetchChats();
            setChats(chatRes.data);

            const userRes = await searchUsers();
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = currentUser.id || currentUser._id;
            setUsers(userRes.data.filter(u => u._id !== currentUserId));
            
            // Handle Join Code from URL
            const params = new URLSearchParams(location.search);
            const joinCode = params.get('join');
            if (joinCode) {
                try {
                    const res = await joinGroupByCode(joinCode.toUpperCase());
                    setSelectedChat(res.data);
                    // Clear the query param without refreshing
                    navigate('/chat', { replace: true });
                } catch (err) {
                    alert("Join link invalid or expired");
                }
            }
        } catch (err) {
            console.error("Failed to load chat data:", err);
        }
    };

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
        <div className="realtime-chat-page">
            <div className="chat-layout">
                <ChatSidebar 
                    chats={chats}
                    users={users} 
                    setSelectedChat={setSelectedChat} 
                    selectedChat={selectedChat} 
                />
                
                <div className={`chat-window-container ${selectedChat ? 'active' : ''}`}>
                    {selectedChat ? (
                        <>
                            <button className="mobile-back-btn" onClick={() => setSelectedChat(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <ChatWindow chat={selectedChat} setSelectedChat={setSelectedChat} />
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <div className="chat-welcome-icon">💎</div>
                            <h2>Kohinoor Premium</h2>
                            <p className="muted-text">Real-time collaboration & private messaging</p>
                            <button className="btn-premium-start" onClick={() => {/* Search trigger */}}>
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
    );
};

export default ChatPage;
