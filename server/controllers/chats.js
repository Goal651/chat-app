const { Message, GMessage, User } = require('../models/models');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userSockets = new Map();
const rooms = {};

const formatTime = () => {
    const now = new Date();
    return now.toISOString().slice(11, 16); // Returns HH:MM in 24-hour format
};

const handlerChat = (io) => {
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const accessToken = cookies['accesstoken'];
        if (!accessToken) return next(new Error('Invalid token'));

        jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
            if (err) return next(new Error('Invalid token'));
            socket.email = user.email;
            next();
        });
    });

    io.on('connection', (socket) => {
        userSockets.set(socket.email, socket.id);
        io.emit('online_users', Array.from(userSockets.keys()));

        socket.on('connect_group', ({ room }) => {
            if (!rooms[room]) rooms[room] = new Set();
            else socket.emit('room_exists', room);
        });

        socket.on('fetch_online_users', () => {
            socket.emit('online_users', Array.from(userSockets.keys()));
        });

        socket.on("join_room", ({ room, user }) => {
            if (rooms[room]) {
                rooms[room].add(user);
                socket.join(room);
                socket.emit('joined_room', room);
            } else {
                socket.emit('roomNotFound', room);
            }
        });

        socket.on('send_group_message', async ({ message, room }) => {
            try {
                const newMessage = new GMessage({
                    sender: socket.email,
                    message,
                    group: room,
                    time: formatTime()
                });
                await newMessage.save();
                io.to(room).emit("receive_message", newMessage);
            } catch (error) {
                console.error('Error saving group message:', error);
            }
        });

        socket.on("send_message", async ({ receiver, message }) => {
            try {
                const newMessage = new Message({
                    sender: socket.email,
                    message,
                    receiver,
                    time: formatTime()
                });
                await newMessage.save();

                const targetSocketId = userSockets.get(receiver);
                if (targetSocketId) {
                    io.to(targetSocketId).emit("receive_message", newMessage);
                } else {
                    await User.updateOne(
                        { email: receiver },
                        { $push: { unreads: { message, sender: socket.email } } }
                    );
                }

                socket.emit("message_sent", newMessage);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('fetch_unread_messages', async () => {
            try {
                const user = await User.findOne({ email: socket.email });
                if (user) {
                    socket.emit('unread_messages', user.unreads);
                }
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        });

        socket.on('typing', ({ receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (targetSocketId) {
                io.to(targetSocketId).emit('typing', { sender: socket.email });
            }
        });

        socket.on('not_typing', ({ receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (targetSocketId) {
                io.to(targetSocketId).emit('not_typing', { sender: socket.email });
            }
        });

        socket.on('mark_messages_as_read', async ({ receiver }) => {
            try {
                await User.updateOne(
                    { email: socket.email },
                    { $pull: { unreads: { sender: receiver } } }
                );
                socket.emit('marked_as_read');
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
            userSockets.delete(socket.email);
            io.emit('online_users', Array.from(userSockets.keys()));
            socket.broadcast.emit('disconnected', socket.email);
        });
    });
};

module.exports = { handlerChat };
