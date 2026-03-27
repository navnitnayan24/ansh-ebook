import React, { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import { useSocket } from '../context/SocketContext';
import { searchUsers, fetchChats } from '../../api';
import { ArrowLeft } from 'lucide-react';
import '../../styles/Realtime.css';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const { socket, call } = useSocket();

    const loadData = async () => {
        try {
            const chatRes = await fetchChats();
            setChats(chatRes.data);

            const userRes = await searchUsers();
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = currentUser.id || currentUser._id;
            setUsers(userRes.data.filter(u => u._id !== currentUserId));
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
        }

        return () => {
            if (socket) {
                socket.off('receive-message');
                socket.off('chat-created');
                socket.off('chat-added');
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
                            <ChatWindow chat={selectedChat} />
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
