/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";

const DMArea = ({ friend }) => {
    const { params } = useParams();
    const [socket, setSocket] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const username = Cookies.get('username');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        setBeingTyped(false);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchUserDetails = async () => {
            const response = await fetch(`http://localhost:3001/getUser/${params || friend}`);
            const data = await response.json();
            setInfo(data.user);
        };
        fetchUserDetails();
    }, [friend, params]);

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
        const handleReceiveMessage = () => {
            setRefresh(prev => !prev);
            setScrollToBottom(true);
        };

        const handleTyping = ({ receiver, sender }) => {
            if ((receiver === username && friend) || params === sender) setBeingTyped(true);
            else setBeingTyped(false);
        };

        const handleNotTyping = ({ sender, receiver }) => {
            if ((receiver === username && friend) || params === sender) setBeingTyped(false);
        };

        socket.on('unread_messages', (count) => {
            setUnreadMessages(count);
        });
        socket.on("receive_message", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("not_typing", handleNotTyping);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
        };
    }, [socket, friend, username]);

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${username}&receiver=${params || friend}`);
            const data = await response.json();
            setHistory(data.messages);
            setScrollToBottom(true);
        };
        fetchMessages();
    }, [friend, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message === "") return;
        socket.emit("send_message", { receiver: friend || params, message, sender: username });
        setScrollToBottom(true);
        setMessage("");
        setRefresh(prev => !prev);
        socket.emit("not_typing", { username, receiver: friend || params });
    };

    const handleChange = (e) => {
        const { value } = e.target
        setMessage(value)
        console.log(e.target.value)
        if (message !== "") socket.emit("typing", { username, receiver: friend || params });
        else socket.emit("not_typing", { username, receiver: friend || params });
        setScrollToBottom(true);
    };

    const messageOperations = () => { }

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
    if (info.imageData && info.imageData.data) imageBase64 = arrayBufferToBase64(info.imageData.data);
    else imageBase64 = '';

    return (
        <div id="chatArea">
            <div className="flex flex-col">
                <div className="">
                    {imageBase64 ? (<img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-14 w-14"/>)
                        : (<img src="/nopro.png" alt="No Profile"  className="h-14"/>)}
                    <h1>{info.username || friend}</h1>
                </div>
                
                <div style={{ height: '27rem' }} className="overflow-auto ">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === username ? (
                                    <div key={message._id}>
                                        <div className="chat chat-end ">
                                            <span className="chat-bubble bg-blue-600 text-white"> {message.message}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={message._id}>
                                        <div className="chat chat-start">
                                            <span className="chat-bubble bg-slate-400 text-black"> {message.message}</span>
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center', fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, red, blue, white)', color: 'transparent', backgroundClip: 'text'
                            }}>
                                Say hey to your new friend
                            </div>
                        )}
                        {beingTyped ? (
                            <div id="typing-indicator">
                                <img src="/typing.gif" alt="Typing..." />
                            </div>
                        ) : null}

                        <div ref={messagesEndRef} ></div>
                    </div>
                </div>
                <div className="">
                    <form style={{ width: '100%' }} onSubmit={sendMessage} className=" flex flex-row bg-slate-400 relative  rounded-badge px-4 py-1 justify-between ">
                        <input type="text" placeholder="Enter message" value={message} onChange={handleChange} className="bg-transparent w-full placeholder:text-black" />
                        <button type="submit">
                            <img src="/send.png" alt="Send" className="w-10" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DMArea;
