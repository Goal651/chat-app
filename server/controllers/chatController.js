const { Message } = require('../models/models');
const userSockets = new Map;
const roomSockets = new Map;
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
        socket.on("connected", (socket) => {
            socket.broadcast.emit("connected", socket.username);
        });

        //////////////////////////////////////////////////////
        //Group codes


        socket.on('create-group', (data) => {
            roomSockets.set(data.room, socket.id);
            socket.rooms = data.room;
            console.log(userSockets);
            try {



            } catch (error) { }
        });

        socket.on('join-group', (data) => {
            roomSockets.set(data.room, socket.id);
            socket.rooms = data.room
            console.log(userSockets);
        });

        socket.on('join', (data) => {
            console.log('joined', data.joiner, data.room);
            socket.join(data.room);
            socket.broadcast.to(socket.rooms).emit('joined', data.joiner);
        });

        socket.on('send', (data) => {
            const targetRoom = userSockets.get(data.room);
            console.log(data)
            socket.to(targetRoom).emit('receive', data.message);
        })


        //////////////////////////////////////////////////////////////////
        //DM codes

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
        socket.on('typing', ({ user, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            console.log(user + 'Is typing to ' + receiver)
            io.to(targetSocketId).emit('typing', receiver);
        });
        socket.on('not_typing', ({ user, receiver }) => {
            const targetSocketId = userSockets.get(receiver);
            console.log(user + 'Is not typing to ' + receiver)
            io.to(targetSocketId).emit('not_typing', {user,receiver});
        });

    });
};

module.exports = { handlerChat };
