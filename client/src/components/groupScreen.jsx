/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";

const GroupArea = ({ group, socket, friends }) => {
    const { name } = useParams();
    const navigate = useNavigate()
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [typing, setTyping] = useState(false);
    const [currentRoom, setCurrentRoom] = useState("");
    const username = Cookies.get('username');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchGroupDetails = async () => {
            const response = await fetch(`http://localhost:3001/getGroup/${name}`);
            const data = await response.json();
            if (data.group) setCurrentRoom(data.group);
            if (!response.ok) navigate('/error')
        };
        fetchGroupDetails();
    }, [group, name, navigate]);

    const handleScrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setScrollToBottom(false);
        }
    }, []);

    const getFriendImage = (sender) => {
        if (!friends) {
            console.log("Friends prop is not available.");
            return "/nopro.png";
        }
        const friend = friends.find(friend => friend.username === sender);
        if (!friend) {
            console.log(`No friend found for sender: ${sender}`);
            return "/nopro.png";
        }
        if (!friend.imageData) {
            console.log(`No image data found for friend: ${friend.username}`);
            return "/nopro.png";
        }
        const imageData = `data:image/png;base64,${arrayBufferToBase64(friend.imageData.data)}`;
        console.log(`Image data found for ${friend.username}: ${imageData}`);
        return imageData;
    };



    useEffect(() => {
        handleScrollToBottom();
    }, [scrollToBottom, handleScrollToBottom]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = () => {
            setRefresh(!refresh)
            setScrollToBottom(true)
        }

        const handleTyping = ({ group, sender }) => {
            if (group === name && sender !== username) setTyping(true);
            else setTyping(false);
        }

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
    }, [socket, username, name,refresh]);

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/gmessage/${name}`);
            const data = await response.json();
            setHistory(data.gmessages);
            setScrollToBottom(true);
            if (!response.ok) navigate('/error')
        };
        fetchMessages();
    }, [name, refresh, navigate]);

    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (message === "" || !name) return;
        socket.emit("send_group_message", { room: name, message, sender: username });
        setMessage("");
        setRefresh(prev => !prev);
        socket.emit("not_typing", { username, group: name });
    }, [message, name, username, socket]);


    const handleChange = useCallback((e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        if (newMessage) socket.emit("typing", { username, group: name });
        else socket.emit("not_typing", { username, group: name });
        setScrollToBottom(true);
    }, [name, username, socket]);


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
        if (currentRoom && currentRoom.imageData && currentRoom.imageData.data) return arrayBufferToBase64(currentRoom.imageData.data);
        return '';
    }, [currentRoom, arrayBufferToBase64]);

    return (
        <div id="chatArea">
            <div className="">
                <div className="flex mb-5 ">
                    {imageBase64 ? (
                        <img src={`data:image/png;base64,${imageBase64}`} alt="Fetched Image" className="w-14 rounded-lg" />
                    ) : (
                        <img src="/nogro.png" alt="No Group Image" className="w-14 rounded-lg" />
                    )}
                    <div className="font-semibold ml-5">{currentRoom.name}</div>
                </div>
                <div style={{ height: '30rem' }} className="overflow-auto">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === username ? (
                                    <div key={message._id}>
                                        <div className="chat chat-end">
                                            <div className="flex flex-col chat-bubble bg-indigo-600">
                                                <div> {message.message}</div>
                                                <time className="text-xs opacity-50 text-end">{message.time}</time>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={message._id}>
                                        <div className="chat chat-start">
                                            <div className="chat-image avatar">
                                                <div className="w-10 rounded-full">
                                                    <img src={getFriendImage(message.sender)} alt="Profile" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col chat-bubble bg-slate-200">
                                                <div className="text-blue-700">{message.sender}</div>
                                                <div className="text-black">{message.message}</div>
                                                <time className="text-xs opacity-50 text-end">{message.time}</time>
                                            </div>
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
        </div >
    );

};

export default GroupArea;
