/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import debounce from 'lodash/debounce'

const DMArea = ({ friend, socket }) => {
    const navigate = useNavigate();
    const { user } = useParams();
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState([]);
    const username = Cookies.get('username');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        const fetchUserDetails = async () => {
            const response = await fetch(`http://localhost:3001/getUser/${user || friend}`);
            const data = await response.json();
            setInfo(data.user);
        };
        setMessage("")
        fetchUserDetails();
    }, [friend, user, navigate]);

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

        const handleTyping = ({ receiver, sender }) => {
            if ((receiver === username && friend) || user === sender) setBeingTyped(true);
            else setBeingTyped(false);
            setScrollToBottom(true)
        };

        const handleNotTyping = ({sender, receiver }) => {
            if ((receiver === username && friend) || user === sender) setBeingTyped(false);
        }

        socket.on("receive_message", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("not_typing", handleNotTyping);

        return () => {
            socket.off("receive_message", handleReceiveMessage)
            socket.off("typing", handleTyping)
            socket.off("not_typing", handleNotTyping)
        }
    }, [socket, friend, username, user])

    useEffect(() => {
        if (!user) return
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/message?sender=${username}&receiver=${user || friend}`);
            const data = await response.json();
            setHistory(data.messages);
            setScrollToBottom(true);
        };
        fetchMessages();
    }, [friend, refresh, user, username]);

    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (message === "") return;
        socket.emit("send_message", { receiver: friend || user, message, sender: username });
        setScrollToBottom(true)
        setMessage("")
        setRefresh(prev => !prev)
        socket.emit("not_typing", { username, receiver: friend || user })
    }, [message, socket, friend, user, username])

    const debounceTyping = useMemo(() => debounce(({ username, receiver }) => {
        socket.emit("typing", { username, receiver })
    }, 1000), [socket])

    const handleChange = useCallback((e) => {
        const { value } = e.target;
        setMessage(value);
        if (value !== "") {
            debounceTyping({ username, receiver: friend || user });
        } else {
            socket.emit("not_typing", { username, receiver: friend || user });
        }
        setScrollToBottom(true);
    }, [debounceTyping, socket, friend, user, username]);
    
    

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const imageBase64 = useMemo(() => {
        if (info.imageData && info.imageData.data) return arrayBufferToBase64(info.imageData.data);
        return '';
    }, [info]);

    return (
        <div className="">
            <div className="flex flex-col">
                <div className="flex">
                    {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-14 w-14 rounded-lg" />
                    ) : (
                        <img src="/nopro.png" alt="No Profile" className="h-14" />
                    )}
                    <div className="font-semibold text-xl ml-5 ">{info.username || friend}</div>
                </div>
                <div style={{ height: '31rem' }} className="overflow-auto ">
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
                        <div ref={messagesEndRef}></div>
                    </div>
                </div>
                <div className="mt-5">
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
``
