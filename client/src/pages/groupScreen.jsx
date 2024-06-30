/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";

const GroupArea = ({ friend }) => {
    const { params } = useParams();
    const [socket, setSocket] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [currentRoom, setCurrentRoom] = useState("");
    const user = Cookies.get('username');
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

    const messageOperations = () => { };

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
            if (receiver === user && (friend || params) === sender) setBeingTyped(true);
            else setBeingTyped(false);
        };

        const handleNotTyping = () => setBeingTyped(false);

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
    }, [socket, friend, user]);

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${user}&receiver=${params || friend}`);
            const data = await response.json();
            setHistory(data.messages);
            setScrollToBottom(true);
        };
        fetchMessages();
    }, [friend, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message === "") return;
        if (currentRoom) {
            socket.emit("send-group-message", { room: currentRoom, message });
        } else {
            socket.emit("send_message", { receiver: friend || params, message, sender: user });
        }
        setScrollToBottom(true);
        setMessage("");
        setRefresh(prev => !prev);
        socket.emit("not_typing", { user, receiver: friend });
    };

    const handleChange = (e) => {
        const message = e.target.value;
        setMessage(message);
        if (message) socket.emit("typing", { user, receiver: friend || params });
        else socket.emit("not_typing", { user, receiver: friend || params });
        setScrollToBottom(true);
    };

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (groupName === "") return;
        socket.emit('create-group', { room: groupName });
        setCurrentRoom(groupName);
        setGroupName("");
    };

    const handleJoinGroup = (e) => {
        e.preventDefault();
        if (groupName === "") return;
        socket.emit('join-group', { room: groupName });
        setCurrentRoom(groupName);
        setGroupName("");
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

    let imageBase64 = '';
    if (info.imageData && info.imageData.data) imageBase64 = arrayBufferToBase64(info.imageData.data);
    else imageBase64 = '';

    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div className="chatArea_header">
                    {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" />
                    ) : (
                        <div>No Image</div>
                    )}
                    <h1>{info.username || friend}</h1>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === user ? (
                                    <div onContextMenu={messageOperations} className="history" key={message._id}>
                                        <div className="chat-sender">
                                            <span className="sender-message"> {message.message}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="history" key={message._id}>
                                        <div className="chat-receiver">
                                            <span className="receiver-message"> {message.message}</span>
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
                            <div id="typing-indicator" >
                                <img src="/typing.gif" alt="Typing..." />
                            </div>
                        ) : null}
                        <div className="chatArea_footer">
                            <form onSubmit={sendMessage}>
                                <input type="text" placeholder="Enter message" value={message} onChange={handleChange} />
                                <button type="submit">
                                    <img src="/send.png" alt="Send" width={'40rem'} />
                                </button>
                            </form>
                        </div>
                        <div ref={messagesEndRef} ></div>
                    </div>
                </div>
                <div className="group-controls">
                    <form onSubmit={handleCreateGroup}>
                        <input
                            type="text"
                            placeholder="Create Group"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <button type="submit">Create Group</button>
                    </form>
                    <form onSubmit={handleJoinGroup}>
                        <input
                            type="text"
                            placeholder="Join Group"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <button type="submit">Join Group</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GroupArea;
