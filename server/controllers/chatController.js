const { Message } = require('../models/models');
const userSockets = new Map;
const cookie = require('cookie');


const handlerChat = (io) => {
  


    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
       
        const username = cookies['username'];
        if (!username) {
            return next(new Error('invalid username'));
        }
        socket.username = username;
        next();
    });


    io.on('connection', (socket) => {
        console.log(socket.username);
        userSockets.set(socket.username, socket.id);
        console.log(userSockets);
        socket.on("connected", (socket) => {
        })

        socket.on("send_message", async ({ receiver, message, sender }) => {

            const targetSocketId = userSockets.get(receiver);
            console.log(targetSocketId)
            if (!targetSocketId) {
                return;
            }
            io.to(targetSocketId).emit("receive_message", { sender, message });
            //     try {
            //         const newMessage = new Message({
            //             sender: sender,
            //             message: message,
            //             receiver: receiver
            //         });
            //         await newMessage.save();

            // Emit the message to the receiver's room
            //         console.log(receiver)
            //         socket.to(receiver).emit("receive_message", { sender, message });
            //     } catch (error) {
            //         console.error('Error saving message:', error);
            //     }
        });

    });
};

module.exports = { handlerChat };
