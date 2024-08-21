/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import { Picker } from 'emoji-mart';

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const DMArea = ({ socket, isMobile }) => {
    const navigate = useNavigate()
    const { user } = useParams()
    const friend = localStorage.getItem('selectedFriend')
    const [refresh, setRefresh] = useState(false)
    const [message, setMessage] = useState("")
    const [fileMessage, setFileMessage] = useState(null)
    const [scrollToBottom, setScrollToBottom] = useState(false)
    const [history, setHistory] = useState([])
    const [beingTyped, setBeingTyped] = useState(false)
    const [info, setInfo] = useState([])
    const [loading, setLoading] = useState(true)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [filePreview, setFilePreview] = useState(null)
    const messagesEndRef = useRef(null)
    const accessToken = Cookies.get('accessToken')
    const [focusedMessage, setFocusedMessage] = useState('')

    useEffect(() => {
        if (!user) return;
        const fetchUserDetails = async () => {
            const response = await fetch(`http://localhost:3001/getUser/${friend}`, { headers: { 'accessToken': `${accessToken}` } });
            const data = await response.json();
            if (response.ok) setInfo(data.user);
            if (response.status === 403) navigate('/login')
        }
        setMessage("");
        fetchUserDetails();
    }, [friend, user, navigate, accessToken]);

    const handleScrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
            setScrollToBottom(false)
        }
    }, []);

    useEffect(() => handleScrollToBottom(), [scrollToBottom, handleScrollToBottom]);

    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = () => {
            setRefresh(true)
            setScrollToBottom(true)
        }
        const handleTyping = ({ sender }) => {
            if (sender === friend) setBeingTyped(true);
            else setBeingTyped(false);
            setScrollToBottom(true);
        }

        const handleNotTyping = ({ sender }) => {
            if (sender === friend) setBeingTyped(false);
        }
        const handleMessageSent = () => { }
        socket.on("receive_message", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("not_typing", handleNotTyping);
        socket.on("message_sent", handleMessageSent);

        return () => {
            socket.off("receive_message");
            socket.off("typing");
            socket.off("not_typing");
            socket.off('message_sent');
        }
    }, [socket, friend, user]);

    useEffect(() => {
        if (!user) return;
        const fetchMessages = async () => {
            const response = await fetch(`http://localhost:3001/message?receiver=${friend}`, { headers: { 'accessToken': `${accessToken}` } });
            const data = await response.json()
            setHistory(data.messages)
            setScrollToBottom(true)
            setRefresh(false)
            setLoading(false)
            if (response.status === 403) navigate('/login')
        }
        fetchMessages();
    }, [friend, refresh, user, navigate, accessToken]);

    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (!socket) return;
        const newMessage = { _id: Date.now(), sender: user, receiver: friend, type: 'text', message: message, time: new Date().toISOString().slice(11, 16), };
        if (message) {
            socket.emit("send_message", { receiver: friend, message });
            setHistory(prevHistory => [...prevHistory, newMessage]);
            setMessage("");
        }
        setScrollToBottom(true);
        socket.emit("not_typing", { receiver: friend });
    }, [message, socket, friend, user]);

    const sendFileMessage = useCallback((e) => {
        e.preventDefault();
        if (!socket || !fileMessage) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            const base64String = arrayBufferToBase64(arrayBuffer);
            const newFileMessage = {
                _id: Date.now(),
                sender: user,
                receiver: friend,
                type: 'file',
                fileName: fileMessage.name,
                fileType: fileMessage.type,
                fileSize: fileMessage.size,
                file: arrayBuffer,
                time: new Date().toISOString().slice(11, 16),
            }
            console.log('Emitting event:', newFileMessage);
            socket.emit('send_file_message', { message: newFileMessage });
            setHistory(prevHistory => [...prevHistory, { ...newFileMessage, image: base64String }])
            setFileMessage(null);
            setFilePreview(null);
            setScrollToBottom(true);
        };
        reader.readAsArrayBuffer(fileMessage);
    }, [fileMessage, socket, friend, user]);



    const handleChange = useCallback((e) => {
        const { name, value, files } = e.target
        if (name === 'media') {
            const file = files[0]
            setFilePreview(URL.createObjectURL(file))
            setFileMessage(files[0])
        }
        else {
            setMessage(value)
            socket.emit("typing", { receiver: friend })
        }
        setScrollToBottom(true)
    }, [socket, friend])

    const addEmoji = (e) => {
        let sym = e.unified.split("-");
        let codesArray = [];
        sym.forEach(el => codesArray.push("0x" + el));
        let emoji = String.fromCodePoint(...codesArray);
        setMessage(message + emoji);
    }

    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend')
        navigate('/chat')
    }
    const handleMouseEnter = data => setFocusedMessage(data)
    const handleMouseLeave = () => setFocusedMessage('')
    const handleDeleteMessage = async (data) => {
        if (!data) return
        const formData = new FormData()
        formData.append('id', data)
        try {
            const response = await fetch(`http://localhost:3001/deleteMessage/${data}`, { headers: { 'accessToken': `${accessToken}` }, method: 'DELETE', })
            if (response.ok) setRefresh(true)
        } catch (err) { console.error(err) }
    }

    const handleCancel = () => {
        setFileMessage(null)
        setFilePreview(null)
    }

    return (
        <div className="flex flex-col">
            {isMobile && (<button onClick={navigateBackward}>←</button>)}
            {user ? (
                <div>
                    <div className="flex h-1/3 mb-2">
                        <div className="flex h-14 w-14 justify-center">
                            {info.imageData ? <img src={`data:image/jpeg;base64,${info.imageData}`} alt="Fetched Image" className="max-h-14 max-w-14 rounded-lg" />
                                : <img src="/nopro.png" alt="No Profile" className="h-14" />
                            }</div>
                        <div className="font-semibold text-xl ml-5 ">{info.username || friend}</div>
                    </div>
                    <div style={{ height: '31rem' }} className="overflow-y-auto h-2/3 ">
                        <div className="">
                            {loading ? (
                                <div className="flex flex-col  justify-around h-4/6">
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
                                            <div key={message._id} className="w-full h-full" >
                                                <div className="grid grid-flow-col-dense chat chat-start">
                                                    {message.type === 'file' ? (
                                                        <div className="flex flex-col text-white font-medium">
                                                            <img src={`data:image/jpeg;base64,${message.image}`} className="max-h-20 max-w-20" />
                                                            <div className="text-xs opacity-50 text-end">{message.time}</div>
                                                        </div>) : (
                                                        <div className="grid-cols-2 flex flex-col chat-bubble bg-slate-300 text-black font-medium " >
                                                            <div className="text-sm grow font-semibold max-w-96 break-words"> {message.message}</div>
                                                            <time className="text-xs opacity-50 text-end">{message.time}</time>
                                                        </div>)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={message._id} className="w-full h-full">
                                                <div onMouseEnter={() => handleMouseEnter(message._id)} onMouseLeave={handleMouseLeave} className="chat chat-end grid-flow-col-dense ">
                                                    {focusedMessage == message._id && (<div className="cursor-pointer" onClick={() => handleDeleteMessage(message._id)}>Delete</div>)}
                                                    {message.type === 'file' ? (
                                                        <div className="flex flex-col text-white font-medium">
                                                            <img src={`data:image/jpeg;base64,${message.image}`} className="max-h-20 max-w-20" />
                                                            <div className="text-xs opacity-50 text-end">{message.time}</div>
                                                        </div>) : (
                                                        <div className="grid-cols-2 flex flex-col chat-bubble bg-slate-300 text-black font-medium " >
                                                            <div className="text-sm grow font-semibold max-w-96 break-words"> {message.message}</div>
                                                            <time className="text-xs opacity-50 text-end">{message.time}</time>
                                                        </div>)}

                                                </div>
                                            </div>
                                        )
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, red, blue, white)', color: 'transparent', backgroundClip: 'text' }}>
                                        Say hey to your new friend
                                    </div>
                                ))}
                            {beingTyped && (
                                <div className="chat chat-start h-5  ">
                                    <span className="chat-bubble h-5 bg-slate-300">
                                        <span className=" loading loading-dots w-10 bg-gray-500"></span>
                                    </span>
                                </div>
                            )}
                            <div ref={messagesEndRef}></div>
                        </div>
                    </div>
                    <div className="relative">
                        <form style={{ width: '100%' }} onSubmit={sendMessage} className="flex items-center bg-gray-300 text-slate-600 rounded-full px-4 py-2 ">
                            <button type="button" className="mr-2" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 16 16">
                                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                                </svg>
                            </button>
                            <input type="text" placeholder="Type a message" value={message} onChange={handleChange} className="flex-grow bg-transparent outline-none placeholder-slate-600" />
                            <button type="submit" className="mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
                                    <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-9.192 9.192L9.5 15.5 2 22h7.5l3.379-3.379 9.192-9.192a1 1 0 0 0 0-1.414l-0.364-0.364z" />
                                </svg>
                            </button>
                            <label type="button">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
                                    <path d="M12 2a5 5 0 0 0-5 5v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5zM9 8h6v4H9zm8 7h-2a3 3 0 0 0-6 0H7v3h10v-3z" />
                                </svg>
                                <input className="hidden" type="file" onChange={handleChange} name="media" id="" />
                            </label>
                        </form>
                        {showEmojiPicker && (
                            <div className="absolute bottom-16">
                                <Picker onSelect={addEmoji} theme="dark" />
                            </div>
                        )}
                    </div></div>) : (
                <div className="flex h-full text-center">Start Chatting with friends</div>
            )}
            {filePreview && (<div className="fixed flex flex-col justify-center bg-black h-screen w-screen rounded-box top-0 left-0">
                <div className="relative m-8 ml-72 w-full">
                    {filePreview && (<img src={filePreview} alt="Image Preview" className="max-h-96 max-w-xl rounded-box" />)}
                </div>
                <div className="flex space-x-10 relative justify-center">
                    <button onClick={handleCancel} className="btn text-gray-400">Cancel</button>
                    <button onClick={sendFileMessage} className="btn btn-success">Send</button>
                </div>
            </div>)}
        </div>
    );
};

export default DMArea;
