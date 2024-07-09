const { Message, GMessage } = require('../models/models');
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
        console.log('user', socket.id, 'connected')

        //////////////////////////////////////////////////////
        // Group codes
        socket.on('connect-group', ({ room }) => {
            const socketRoom = roomSockets.get(room);
            if (socketRoom) return;
            roomSockets.set(room, socket.id);
            console.log(`${room} joined`);
        });

        socket.on('send_group_message', async ({ message, room, sender }) => {
            const targetRoom = roomSockets.get(room)
            try {
                const newMessage = new GMessage({
                    sender: sender,
                    message: message,
                    group: room
                });
                await newMessage.save();
                io.to(targetRoom).emit("receive_message", { sender, room });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        //////////////////////////////////////////////////////////////////
        // DM codes

        socket.on("send_message", async ({ receiver, message, sender }) => {
            const targetSocketId = userSockets.get(receiver);
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

        socket.on('typing', ({ username, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId) return;
            io.to(targetSocketId).emit('typing', { receiver, sender: username });
        });

        socket.on('not_typing', ({ username, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId) return;
            io.to(targetSocketId).emit('not_typing', { username, receiver });
        });

        socket.on('disconnect', () => {
            userSockets.delete(socket.username);
            socket.broadcast.emit('disconnected', socket.username);
        });
    });
};

module.exports = { handlerChat };
