const { Message, GMessage, User } = require('../models/models');
const userSockets = new Map();
const rooms = {};
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

        socket.on('connect_group', ({ room }) => {
            if (!rooms[room]) {
                rooms[room] = new Set(); // Use Set to avoid duplicate entries
                console.log(`Room ${room} created`);
            } else {
                socket.emit('room_exists', room)
                console.log(`Room ${room} already exists.`);
            }
        });

        // Handle room joining
        socket.on("join_room", ({ room, user }) => {
            if (rooms[room]) {
                rooms[room].add(user);
                socket.join(room);
                socket.emit('joined_room', room);
                console.log(`Socket ${user} joined room ${room}.`);
            } else {
                socket.emit('roomNotFound', room);
                console.log(`Room ${room} not found.`);
            }
        })



        socket.on('send_group_message', async ({ message, room, sender }) => {
            console.log(rooms);
            try {
                const newMessage = new GMessage({
                    sender: sender,
                    message: message,
                    group: room
                });
                await newMessage.save();
                io.to(room).emit("receive_message", { sender, room })
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
                if (targetSocketId) io.to(targetSocketId).emit("receive_message", { sender, message })
                else await User.updateOne(
                    { username: receiver },
                    { $push: { unread: { message, sender } } }
                );
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
            io.to(targetSocketId).emit('not_typing', { sender: username, receiver });
        });


        socket.on('mark_messages_as_read', async ({ sender }) => {
            try {
                await User.updateOne(
                    { username: socket.username },
                    { $pull: { unread: { sender } } }
                );
                console.log(`Messages from ${sender} marked as read for ${socket.username}`);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
            userSockets.delete(socket.username);
            socket.broadcast.emit('disconnected', socket.username);
        });
    });
};

module.exports = { handlerChat };
