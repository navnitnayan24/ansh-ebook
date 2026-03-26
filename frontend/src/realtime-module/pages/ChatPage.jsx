import React, { useState, useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import { useSocket } from '../context/SocketContext';
import { fetchUsers } from '../../api'; // Reusing existing user fetch
import '../../styles/Realtime.css';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const { socket, call } = useSocket();

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await fetchUsers();
                // Filter out self
                const currentUser = JSON.parse(localStorage.getItem('user'));
                setUsers(res.data.filter(u => u._id !== currentUser.id));
            } catch (err) {
                console.error("Failed to load users:", err);
            }
        };
        loadUsers();
    }, []);

    return (
        <div className="realtime-chat-page glass-container">
            <div className="chat-layout">
                <ChatSidebar 
                    users={users} 
                    setSelectedChat={setSelectedChat} 
                    selectedChat={selectedChat} 
                />
                {selectedChat ? (
                    <ChatWindow chat={selectedChat} />
                ) : (
                    <div className="no-chat-selected flex-center">
                        <div className="text-center">
                            <div className="chat-welcome-icon">💬</div>
                            <h2>Your Premium Chat Space</h2>
                            <p className="muted-text">Select a user to start a conversation</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Modals */}
            {call.isReceivingCall && !call.callAccepted && (
                <CallModal />
            )}
        </div>
    );
};

export default ChatPage;
