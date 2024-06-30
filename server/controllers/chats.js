const { Message } = require('../models/models');
const userSockets = new Map();
const roomSockets = new Map();
const cookie = require('cookie');

const handlerChat = (io) => {
    
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const username = cookies['username'];
        if (!username) return next(new Error('invalid username'));
        socket.username = username;
        next();
    });

    io.on('connection', (socket) => {
        userSockets.set(socket.username, socket.id);
        socket.broadcast.emit("connected", socket.username);

        //////////////////////////////////////////////////////
        // Group codes

        socket.on('create-group', (data) => {
            const room = data.room;
            if (!room) return;
            socket.join(room);
            roomSockets.set(room, socket.id);
            socket.emit('group-created', { room });
            console.log(`Group ${room} created by ${socket.username}`);
        });

        socket.on('join-group', (data) => {
            const room = data.room;
            if (!room) return;
            socket.join(room);
            socket.emit('group-joined', { room });
            socket.to(room).emit('user-joined', { username: socket.username, room });
            console.log(`${socket.username} joined group ${room}`);
        });

        socket.on('send-group-message', (data) => {
            const room = data.room;
            const message = data.message;
            if (!room || !message) return;
            io.to(room).emit('group-message', { sender: socket.username, message });
            console.log(`Message sent to group ${room} by ${socket.username}`);
        });

        //////////////////////////////////////////////////////////////////
        // DM codes

        socket.on("send_message", async ({ receiver, message, sender }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId) return;
            try {
                const newMessage = new Message({
                    sender: sender,
                    message: message,
                    receiver: receiver
                });
                await newMessage.save();
                io.to(targetSocketId).emit("receive_message", { sender, message });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('typing', ({ user, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId) return;
            io.to(targetSocketId).emit('typing', { user, sender: receiver });
        });

        socket.on('not_typing', ({ user, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId) return;
            io.to(targetSocketId).emit('not_typing', { user, receiver });
        });

        socket.on('disconnect', () => {
            userSockets.delete(socket.username);
            socket.broadcast.emit('disconnected', socket.username);
            console.log(`${socket.username} disconnected`);
        });
    });
};

module.exports = { handlerChat };
