const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/message.model');
const Chat = require('./models/chat.model');

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    // Authentication Middleware for Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret', (err, decoded) => {
            if (err) return next(new Error("Authentication error"));
            socket.user = decoded;
            next();
        });
    });

    const onlineUsers = new Map(); // userId -> socketId

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        onlineUsers.set(userId, socket.id);
        console.log(`User connected: ${userId}`);

        // Join a private room for the user
        socket.join(userId);

        // Notify others that user is online
        io.emit('user-status', { userId, status: 'online' });

        // Handle Messaging
        socket.on('send-message', async (data) => {
            const { chatId, receiverId, text, mediaUrl, mediaType } = data;
            
            try {
                const message = await Message.create({
                    chat: chatId,
                    sender: userId,
                    text,
                    mediaUrl,
                    mediaType
                });

                await Chat.findByIdAndUpdate(chatId, { 
                    lastMessage: message._id,
                    $inc: { [`unreadCount.${receiverId}`]: 1 }
                });

                // Send to receiver
                io.to(receiverId).emit('receive-message', message);
                // Send back to sender (for multi-device sync)
                io.to(userId).emit('message-sent', message);

            } catch (err) {
                console.error("Socket Message Error:", err);
            }
        });

        // Typing Indicator
        socket.on('typing', (data) => {
            const { receiverId, isTyping } = data;
            io.to(receiverId).emit('user-typing', { senderId: userId, isTyping });
        });

        // WebRTC Signaling
        socket.on('call-user', (data) => {
            const { userToCall, signalData, from, type } = data;
            io.to(userToCall).emit('hey-calling', { signal: signalData, from, type });
        });

        socket.on('accept-call', (data) => {
            io.to(data.to).emit('call-accepted', data.signal);
        });

        socket.on('end-call', (data) => {
            io.to(data.to).emit('call-ended');
        });

        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            io.emit('user-status', { userId, status: 'offline' });
            console.log(`User disconnected: ${userId}`);
        });
    });

    return io;
};

module.exports = setupSocket;
