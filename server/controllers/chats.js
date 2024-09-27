const { Message, GMessage, User, Group } = require('../models/models');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const userSockets = new Map();
const rooms = {};

const formatTime = () => {
    const now = new Date();
    return now.toISOString().slice(11, 16);
};

const readFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath);
        const fileData = data.toString('base64');
        return fileData;
    } catch (err) {
        console.error(err);
        return null;
    }
}

const getPrivateKeyFromConfig = async (email) => {
    try {
        const configPath = path.join(__dirname, '../config.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        return config[`${email}`];
    } catch (error) {
        console.error('Error reading private key from config:', error);
        throw error;
    }
};


const encryptMessage = (publicKey, message) => {
    const encryptedData = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        Buffer.from(message, 'utf-8')
    );
    return encryptedData.toString('base64');
};


const handlerChat = async (io) => {
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const accessToken = cookies['accessToken'];
        if (!accessToken) return next(new Error('Invalid token'));
        jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
            if (err) return next(new Error('Invalid token'))
            socket.user = user.email
            next()
        })
    })

    const groups = await Group.find()
    groups.map(group => rooms[group.name] = new Set())

    io.on('connection', async (socket) => {
        userSockets.set(socket.user, socket.id)
        io.emit('online_users', Array.from(userSockets.keys()));
        await User.updateOne({ email: socket.user }, { lastActiveTime: Date.now() })
        for (const groupName of Object.keys(rooms)) {
            rooms[groupName].add(socket.user)
            socket.join(groupName)
            socket.emit('joined_room', groupName)
        }

        socket.on('fetch_online_users', () => {
            try {
                socket.emit('online_users', Array.from(userSockets.keys()));
            } catch (err) { console.error(err); }
        });


        socket.on('send_group_message', async ({ message }) => {
            try {
                const senderUser = await User.findOne({ email: socket.user })
                const senderPublicKey = senderUser.publicKey;
                const encryptedMessage = encryptMessage(senderPublicKey, message.message)
                const newMessage = new GMessage({
                    sender: socket.user,
                    message: encryptedMessage,
                    group: message.group,
                    type: message.type,
                    time: message.time
                });
                const savedMessage = await newMessage.save();
                if (!savedMessage) return null;
                const senderSocketId = userSockets.get(socket.user);
                socket.to(message.group).emit("receive_group_message", { message: { ...newMessage._doc, message: message.message } });
                io.to(senderSocketId).emit("group_message_sent", { message: { ...newMessage._doc, message: message.message } });
            } catch (error) {
                console.error('Error sending group message:', error);
            }
        });


        socket.on("send_message", async ({ receiver, message }) => {
            try {
                const receiverUser = await User.findOne({ email: receiver });
                if (!receiverUser || !receiverUser.publicKey) throw new Error("Receiver's public key not found");
                const receiverPublicKey = receiverUser.publicKey;
                const encryptedMessage = encryptMessage(receiverPublicKey, message);
                const newMessage = new Message({
                    sender: socket.user,
                    message: encryptedMessage,
                    type: "text",
                    receiver,
                    time: formatTime(),
                });
                const savedMessage = await newMessage.save();
                if (!savedMessage) return null;
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", { newMessage: { ...newMessage._doc, message } });
                else await User.updateOne({ email: receiver }, { $push: { unreads: { message: encryptedMessage, sender: socket.user } } });
                io.to(senderSocketId).emit("message_sent", { newMessage: { ...newMessage._doc, message } });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('message_not_seen', async ({ message, sender }) => {
            console.log(message, sender)
            const receiverUser = await User.findOne({ email: socket.user });
            if (!receiverUser || !receiverUser.publicKey) throw new Error("Receiver's public key not found");
            const receiverPublicKey = receiverUser.publicKey;
            const encryptedMessage = encryptMessage(receiverPublicKey, message);
            await User.updateOne({ email: socket.user }, { $push: { unreads: { message: encryptedMessage, sender: sender } } });
        })

        socket.on('send_file_message', async (data) => {
            try {
                const { message } = data;
                const newMessage = new Message({
                    sender: socket.user,
                    message: message.message,
                    type: message.fileType,
                    receiver: message.receiver,
                    time: formatTime(),
                });
                const filePreview = await readFile(message.message)
                const preview = `data:${message.fileType};base64,${filePreview}`
                const savedMessage = await newMessage.save();
                if (!savedMessage) return socket.emit('file_upload_error', 'Error saving file message');
                const senderSocketId = userSockets.get(socket.user);
                const receiverSocketId = userSockets.get(message.receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('receive_file', { newMessage: { ...newMessage._doc, file: preview } });
                else await User.updateOne({ email: message.receiver }, { $push: { unreads: { message: message.message, sender: socket.user } } });
                io.to(senderSocketId).emit('message_sent', { newMessage: { ...newMessage._doc, file: preview } });
            } catch (err) {
                console.error('Error sending file message:', err);
            }
        });

        socket.on('send_group_file_message', async (data) => {
            try {
                const { message } = data;
                const newMessage = new GMessage({
                    sender: socket.user,
                    message: message.fileName,
                    group: message.group,
                    type: message.fileType,
                    time: formatTime(),
                });
                const sentMessage = { ...newMessage._doc, image: message.imageData };
                const savedMessage = await newMessage.save();
                if (!savedMessage) return socket.emit('file_upload_error', 'Error saving file message');
                const senderSocketId = userSockets.get(socket.user);
                io.to(senderSocketId).emit('group_message_sent', { message: sentMessage })
                socket.to(message.group).emit('receive_group_message', { message: sentMessage })
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

        socket.on('mark_message_as_read', async ({ sender }) => {
            try {
                const result = await User.updateOne({ email: socket.user }, { $pull: { unreads: { sender: sender } } })
            } catch (err) {
                console.error(err)
            }
        })

        socket.on('typing', ({ receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('typing', { sender: socket.user });
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('member_typing', ({ group }) => {
            socket.to(group).emit('member_typing', { member: socket.user, group })
        })

        socket.on('not_typing', ({ receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) io.to(receiverSocketId).emit('not_typing', { sender: socket.user });
            } catch (err) {
                console.error(err);
            }
        });


        // Handling Seen Messages for DMs
        socket.on('message_seen', async ({ receiver, messageId }) => {
            try {
                const updateResult = await Message.updateOne({ _id: messageId, receiver: socket.user }, { $set: { seen: true } });
                if (updateResult) {
                    const receiverSocketId = userSockets.get(receiver);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('user_saw_message', { id: messageId, member: socket.user });
                    }
                }
            } catch (error) {
                console.error('Error marking message as seen:', error);
            }
        });
        // Event to join room and mark all messages as read
        socket.on('join_room_and_mark_read', async ({ group }) => {
            try {
                // Mark all messages in the group as read for this user
                const messages = await GMessage.find({ group: group, 'seen.member': { $ne: socket.user } });

                for (const message of messages) {
                    await GMessage.updateOne(
                        { _id: message._id },
                        { $addToSet: { seen: { member: socket.user, timestamp: new Date() } } } // Add user to seen if not already present
                    );
                }

                // Notify others in the group
                socket.to(group).emit('group_message_seen', { messages: messages.map(msg => msg._id), user: socket.user });

            } catch (error) {
                console.error('Error marking messages as read when joining room:', error);
            }
        });


        socket.on('group_message_seen', async ({ id, group }) => {
            try {
                const updateResult = await GMessage.updateOne({ _id: id, group: group, 'seen.member': { $ne: socket.user } }, { $addToSet: { seen: { member: socket.user, timestamp: new Date() } } });
                if (!updateResult) return
                socket.to(group).emit('member_saw_message', { id, member: socket.user })
            } catch (err) { console.error(err) }

        })


        socket.on('call-offer', ({ offer, receiver }) => {
            try {
                const receiverSocketId = userSockets.get(receiver);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('call-offer', { offer, sender: socket.user });
                } else {
                    socket.emit('call_error', 'User not online');
                }
            } catch (error) {
                console.error('Error handling call offer:', error);
                socket.emit('call_error', 'Unable to send call offer');
            }
        });

        socket.on('answer_call', ({ answer, sender }) => {
            try {
                const callerSocketId = userSockets.get(sender);
                if (callerSocketId) {
                    io.to(callerSocketId).emit('call-answer', { answer, receiver: socket.user });
                } else {
                    socket.emit('call_error', 'Caller not available');
                }
            } catch (error) {
                console.error('Error handling call answer:', error);
                socket.emit('call_error', 'Unable to send call answer');
            }
        });

        socket.on('ice-candidate', ({ candidate, to }) => {
            try {
                const targetSocketId = userSockets.get(to);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('ice-candidate', { candidate, from: socket.user });
                } else {
                    socket.emit('call_error', 'Target user not available for ICE candidate');
                }
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
                socket.emit('call_error', 'Unable to send ICE candidate');
            }
        });

        socket.on('end_call', ({ to }) => {
            try {
                const targetSocketId = userSockets.get(to);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call_ended', { from: socket.user });
                }
            } catch (error) {
                console.error('Error handling call end:', error);
                socket.emit('call_error', 'Unable to end call');
            }
        });


        socket.on('disconnect', async () => {
            const result = await User.updateOne({ email: socket.user }, { lastActiveTime: Date.now() });
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
