import { useEffect } from "react"
import { io } from "socket.io-client"


export default function SocketConfig() {
    const socket = io('localhost:3001')
    useEffect(() => {
        socket.on('connect_error', () => window.location.href = ('/no-internet'))
        socket.on('connect', () => { })
        socket.on('disconnect', () => console.log('disconnected'))
    }, [socket])

    return socket
}