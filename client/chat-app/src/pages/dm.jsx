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
    const [typing, setTyping] = useState(false);
    const username = Cookies.get('username');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        setTyping(false);
        return () => { newSocket.disconnect(); };
    }, []);

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

        const handleReceiveMessage = () => {
            setRefresh(prev => !prev);
            setScrollToBottom(true);
        };

        const handleTyping = ({ username, chat }) => {
            if (chat == username && username == chat) setTyping(true);
            else setTyping(false);
        };

        const handleNotTyping = () => {
            setTyping(false);
        }

        socket.on("receive_message", handleReceiveMessage);
        socket.on('typing', handleTyping);
        socket.on('not_typing', handleNotTyping);

        // Cleanup function to remove the event listeners
        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
        };
    }, [socket, chat, username]);

    useEffect(() => {
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${username}&receiver=${receiver || chat}`);
            const data = await response.json();
            setHistory(data.messages);
            setScrollToBottom(true);
        }; fetchMessage();
    }, [chat, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message === "") return;
        socket.emit("send_message", { receiver: chat, message, sender: user });
        setScrollToBottom(true);
        setMessage("");
        setRefresh(prev => !prev);
        setTyping(false);
        socket.emit("not_typing", { username, chat });
    };

    const handleChange = (e) => {
        const message = e.target.value;
        setMessage(message);
        if (message) socket.emit("typing", { username, chat });
        else socket.emit("not_typing", { username, chat });
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
                                    <div className="history" key={message._id}>
                                        <div id="chat-Sender">{message.message}</div>
                                    </div>
                                ) : (
                                    <div className="history" key={message._id}>
                                        <div id="chat-Receiver">
                                            {message.message}
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', fontSize: '2rem', fontFamily: '700', background: 'linear-gradient(to right,red,blue,white)', color: 'transparent', backgroundClip: 'text' }}>
                                Say hey to your new friend
                            </div>
                        )}
                        {typing === true ? (<div id="typing-indicator">
                            <img src="/typing.gif" alt="Typing..." />
                        </div>) : null}
                        <div ref={messagesEndRef} className="chatArea_footer">

                            <form onSubmit={sendMessage}>
                                <input type="text" placeholder="Enter message" value={message} onChange={handleChange} />
                                <button type="submit">
                                    <img src="/send.png" alt="Send" width={'40rem'} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DMArea;
