/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback, } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";

const GroupArea = ({ socket, isMobile }) => {
    const { name } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const [group, setGroup] = useState(null);
    const user = Cookies.get('user');
    const accessToken = Cookies.get('accessToken');
    const [lastMessageId, setLastMessageId] = useState(null); // For fetching new messages

    useEffect(() => {
        const fetchGroup = async () => {
            if (!name || !accessToken) return;
            const result = await fetch(`http://localhost:3001/getGroup/${name}`, { headers: { 'accessToken': `${accessToken}` } });
            const data = await result.json();
            if (result.ok) {
                setGroup(data.group);
            } else {
                navigate('/error');
            }
        };
        fetchGroup();
    }, [name, accessToken, navigate]);

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
        if (!socket || !name) return;

        const handleReceiveMessage = (newMessage) => {
            setHistory(prevHistory => [...prevHistory, newMessage]);
            setLastMessageId(newMessage._id);
            setScrollToBottom(true);
        };

        const handleTyping = ({ group }) => {
            if (group === name) setTyping(true);
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
    }, [socket, name]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!name || !accessToken) return;
            const response = await fetch(`http://localhost:3001/gmessage/${name}?lastMessageId=${lastMessageId}`, {
                headers: { 'accessToken': `${accessToken}` }
            });
            const data = await response.json();
            
            if (response.status === 403) {
                navigate('/login');
            } else if (data.gmessages && Array.isArray(data.gmessages)) {
                setHistory(prevHistory => [...prevHistory, ...data.gmessages]);
                if (data.gmessages.length > 0) {
                    setLastMessageId(data.gmessages[data.gmessages.length - 1]._id);
                }
                setScrollToBottom(true);
            } else {
                console.error('Unexpected data structure:', data);
            }
        };
    
        fetchMessages();
    }, [name, accessToken, lastMessageId, navigate]);
    
    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (message === "" || !name) return;
    
        const newMessage = {
            _id: Date.now(), 
            sender: user,
            message: message,
            time: new Date().toISOString().slice(11,16), // or use your preferred format
            imageData: null, // If you have image data, include it here
        };
    
        // Emit the message to the server
        socket.emit("send_group_message", { room: name, message });
    
        // Update the local history to include the new message
        setHistory(prevHistory => [...prevHistory, newMessage]);
    
        // Clear the message input field and scroll to the bottom
        setMessage("");
        setScrollToBottom(true);
        socket.emit("not_typing", { group: name });
    }, [message, socket, name, user]);
    
    const handleChange = useCallback((e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        if (newMessage) socket.emit("typing", { group: name });
        else socket.emit("not_typing", { group: name });
    }, [name, socket]);

    const navigateBackward = () => {
        localStorage.removeItem('selectedGroup');
        navigate('/group');
    };

    return (
        <div id="chatArea">
            {group ? (
                <div className="">
                    <div className="flex mb-5">
                        {isMobile && (<button onClick={navigateBackward}>←</button>)}
                        {group.imageData ? <img src={`data:image/png;base64,${group.imageData}`} alt="Fetched Image" className="max-w-14 max-h-14 rounded-lg" />
                            : <img src="/nogro.png" alt="No Group Image" className="max-w-14 max-h-14 rounded-lg" />
                        }
                        <div className="font-semibold ml-5">{group.name}</div>
                    </div>
                    <div style={{ height: '30rem' }} className="overflow-auto">
                        <div className="">
                            {history && history.length > 0 ? (
                                history.map((message) => (
                                    message.sender !== user ? (
                                        <div key={message._id}>
                                            <div className="chat chat-start">
                                                <div className="chat-image avatar">
                                                    <div className="w-12 rounded-lg">
                                                        <img src={`data:image/png;base64,${message.imageData}`} alt="Profile" className="max-w-14 max-h-14" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col chat-bubble bg-slate-200 text-sm max-h-auto">
                                                    <div className="text-indigo-700 text-sm font-semibold mb-1">{message.senderUsername}</div>
                                                    <div className="text-black font-semibold text-sm max-w-96 h-auto break-words">{message.message}</div>
                                                    <time className="text-xs opacity-50 text-end text-black">{message.time}</time>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={message._id}>
                                            <div className="chat chat-end">
                                                <div className="flex flex-col chat-bubble bg-indigo-600 max-h-auto">
                                                    <div className="max-w-96 h-auto break-words text-sm font-semibold"> {message.message}</div>
                                                    <time className="text-xs opacity-50 text-end">{message.time}</time>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, red, blue, white)', color: 'transparent', backgroundClip: 'text' }}>
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
            ) : (
                <div>Welcome to group chats</div>
            )}
        </div>
    );
};

export default GroupArea;
