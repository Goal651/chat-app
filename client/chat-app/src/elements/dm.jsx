/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams, Link } from "react-router-dom";
import MessageContainer from "./messageContainer";

const socket = io.connect("http://localhost:3001", { withCredentials: true });

const DMArea = ({ chat }) => {
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [friendName, setFriendName] = useState("");
    const [messageReceived, setMessageReceived] = useState("");
    const [joiner, setJoiner] = useState("");
    const [user, setUser] = useState("");
    const [history, setHistory] = useState([]);

    console.log(chat);
    useEffect(() => {
        const username = Cookies.get('username');
        setUser(username);
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${username}&receiver=${chat}`);
            const data = await response.json();
            const message = data.messages;
            setHistory(message);
        }
        fetchMessage();
    }, [refresh, chat]);
    socket.on("receive_message", (data) => {
        setMessageReceived(data);
        console.log(data);
    });

    socket.on("joined_room", (data) => {
        setJoiner(data.sender);
    });

    const sendMessage = (e) => {
        e.preventDefault();
        socket.emit("send_message", { receiver: chat, message, sender: user });
        setMessage("");
        setRefresh(!refresh);
    };

    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div className="chatArea_header">
                    <h1>{chat}</h1>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.username === user ? (
                                    <div style={{ float: "right" }} className="chat-Sender" key={message._id} >{message.message}</div>
                                ) : (
                                    <div key={message._id} id="chat_Receiver" >
                                        {message.message}</div>
                                )

                            ))
                        ) : (
                            <div>No messages available</div>)
                        }
                    </div>
                    <div className="chatArea_message">
                        <div>{messageReceived.message}</div>
                    </div>
                </div>

                <div className="chatArea_footer">
                    <form onSubmit={sendMessage}>
                        <input type="text" placeholder="Enter message" value={message} onChange={(e) => setMessage(e.target.value)} />
                        <button type="submit">Send</button>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default DMArea;
