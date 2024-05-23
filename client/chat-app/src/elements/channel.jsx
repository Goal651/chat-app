/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";
import MessageContainer from "./messageContainer";

const socket = io.connect("http://localhost:3001", { withCredentials: true });

const ChannelArea = () => {
    const username = Cookies.get('username');
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [friend, setFriend] = useState("");
    const [messageReceived, setMessageReceived] = useState("");
    const [joiner, setJoiner] = useState("");
    const [user, setUser] = useState("");
    const [history, setHistory] = useState([]);
    const { receiver } = useParams();
    useEffect(() => {
        const email = Cookies.get('email');
        setUser(email);
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${email}&receiver=${receiver}`);
            const data = await response.json();
            const message = data.messages;
            setHistory(message);
        }
        fetchMessage();
    }, [refresh, receiver]);

    socket.on("receive_message", (data) => {
        setMessageReceived(data.message);
    });

    socket.on("joined_room", (data) => {
        setJoiner(data.sender);
    });

    const sendMessage = () => {
        socket.emit("send_message", { message, sender: user });
        setMessage("");
        setRefresh(!refresh);
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
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                <MessageContainer key={message._id} message={message} />
                            ))
                        ) : (
                            <div>No messages available</div>
                        )}
                    </div>
                </div>
                <div className="chatArea_footer">
                    <input type="text" placeholder="Enter message" value={message} onChange={(e) => setMessage(e.target.value)} />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div >
    );
};

export default ChannelArea;
