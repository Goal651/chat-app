import { Socket, Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import SocketAuthController from '../auth/SocketAuthController';

const SocketController = (io: Server) => {
    const userSockets: Record<string, string[]> = {};
    SocketAuthController(io);

    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.data?.user?.userId}`);

        if (!socket.data?.user?.userId) {
            socket.disconnect();
            return;
        }

        if (!userSockets[socket.data.user.userId])
            userSockets[socket.data.user.userId] = []

        userSockets[socket.data.user.userId].push(socket.id);

        socket.on('message', (data: { receiverId: string; message: string }) => {
            const { receiverId, message } = data;
            const userId = socket.data.user.userId;

            // Send message to sender's active sockets
            if (userSockets[userId]) {
                userSockets[userId].forEach((socketId) => {
                    io.to(socketId).emit('message', { from: userId, message });
                });
            }

            // Send message to receiver's active sockets
            if (userSockets[receiverId]) {
                userSockets[receiverId].forEach((socketId) => {
                    io.to(socketId).emit('message', { from: userId, message });
                });
            }
        });


        socket.on('disconnect', () => {
            console.log('Disconnect event triggered');
            for (const userId in userSockets) {
                const index = userSockets[userId].indexOf(socket.id);
                if (index !== -1) {
                    userSockets[userId].splice(index, 1);
                    if (userSockets[userId].length === 0) delete userSockets[userId];
                    break;
                }
            }
        });
    });
};

export default SocketController;
