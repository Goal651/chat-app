const { Message, GMessage, User } = require('../models/models')
const userSockets = new Map()
const rooms = {}
const cookie = require('cookie')
const mongoose = require('mongoose')


const handlerChat = (io) => {
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '')
        const username = cookies['username']
        if (!username) return next(new Error('invalid username'))
        socket.username = username
        next()
    })

    io.on('connection', (socket) => {
        userSockets.set(socket.username, socket.id)
        io.to(socket.id).emit('online_users', Array.from(userSockets.keys()))
        io.emit('online_users', Array.from(userSockets.keys()))
        socket.broadcast.emit('online_users', Array.from(userSockets.keys()))

        socket.on('connect_group', ({ room }) => {
            if (!rooms[room]) rooms[room] = new Set();
            else socket.emit('room_exists', room);
        })

        socket.on('fetch_online_users', (user) => {
            const targetId = userSockets.get(user)
            io.to(targetId).emit('online_users', Array.from(userSockets.keys()))
        })

        socket.on("join_room", ({ room, user }) => {
            if (rooms[room]) {
                rooms[room].add(user);
                socket.join(room);
                socket.emit('joined_room', room);
            } else socket.emit('roomNotFound', room);
        })

        socket.on('send_group_message', async ({ message, room, sender }) => {
            const senderSocketId = userSockets.get(sender)
            try {
                const newMessage = new GMessage({ sender: sender, message: message, group: room })
                await newMessage.save()
                io.to(senderSocketId).emit("message_sent")
                io.to(room).emit("receive_message", { sender, room })
            } catch (error) { console.error('Error saving message:', error) }
        });


        socket.on("send_message", async ({ receiver, message, sender }) => {
            const targetSocketId = userSockets.get(receiver)
            const senderSocketId = userSockets.get(sender)
            try {
                const newMessage = new Message({ sender: sender, message: message, receiver: receiver });
                await newMessage.save()
                io.to(senderSocketId).emit("message_sent");
                if (targetSocketId) io.to(targetSocketId).emit("receive_message", { sender: sender, message });
                else await User.updateOne({ username: receiver }, { $push: { unreads: { message, sender } } })
            } catch (error) { console.error('Error saving message:', error) }
        })


        socket.on('fetch_unread_messages', async (username) => {
            try {
                const user = await User.findOne({ username: username });
                if (user) {
                    const unreadMessages = user.unreads;
                    socket.emit('unread_messages', unreadMessages);
                }
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        })

        socket.on('typing', ({ username, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId) return;
            io.to(targetSocketId).emit('typing', { receiver, sender: username });
        })


        socket.on('not_typing', ({ username, receiver }) => {
            const targetSocketId = userSockets.get(receiver)
            if (!targetSocketId) return;
            io.to(targetSocketId).emit('not_typing', { sender: username, receiver });
        })

        socket.on('mark_messages_as_read', async ({ sender, receiver }) => {
            const targetSocketId = userSockets.get(sender);
            try {
                await User.updateOne({ username: sender }, { $pull: { unreads: { sender: receiver } } })
                io.to(targetSocketId).emit('marked_as_read');
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        })

        socket.on('disconnect', () => {
            userSockets.delete(socket.username);
            io.emit('online_users', Array.from(userSockets.keys()));
            socket.broadcast.emit('disconnected', socket.username);
        })

    })
}

module.exports = { handlerChat };
