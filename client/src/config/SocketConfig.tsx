import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

export default function SocketConfig() {
    const socket: Socket = io('http://localhost:3001', {
        auth: {
            token: localStorage.getItem('token'),
        },
        reconnectionAttempts: 5, // Retry connection 5 times
        timeout: 10000, // Timeout after 10 seconds
    });

    useEffect(() => {
        // Handle connection errors
        socket.on('connect_error', (error) => {
            if (error.message.includes('Authentication error')) {
                // Redirect to login page for authentication errors only if not already redirected
                if (!localStorage.getItem('redirected')) {
                    console.log('Authentication error');
                    localStorage.setItem('redirected', 'true'); // Mark as redirected
                    window.location.href = '/login';
                }
            } else {
                // Handle other errors, but don't redirect here to avoid infinite loop
                console.log('Else error');
            }
        });

        // Handle successful connection
        socket.on('connect', () => {
            console.log('Connected to the server');
            localStorage.removeItem('redirected'); // Clear redirect flag if successfully connected
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.warn(`Disconnected: ${reason}`);
            if (reason === 'io server disconnect') {
                // The server disconnected the client
                console.warn('Server disconnected the client, reconnecting...');
                socket.connect();
            } else if (reason === 'io client disconnect') {
                console.warn('Client intentionally disconnected');
            } else {
                console.warn('Disconnected for other reasons');
            }
        });

        // Handle other error events
        socket.on('error', (error) => {
            console.error('Socket error:', error.message);
        });

        return () => {
            // Clean up socket listeners on component unmount
            socket.off('connect_error');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('error');
        };
    }, [socket]);

    return socket;
}
