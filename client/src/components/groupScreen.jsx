/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from 'js-cookie';
import { useParams } from "react-router-dom";

const GroupArea = ({ group, socket }) => {
    const { name } = useParams();
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
        const fetchGroupDetails = async () => {
            const response = await fetch(`http://localhost:3001/getGroup/${name || group.name}`);
            const data = await response.json();
            if (data.group) {
                setCurrentRoom(data.group);
                setGroupName(data.group.name);
            }
        };
        fetchGroupDetails();
    }, [group, name]);

    const handleScrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setScrollToBottom(false);
        }
    }, []);

    useEffect(() => {
        handleScrollToBottom();
    }, [scrollToBottom, handleScrollToBottom]);

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
            const response = await fetch(`http://localhost:3001/gmessage/${groupName || name}`);
            const data = await response.json();
            setHistory(data.gmessages);
            setScrollToBottom(true);
        };
        fetchMessages();
    }, [groupName, name, refresh]);

    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (message === "" || !groupName) return;
        socket.emit("send_group_message", { room: groupName || name, message, sender: username });
        setMessage("");
        setRefresh(prev => !prev);
        socket.emit("not_typing", { username, group: groupName || name });
    }, [message, groupName, name, username, socket]);

    const handleChange = useCallback((e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        if (newMessage) socket.emit("typing", { username, group: groupName || name });
        else socket.emit("not_typing", { username, group: groupName || name });
        setScrollToBottom(true);
    }, [groupName, name, username, socket]);

    const arrayBufferToBase64 = useCallback((buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }, []);

    const imageBase64 = useMemo(() => {
        if (currentRoom && currentRoom.imageData && currentRoom.imageData.data) {
            return arrayBufferToBase64(currentRoom.imageData.data);
        }
        return '';
    }, [currentRoom, arrayBufferToBase64]);

    return (
        <div id="chatArea">
            <div className="">
                <div className="flex mb-5 ">
                    {imageBase64 ? (
                        <img src={`data:image/png;base64,${imageBase64}`} alt="Fetched Image" className="w-14  rounded-lg" />
                    ) : (
                        <img src="/nogro.png" alt="No Group Image" className="w-14 rounded-lg" />
                    )}
                    <div className="font-semibold ml-5">{currentRoom.name}</div>
                </div>
                <div style={{ height: '30rem' }} className="overflow-auto">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                <div key={message._id}>
                                    <div className={message.sender === username ? "chat chat-end" : "chat chat-start"}>
                                        <span className="chat-bubble bg-slate-400 text-black">
                                            <h5 className="text-white">{message.sender === username ? 'You' : message.sender}</h5>
                                            <p>{message.message}</p>
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center', fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, red, blue, white)', color: 'transparent', backgroundClip: 'text'
                            }}>
                                Say hey to your new group
                            </div>
                        )}
                        {typing && <span className="loading loading-dots loading-md"></span>}
                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
                <div className="mt-5">
                    <form style={{ width: '100%' }} onSubmit={sendMessage} className="flex flex-row bg-slate-400 relative rounded-badge px-4 py-1 justify-between">
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
