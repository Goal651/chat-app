import { Socket, Server } from 'socket.io'

const SocketController = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        socket.on('hello', (data) => {
            console.log(data)
        })

        socket.broadcast.emit('hello', 'world')
    })
}

export default SocketController