/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import MessageContainer from "./messageContainer";
import { useNavigate } from "react-router-dom";

const socket = io.connect("http://localhost:3001", { withCredentials: true });

const GroupArea = () => {
    const navigate=useNavigate();
    const [message, setMessage] = useState("");
    const [friend, setFriend] = useState("");
    const [messageReceived, setMessageReceived] = useState("");
    const [joiner, setJoiner] = useState("");
    const [user, setUser] = useState("");
    const [history, setHistory] = useState([]);


    useEffect(() => {
        const email = Cookies.get('email');
        setUser(email);
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/message?email=${email}`);
            const data = await response.json();
            const message = data.message;
            setHistory(message);
        }
        fetchMessage();
    }, []);

    socket.on("receive_message", (data) => {
        setMessageReceived(data.message);
    });

    socket.on('success', (data) => {
        console.log(data);
        

    })
    socket.on("joined_room", (data) => {
        setJoiner(data.joiner);
    });


    const sendMessage = () => {
        socket.emit("send_message", { friend, message, sender: user });
    };

    const joinRoom = () => {
        socket.emit("join_room", { room: friend, sender: user });
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
                        {history.map((message) => (
                            <MessageContainer key={message._id} history={message} />
                        ))}
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
