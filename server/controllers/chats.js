const { Message, GMessage, User, Group } = require('../models/models');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

const userSockets = new Map();
const rooms = {};

const formatTime = () => {
    const now = new Date();
    return now.toISOString().slice(11, 16);
};

const handlerChat = async (io) => {
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
    const groups = await Group.find();
    groups.map(group => rooms[group.name] = new Set())
    io.on('connection', (socket) => {
        userSockets.set(socket.user, socket.id);
        io.emit('online_users', Array.from(userSockets.keys()));

        for (const groupName of Object.keys(rooms)) {
            rooms[groupName].add(socket.user);
            socket.join(groupName);
            socket.emit('joined_room', groupName);
        }
        socket.on('fetch_online_users', () => {
            try {
                socket.emit('online_users', Array.from(userSockets.keys()));
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('send_group_message', async ({ message }) => {
            try {
                const newMessage = new GMessage({
                    sender: socket.user,
                    message: message.message,
                    group: message.group,
                    type: message.type,
                    imageData:message.imageData,
                    time: formatTime()
                });

                const savedMessage = await newMessage.save();
                if (!savedMessage) return;
                const roomMembers = rooms[message.group];
                if (!roomMembers) return;

                roomMembers.forEach(member => {
                    if (member !== socket.user) {
                        const receiverSocketId = userSockets.get(member);
                        if (receiverSocketId) {
                            io.to(receiverSocketId).emit("receive_group_message", newMessage);
                        }
                    }
                })

                const senderSocketId = socket.id;
                io.to(senderSocketId).emit("group_message_sent", newMessage);

            } catch (error) {
                console.error('Error sending group message:', error);
            }
        });


        socket.on("send_message", async ({ receiver, message }) => {
            try {
                const newMessage = new Message({ sender: socket.user, message, type: "text", receiver, time: formatTime() });
                const savedMessage = await newMessage.save();
                if (!savedMessage) return;
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", newMessage);
                } else {
                    await User.updateOne({ email: receiver }, { $push: { unreads: { message, sender: socket.user } } });
                }
                io.to(senderSocketId).emit("message_sent", newMessage);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('send_file_message', async (data) => {
            try {
                const { message } = data;
                const uploadDir = path.join(__dirname, '../uploads');
                const photoDir = path.join(uploadDir, 'photo')
                const videoDir = path.join(uploadDir, 'video')
                await fs.mkdir(videoDir, { recursive: true });
                await fs.mkdir(photoDir, { recursive: true });
                const fileExtension = path.extname(message.fileName);
                const fileName = `${Date.now()}_${message.fileName}`;
                const isVideo = message.fileType.startsWith('video/');
                const isPhoto = message.fileType.startsWith('image/');
                console.log(isVideo)
                let filePath;
                if (isVideo) {
                    console.log('Video path:', videoDir, fileName);
                    filePath = path.join(videoDir, fileName);
                } else if (isPhoto) {
                    console.log('Video path:', photoDir, fileName);
                    filePath = path.join(photoDir, fileName);
                } else {
                    return socket.emit('file_upload_error', 'Unsupported file type');
                }
                await fs.writeFile(filePath, Buffer.from(message.file));

                const newMessage = new Message({
                    sender: socket.user,
                    message: filePath,
                    type: message.fileType,
                    receiver: message.receiver,
                    time: formatTime(),
                });
                const savedMessage = await newMessage.save();
                if (!savedMessage) return socket.emit('file_upload_error', 'Error saving file message');
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(message.receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('receive_file', { message: { ...newMessage, preview: message.preview } });
                else await User.updateOne({ email: message.receiver }, { $push: { unreads: { message: filePath, sender: socket.user } } });
                io.to(senderSocketId).emit('message_sent', newMessage);
            } catch (err) {
                console.error('Error sending file message:', err);
                socket.emit('file_upload_error', err.message);
            }
        });
        socket.on('send_group_file_message', async (data) => {
            console.log(data)
            try {
                const { message } = data;
                const uploadDir = path.join(__dirname, '../uploads');
                const photoDir = path.join(uploadDir, 'photo')
                const videoDir = path.join(uploadDir, 'video')
                await fs.mkdir(videoDir, { recursive: true });
                await fs.mkdir(photoDir, { recursive: true });
                const fileExtension = path.extname(message.fileName);
                const fileName = `${Date.now()}_${message.fileName}`;
                const isVideo = message.fileType.startsWith('video/');
                const isPhoto = message.fileType.startsWith('image/');
                console.log(isVideo)
                let filePath;
                if (isVideo) {
                    console.log('Video path:', videoDir, fileName);
                    filePath = path.join(videoDir, fileName);
                } else if (isPhoto) {
                    console.log('Video path:', photoDir, fileName);
                    filePath = path.join(photoDir, fileName);
                } else {
                    return socket.emit('file_upload_error', 'Unsupported file type');
                }
                await fs.writeFile(filePath, Buffer.from(message.file));
                const newMessage = new GMessage({
                    sender: socket.user,
                    message: filePath,
                    group: message.group,
                    type: message.fileType,
                    receiver: message.receiver,
                    imageData:message.imageData,
                    time: formatTime(),
                });
                const savedMessage = await newMessage.save();
                if (!savedMessage) return socket.emit('file_upload_error', 'Error saving file message');
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(message.receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('receive_file', { message: { ...newMessage, preview: message.preview } });
                else await User.updateOne({ email: message.receiver }, { $push: { unreads: { message: filePath, sender: socket.user } } });
                io.to(senderSocketId).emit('message_sent', newMessage);
            } catch (err) {
                console.error('Error sending file message:', err);
                socket.emit('file_upload_error', err.message);
            }
        });

        socket.on('fetch_unread_messages', async () => {
            try {
                const user = await User.findOne({ email: socket.user });
                if (user) socket.emit('unread_messages', user.unreads);
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        });

        socket.on('typing', ({ receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('typing', { sender: socket.user });
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('not_typing', ({ receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('not_typing', { sender: socket.user });
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('mark_messages_as_read', async ({ receiver }) => {
            try {
                const markedAsRead = await User.updateOne({ email: socket.user }, { $pull: { unreads: { sender: receiver } } });
                if (markedAsRead) socket.emit('marked_as_read');
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('call-offer', ({ offer, receiver }) => {
            const receiverSocketId = userSockets.get(receiver);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call-offer', { offer, sender: socket.user });
            } else {
                socket.emit('call_error', 'User not online');
            }
        });

        socket.on('answer_call', ({ answer, sender }) => {
            const callerSocketId = userSockets.get(sender);
            if (callerSocketId) {
                io.to(callerSocketId).emit('call-answer', { answer, receiver: socket.user });
            }
        });

        socket.on('ice-candidate', ({ candidate, to }) => {
            const targetSocketId = userSockets.get(to);
            if (targetSocketId) {
                io.to(targetSocketId).emit('ice-candidate', { candidate, from: socket.user });
            }
        });

        socket.on('end_call', ({ to }) => {
            const targetSocketId = userSockets.get(to);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call_ended', { from: socket.user });
            }
        });

        socket.on('disconnect', () => {
            userSockets.delete(socket.user);
            io.emit('online_users', Array.from(userSockets.keys()));
            for (const groupName of Object.keys(rooms)) {
                rooms[groupName].delete(socket.user)
            }
            socket.broadcast.emit('disconnected', socket.user);
        });
    });
};

module.exports = { handlerChat };
