/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";

const DMArea = ({ chat }) => {
    console.log(chat)
    const { params } = useParams();
    const [receiver, setReceiver] = useState('');
    const [socket, setSocket] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [beingTyped, setBeingTyped] = useState(false);
    const user = Cookies.get('username');
    const messagesEndRef = useRef(null);
    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        setBeingTyped(false);
        return () => { newSocket.disconnect(); };
    }, []);

    const handleScrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setScrollToBottom(false);
        }
    };

    useEffect(() => {
        setReceiver(params);
        console.log(params)
    }, [chat]);

    useEffect(() => { handleScrollToBottom(); }, [scrollToBottom]);

    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = () => {
            setRefresh(prev => !prev);
            setScrollToBottom(true);
        };
        const handleTyping = ({ chat, username }) => {
            if (chat == username && username == chat) setBeingTyped(true);
            else setBeingTyped(false);
        };
        const handleNotTyping = () => setBeingTyped(false)
        socket.on("receive_message", handleReceiveMessage);
        socket.on('typing', handleTyping);
        socket.on('not_typing', handleNotTyping);

        // Cleanup function to remove the event listeners
        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
        };
    }, [socket, chat, user]);

    useEffect(() => {
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${user}&receiver=${params}`);
            const data = await response.json();
            setHistory(data.messages);
            setScrollToBottom(true);
        }; fetchMessage();
    }, [chat, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message === "") return;
        socket.emit("send_message", { receiver: receiver, message, sender: user });
        setScrollToBottom(true);
        setMessage("");
        setRefresh(prev => !prev);
        socket.emit("not_typing", { user, chat });
    };

    const handleChange = (e) => {
        const message = e.target.value;
        setMessage(message);
        if (message) socket.emit("typing", { user, receiver });
        else socket.emit("not_typing", { user, receiver });
    }

    const messageOperations = (e) => {
        e.preventDefault()
        alert("message deleted")
    }

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };


    let imageBase64 = '';
    if (chat.imageData && chat.imageData.data) imageBase64 = arrayBufferToBase64(chat.imageData.data)
    else console.warn("No image data found for friend:", chat.username);
    console.log(chat.imageData)


    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div className="chatArea_header">
                    {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" />
                    ) : (
                        <div>No Image</div>
                    )}
                    <h1>{chat.username}</h1>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === user ? (
                                    <div onContextMenu={messageOperations} className="history" key={message._id}>
                                        <div className="chat-sender">
                                            <span className="sender-message">
                                                {message.message}
                                            </span>
                                            <span className="sender-drop">
                                                <img src="/drop.png" alt="" width={30} />
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="history" key={message._id}>
                                        <div className="chat-receiver">
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
                        {beingTyped ? (<div id="typing-indicator">
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
