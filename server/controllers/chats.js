const { Message, GMessage, User } = require('../models/models');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises

const userSockets = new Map();
const rooms = {};

const formatTime = () => {
    const now = new Date();
    return now.toISOString().slice(11, 16);
};

const handlerChat = (io) => {
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const accessToken = cookies['accessToken'];
        if (!accessToken) return next(new Error('Invalid token'));
        jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
            if (err) return next(new Error('Invalid token'));
            socket.user = user.email;
            next();
        });
    });

    io.on('connection', (socket) => {
        userSockets.set(socket.user, socket.id);
        io.emit('online_users', Array.from(userSockets.keys()))

        socket.on('connect_group', ({ room }) => {
            try {
                if (!rooms[room]) rooms[room] = new Set();
                else socket.emit('room_exists', room);
            } catch (err) { console.error(err) }
        });

        socket.on('fetch_online_users', () => {
            try {
                socket.emit('online_users', Array.from(userSockets.keys()))
            } catch (err) { console.error(err) }
        });

        socket.on("join_room", ({ room }) => {
            try {
                if (rooms[room]) {
                    rooms[room].add(socket.user);
                    socket.join(room);
                    socket.emit('joined_room', room);
                } else socket.emit('roomNotFound', room);
            } catch (err) { console.error(err) }
        });

        socket.on('send_group_message', async ({ message, room }) => {
            try {
                const newMessage = new GMessage({ sender: socket.user, message, group: room, time: formatTime() });
                await newMessage.save();
                io.to(room).emit("receive_message", newMessage);
            } catch (error) { console.error('Error saving group message:', error); }
        });

        socket.on("send_message", async ({ receiver, message }) => {
            try {
                const newMessage = new Message({ sender: socket.user, message, type: "text", receiver, time: formatTime() });
                const savedMessage = await newMessage.save();
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", newMessage);
                else await User.updateOne({ email: receiver }, { $push: { unreads: { message, sender: socket.user } } });
                if (savedMessage) io.to(senderSocketId).emit("message_sent", newMessage);
            } catch (error) { console.error('Error sending message:', error) }
        });

        socket.on('send_file_message', async (data) => {
            try {
                const { message } = data;
                const uploadDir = path.join(__dirname, 'uploads');
                await fs.mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, `${Date.now()}_${message.fileName}`);
                await fs.writeFile(filePath, Buffer.from(message.file)); 
                const newMessage = new Message({ sender: socket.user, message: filePath, type: 'file', receiver: message.receiver, time: formatTime(), });
                const savedMessage = await newMessage.save();
                console.log(filePath)
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(message.receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', newMessage);
                else await User.updateOne({ email: message.receiver }, { $push: { unreads: { message: filePath, sender: socket.user } } });
                if (savedMessage) io.to(senderSocketId).emit('message_sent', newMessage);
            } catch (err) {
                console.error('Error sending file message:', err);
                socket.emit('file_upload_error', err.message);
            }
        });

        socket.on('fetch_unread_messages', async () => {
            try {
                const user = await User.findOne({ email: socket.user });
                if (user) socket.emit('unread_messages', user.unreads);
            } catch (error) { console.error('Error fetching unread messages:', error) }
        });

        socket.on('typing', ({ receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('typing', { sender: socket.user });
            } catch (err) { console.error(err) }
        });

        socket.on('not_typing', ({ receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('not_typing', { sender: socket.user });
            } catch (err) { console.error(err) }
        });

        socket.on('mark_messages_as_read', async ({ receiver }) => {
            try {
                const markedAsRead = await User.updateOne({ email: socket.user }, { $pull: { unreads: { sender: receiver } } });
                if (markedAsRead) socket.emit('marked_as_read');
            } catch (error) { console.error('Error marking messages as read:', error); }
        });

        socket.on('disconnect', () => {
            userSockets.delete(socket.user);
            io.emit('online_users', Array.from(userSockets.keys()));
            socket.broadcast.emit('disconnected', socket.user);
        });
    });
}

module.exports = { handlerChat };
