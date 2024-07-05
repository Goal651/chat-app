/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";

const GroupArea = ({ group }) => {
    const { name } = useParams();
    const [socket, setSocket] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [typing, setTyping] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [currentRoom, setCurrentRoom] = useState("");
    const username = Cookies.get('username');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        setTyping(false);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchGroupDetails = async () => {
            const response = await fetch(`http://localhost:3001/getGroup/${name || group.name}`);
            const data = await response.json();
            setCurrentRoom(data.group);
            setGroupName(data.group.name);
        };
        fetchGroupDetails();
    }, [group, name]);

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
        const handleTyping = ({ group, sender }) => {
            if (group === groupName && sender !== username) setTyping(true);
            else setTyping(false);
        };

        const handleNotTyping = () => setTyping(false);

        socket.on("receive_message", handleReceiveMessage);
        socket.on('typing', handleTyping);
        socket.on('not_typing', handleNotTyping);
        socket.on('group-message', handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
            socket.off('group-message', handleReceiveMessage);
        };
    }, [socket, groupName, username]);

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/gmessage/${groupName}`);
            const data = await response.json();
            setHistory(data.gmessages);
            setScrollToBottom(true);
        };
        fetchMessages();
    }, [groupName, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message === "" || !groupName) return;
        socket.emit("send_group_message", { room: groupName, message, sender: username });
        setScrollToBottom(true);
        setMessage("");
        setRefresh(prev => !prev);
        socket.emit("not_typing", { username, group: groupName });
    };

    const handleChange = (e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        if (newMessage) socket.emit("typing", { username, group: groupName });
        else socket.emit("not_typing", { username, group: groupName });
        setScrollToBottom(true);
    };



    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };
    const messageOperations = () => { }

    let imageBase64 = '';
    if (currentRoom && currentRoom.imageData && currentRoom.imageData.data) imageBase64 = arrayBufferToBase64(currentRoom.imageData.data);
    else imageBase64 = '';

    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div className="chatArea_header">
                    {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" />
                    ) : (
                        <img src="/nogro.png" alt="No Group Image" />
                    )}
                    <h1>{currentRoom.name}</h1>
                </div>
                <div style={{ height: '27rem' }} className="overflow-auto ">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === username ? (
                                    <div key={message._id}>
                                        <div className="chat chat-end">
                                            <span className="chat-bubble">
                                                <h5 className="text-white">{message.sender}</h5>
                                                <p>{message.message}</p>
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={message._id}>
                                        <div className="chat chat-start">
                                            <span className="chat-bubble bg-slate-400 text-black">
                                                <h5 className="text-white">{message.sender}</h5>
                                                <p>{message.message}</p>
                                            </span>
                                        </div>
                                    </div>
                                )
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center', fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, red, blue, white)', color: 'transparent', backgroundClip: 'text'
                            }}>
                                Say hey to your new group
                            </div>
                        )}
                        {typing ? (
                            <span className="loading loading-dots loading-md"></span>
                        ) : null}

                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
                <div className="chatArea_footer">
                    <form style={{ width: '100%' }} onSubmit={sendMessage} className=" flex flex-row bg-slate-400 relative  rounded-badge px-4 py-1 justify-between ">
                        <input type="text" placeholder="Enter message" value={message} onChange={handleChange} className="bg-transparent w-full placeholder:text-black" />
                        <button type="submit">
                            <img src="/send.png" alt="Send" className='w-10' />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GroupArea;
