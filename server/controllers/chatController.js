const { Message } = require('../models/models');
const userSockets = new Map;
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
        console.log(userSockets);
        socket.broadcast.emit("connected", socket.username);


        socket.on('join', (data) => {
            console.log('joined',data.joiner);
            socket.join(data.room);
            socket.emit('joined', data.joiner);
        });
        socket.on('send', (data) => {
            console.log(data)
            socket.to(data.receiver).emit('receive', data.message);
        })

        socket.on("connected", (socket) => {
            socket.broadcast.emit("connected", socket.username);
        });
        socket.on("send_message", async ({ receiver, message, sender }) => {
            const targetSocketId = userSockets.get(receiver);
            if (!targetSocketId && receiver === null) return;
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

    });
};

module.exports = { handlerChat };
