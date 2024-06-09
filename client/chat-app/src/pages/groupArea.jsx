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

    const sendMessage = (e) => {
        e.preventDefault();
        socket.emit("send", { sender: username, receiver: friend, message });
    };
    return (
        <div id="chatArea" className="groupArea">
            <div className="joinGroup">
                <input type="text" placeholder="Enter username" onChange={(e) => setFriend(e.target.value)} />
                <button onClick={joinRoom}>Join room</button>
            </div>
            <div className="groupArea_container">
                <div className="newJoiner">{joiner}</div>
                <div className="">
                    <h2>Chat App</h2>
                </div>
                <div className="">
                    <div className="messageReceived">
                        {messageReceived}
                    </div>
                </div>
                <div className="groupArea_footer">
                    <form onSubmit={sendMessage}>
                        <input type="text" placeholder="Enter message" onChange={(e) => setMessage(e.target.value)} />
                        <button type="submit" onClick={sendMessage}>Send</button>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default GroupArea;
