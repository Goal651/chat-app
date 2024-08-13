/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import debounce from 'lodash/debounce';
import { Picker } from 'emoji-mart';



const DMArea = ({ socket }) => {
    const navigate = useNavigate()
    const { user } = useParams()
    const friend = localStorage.getItem('selectedFriend')
    const [refresh, setRefresh] = useState(false)
    const [message, setMessage] = useState("")
    const [scrollToBottom, setScrollToBottom] = useState(false)
    const [history, setHistory] = useState([])
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        const fetchUserDetails = async () => {
            const response = await fetch(`http://localhost:3001/getUser/${friend}`, { headers: { 'accessToken': `${Cookies.get('accessToken')}` } });
            const data = await response.json();
            setInfo(data.user);
            if (response.status === 403) navigate('/login')
        }
        setMessage("");
        fetchUserDetails();
    }, [friend, user, navigate]);

    const handleScrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setScrollToBottom(false);
        }
    }, []);

    useEffect(() => handleScrollToBottom(), [scrollToBottom, handleScrollToBottom]);

    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = () => {
            setRefresh(true);
            setScrollToBottom(true);
        }
        const handleTyping = ({ receiver, sender }) => {
            if ((receiver === friend) || user === sender) setBeingTyped(true);
            else setBeingTyped(false);
            setScrollToBottom(true);
        }

        const handleNotTyping = ({ sender, receiver }) => {
            if ((receiver === friend) || user === sender) setBeingTyped(false);
        }

        socket.on("receive_message", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("not_typing", handleNotTyping);
        socket.on("message_sent", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
            socket.off('message_sent');
        }
    }, [socket, friend, user]);

    useEffect(() => {
        if (!user) return;
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/message?receiver=${friend}`, { headers: { 'accessToken': `${Cookies.get('accessToken')}` } });
            const data = await response.json();
            setHistory(data.messages);
            setScrollToBottom(true);
            setRefresh(false);
            setLoading(false);
            if (response.status === 403) navigate('/login')
        }
        fetchMessages();
    }, [friend, refresh, user, navigate]);

    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (message.length === 0) return;
        socket.emit("send_message", { receiver: friend, message });
        setScrollToBottom(true);
        setMessage("");
        setRefresh(!refresh);
        socket.emit("not_typing", { receiver: friend });
    }, [message, socket, friend, refresh]);

    const debounceTyping = useMemo(() => debounce(({ receiver }) => {
        socket.emit("typing", { receiver });
    }, 1000), [socket]);


    const handleChange = useCallback((e) => {
        const { value } = e.target;
        setMessage(value);
        if (value.length > 0) debounceTyping({ receiver: friend });
        else socket.emit("not_typing", { receiver: friend });
        setScrollToBottom(true);
    }, [debounceTyping, socket, friend]);

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]) }
        return window.btoa(binary);
    }

    const imageBase64 = useMemo(() => {
        if (info.imageData && info.imageData.data) return arrayBufferToBase64(info.imageData.data);
        return '';
    }, [info]);

    const addEmoji = (e) => {
        let sym = e.unified.split("-");
        let codesArray = [];
        sym.forEach(el => codesArray.push("0x" + el));
        let emoji = String.fromCodePoint(...codesArray);
        setMessage(message + emoji);
    }

    return (
        <div className="flex flex-col">
            <div className="flex h-1/3 mb-2">
                <div className="flex h-14 w-14 justify-center">
                    {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="max-h-14 max-w-14 rounded-lg" />
                    ) : (
                        <img src="/nopro.png" alt="No Profile" className="h-14" />
                    )}</div>
                <div className="font-semibold text-xl ml-5 ">{info.username || friend}</div>
            </div>
            <div style={{ height: '31rem' }} className="overflow-y-auto h-2/3 ">
                <div className="">
                    {user ? (loading ? (<div className="flex flex-col  justify-around h-4/6">
                        <div className="chat chat-start">
                            <div className="skeleton chat-bubble w-60"></div>
                        </div>
                        <div className="chat chat-start">
                            <div className="skeleton chat-bubble w-60"></div>
                        </div>
                        <div className="chat chat-start">
                            <div className="skeleton chat-bubble w-60"></div>
                        </div>
                        <div className="chat chat-end">
                            <div className="skeleton chat-bubble w-60"></div>
                        </div>
                        <div className="chat chat-end">
                            <div className="skeleton chat-bubble w-60"></div>
                        </div>
                        <div className="chat chat-end">
                            <div className="skeleton chat-bubble w-60"></div>
                        </div>
                    </div>) :
                        (history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === friend ? (
                                    <div key={message._id} className="w-full h-full">
                                        <div className="chat chat-end">
                                            <div className="flex flex-col chat-bubble">
                                                <div> {message.message}</div>
                                                <time className="text-xs opacity-50 text-end">{message.time}</time>
                                            </div>
                                            <div className="chat-footer opacity-50">Delivered</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={message._id} className="max-w-2/3 h-auto">
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
                        ))) : (<div className="h-full items-center">
                            <div>Select user</div>
                        </div>)}
                    {beingTyped ? (
                        <div className="chat chat-start h-5  ">
                            <span className="chat-bubble h-5 bg-slate-400">
                                <span className=" loading loading-dots w-10 bg-gray-500"></span>
                            </span>
                        </div>
                    ) : null}
                    <div ref={messagesEndRef}></div>
                </div>
            </div>
            <div className="relative">
                <form style={{ width: '100%' }} onSubmit={sendMessage} className="flex items-center bg-gray-800 text-gray-400 rounded-full px-4 py-2">
                    <button type="button" className="mr-2" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 16 16">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                        </svg>
                    </button>
                    <input type="text" placeholder="Type a message" value={message} onChange={handleChange} className="flex-grow bg-transparent outline-none placeholder-gray-400" />
                    <button type="submit" className="mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
                            <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-9.192 9.192L9.5 15.5 2 22h7.5l3.379-3.379 9.192-9.192a1 1 0 0 0 0-1.414l-0.364-0.364z" />
                        </svg>
                    </button>
                    <button type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
                            <path d="M12 2a5 5 0 0 0-5 5v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5zM9 8h6v4H9zm8 7h-2a3 3 0 0 0-6 0H7v3h10v-3z" />
                        </svg>
                    </button>
                </form>
                {showEmojiPicker && (
                    <div className="absolute bottom-16">
                        <Picker onSelect={addEmoji} theme="dark" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DMArea;
