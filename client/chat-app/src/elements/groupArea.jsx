/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import MessageContainer from "./messageContainer";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie'

const GroupArea = () => {
    const username = Cookies.get('username');
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState(null);
    const [messageReceived, setMessageReceived] = useState(null);
    const [joiner, setJoiner] = useState(null);
    const [friend, setFriend] = useState(null);
    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        return () => { if (socket) socket.disconnect(); };
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("receive", (data) => {
            setMessageReceived(data);
        });

        socket.on("joined", (data) => {
            setJoiner(data);
        });
        return () => {
            socket.off('receive_message');
            socket.off('joined_room');
        };
    }, [socket]);

    const joinRoom = () => {
        socket.emit("join", { joiner: username, room: friend });
    };

    const sendMessage = () => {
        socket.emit("send", { sender: username, receiver: friend, message });
    };
    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div>{joiner}</div>
                <div className="chatArea_header">
                    <h1>Chat App</h1>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        {messageReceived}
                    </div>
                </div>
                <div className="chatArea_footer">
                    <input type="text" placeholder="Enter username" onChange={(e) => setFriend(e.target.value)} />
                    <button onClick={joinRoom}>Join room</button>
                    <input type="text" placeholder="Enter message" onChange={(e) => setMessage(e.target.value)} />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div >
    );
};

export default GroupArea;
