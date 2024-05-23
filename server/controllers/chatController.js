const { Message } = require('../models/models');
const rooms = {};

function generateConversationId(userId1, userId2) {
    // Sort user IDs to ensure the order is consistent
    return [userId1, userId2].sort().join('_');
}

const handlerChat = (io) => {
    io.on('connection', (socket) => {

        // Handle room creation
        socket.on('create_room', (roomName) => {
            if (!rooms[roomName]) {
                rooms[roomName] = new Set(); // Use Set to avoid duplicate entries
                socket.emit('room_created', roomName);
                console.log(`Room ${roomName} created`);
            } else {
                socket.emit('room_exists', roomName);
                console.log(`Room ${roomName} already exists.`);
            }
        });

        // Handle room joining
        socket.on("join_room", (data) => {
            const { joiner, roomName } = data;
            if (rooms[roomName]) {
                rooms[roomName].add(joiner); // Add joiner to the room's Set
                socket.join(roomName);
                socket.emit('joined_room', roomName);
                console.log(`Socket ${joiner} joined room ${roomName}.`);
            } else {
                socket.emit('roomNotFound', roomName);
                console.log(`Room ${roomName} not found.`);
            }
        });

        // Handle sending messages
        socket.on("send_message", async (data) => {
            const { receiver, message, sender } = data;

            // Ensure rooms are properly initialized
            if (!rooms[receiver]) { rooms[receiver] = new Set(); }
            if (!rooms[sender]) {
                rooms[sender] = new Set();
            }
            rooms[receiver].add(socket.id);
            rooms[sender].add(socket.id);
            console.log(rooms.wigo);
            socket.join(receiver);

            try {
                const newMessage = new Message({
                    sender: sender,
                    message: message,
                    receiver: receiver
                });
                await newMessage.save();

                // Emit the message to the receiver's room
                console.log(receiver)
                socket.to(receiver).emit("receive_message", { sender, message });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

    });
};

module.exports = { handlerChat };
