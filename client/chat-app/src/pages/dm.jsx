/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";

const DMArea = ({ chat }) => {
    const { receiver } = useParams();
    const [socket, setSocket] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [user, setUser] = useState("");
    const [history, setHistory] = useState([]);
    const username = Cookies.get('username');

    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        return () => { if (socket) socket.disconnect(); };
    }, []);

    const messagesEndRef = useRef(null);
    const handleScrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setScrollToBottom(false);
        }
    };

    useEffect(() => {
        handleScrollToBottom();
    }, [scrollToBottom]);

    useEffect(() => {
        if (!socket) return;
        setUser(username);
        socket.on("receive_message", () => {
            setRefresh(!refresh);
            setScrollToBottom(true);
        });

        socket.on("joined_room", (data) => {
        });
        return () => {
            socket.off('receive_message');
            socket.off('joined_room');
        };
    }, [socket]);

    useEffect(() => {
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${username}&receiver=${receiver||chat}`);
            const data = await response.json();
            const message = data.messages;
            setHistory(message);
            setScrollToBottom(true);
        };
        fetchMessage();
    }, [chat, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        if(message === "") return;
        socket.emit("send_message", { receiver: chat, message, sender: user });
        setScrollToBottom(true);
        setMessage("");
        setRefresh(!refresh);
        setScrollToBottom(true);
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
                                message.sender === user ? (
                                    <div className="history" key={message._id} >
                                        <div id="chat-Sender">{message.message}</div>
                                    </div>
                                ) : (
                                    <div className="history" key={message._id}  >
                                        <div id="chat-Receiver">
                                            {message.message}
                                        </div>
                                    </div>
                                )

                            ))
                        ) : (
                            <div style={{ textAlign: 'center', fontSize: '2rem', fontFamily: '700', background: 'linear-gradient(to right,red,blue,white)', color: 'transparent', backgroundClip: 'text' }}>Say hey to your new friend</div>)
                        }
                        <div ref={messagesEndRef} className="chatArea_footer">
                            <form onSubmit={sendMessage}>
                                <input type="text" placeholder="Enter message" value={message} onChange={(e) => setMessage(e.target.value)} />
                                <button type="submit">
                                    <img src="/send.png" alt="Send" width={'40rem'} /></button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
};

export default DMArea;
