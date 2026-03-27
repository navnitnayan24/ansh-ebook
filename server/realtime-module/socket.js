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

        const secret = process.env.JWT_SECRET || 'ansh_ebook_internal_fallback_secure_2026_@#$';
        jwt.verify(token, secret, (err, decoded) => {
            if (err) return next(new Error("Authentication error"));
            socket.user = decoded;
            next();
        });
    });

    const onlineUsers = new Map(); // userId -> socketId

    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        onlineUsers.set(userId, socket.id);
        console.log(`User connected: ${userId}`);

        // Join a private room for the user (for individual notifications/calls)
        socket.join(userId);

        // Join rooms for all chats the user is part of
        try {
            const userChats = await Chat.find({ participants: userId });
            userChats.forEach(chat => {
                socket.join(chat._id.toString());
            });
        } catch (err) {
            console.error("Error joining chat rooms:", err);
        }

        // Mark any 'sent' messages to 'delivered' now that they are online
        const markDelivered = async () => {
            await Message.updateMany(
                { receiverId: userId, status: 'sent' }, 
                { status: 'delivered' }
            );
        };
        markDelivered();

        // Notify others that user is online
        io.emit('user-status', { userId, status: 'online' });

        // Handle Messaging
        socket.on('send-message', async (data) => {
            const { chatId, receiverId, text, mediaUrl, mediaType } = data;
            
            if (!chatId) {
                console.error("❌ Cannot send message: chatId is missing");
                return;
            }

            try {
                // Ensure socket is in the room
                const roomName = chatId.toString();
                socket.join(roomName);

                const message = await Message.create({
                    chat: chatId,
                    sender: userId,
                    text: text || '',
                    mediaUrl,
                    mediaType
                });

                const chat = await Chat.findByIdAndUpdate(chatId, { 
                    lastMessage: message._id,
                    $inc: { [`unreadCount.${receiverId || 'system'}`]: 1 }
                }, { new: true });

                if (!chat) {
                    console.error(`❌ Chat not found for ID: ${chatId}`);
                    return;
                }

                // Broadcast to the entire chat room
                io.to(roomName).emit('receive-message', message);
                console.log(`📩 Message sent in chat ${chatId} by ${userId}`);
                
                // If it's a 1-to-1 chat and receiver is online, mark as delivered
                if (!chat.isGroup && receiverId && onlineUsers.has(receiverId)) {
                    message.status = 'delivered';
                    await message.save();
                    io.to(chatId.toString()).emit('message-delivered', { messageId: message._id, chatId });
                }

            } catch (err) {
                console.error("Socket Message Error:", err);
            }
        });

        // Typing Indicator
        socket.on('typing', (data) => {
            const { chatId, isTyping } = data;
            // Emit to the room, excluding the sender
            socket.to(chatId.toString()).emit('user-typing', { senderId: userId, isTyping, chatId });
        });

        // Mark Messages as Seen
        socket.on('mark-seen', async (data) => {
            const { chatId } = data;
            try {
                await Message.updateMany(
                    { chat: chatId, sender: { $ne: userId }, status: { $ne: 'seen' } },
                    { status: 'seen' }
                );
                // Notify the room that messages were seen by this user
                io.to(chatId.toString()).emit('messages-seen', { chatId, seenBy: userId });
            } catch (err) {
                console.error("Mark seen error:", err);
            }
        });

        // WebRTC Signaling (remains mostly same, but uses receiverId for direct signaling)
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
