/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { ClipLoader } from 'react-spinners';
import axios from 'axios'

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]) }
    return window.btoa(binary);
}



export default function DMArea({ socket, isMobile, theme }) {
    const navigate = useNavigate();
    const { user } = useParams();
    const friend = localStorage.getItem('selectedFriend');
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [lastMessage, setLastMessage] = useState("");
    const [fileMessage, setFileMessage] = useState(null);
    const [fileName, setFileName] = useState(null)
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [history, setHistory] = useState([]);
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [focusedMessage, setFocusedMessage] = useState('');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false)
    const accessToken = Cookies.get('accessToken');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isSendingFile, setIsSendingFile] = useState(false);
    const [lastActiveTime, setLastActiveTime] = useState('');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chunkSize = 64 * 1024;

    const ICE_SERVERS = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
        ],
    };

    useEffect(() => {
        if (!socket) return
        socket.emit('fetch_online_users')
    }, [navigate, socket])

    useEffect(() => {
        if (lastMessage && socket) {
            socket.emit('message_seen', { receiver: friend, messageId: lastMessage });
        }
    }, [lastMessage, socket, friend, navigate]);


    useEffect(() => {
        const getTimeDifference = () => {
            if (!info) return;
            const lastActiveTime = info.lastActiveTime;
            const data = new Date(lastActiveTime);
            const timestampNow = Date.now();
            const difference = (timestampNow - data.getTime()) / 60000;
            if (difference * 60 > 86400) {
                setLastActiveTime(`${Math.floor(difference / 1440)} days`);
            } else if (difference * 60 > 3600) {
                setLastActiveTime(`${Math.floor(difference / 60)} hours`);
            } else if (difference * 60 > 60) {
                setLastActiveTime(`${Math.floor(difference)} minutes`);
            } else {
                setLastActiveTime(`${Math.floor(difference * 60)} seconds`);
            }
        };
        getTimeDifference()
    }, [info, navigate, onlineUsers, socket])

    useEffect(() => {
        const isLastMessage = () => {
            if (!user) return
            if (!history) return
            const lastM = history[history.length - 1]
            if (lastM && lastM.sender === friend) {
                setLastMessage(lastM._id)
            }
        }
        isLastMessage()
    }, [history, friend, user, navigate])

    useEffect(() => {
        if (!user) return;
        const fetchUserDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUser/${friend}`, {
                    headers: { 'accessToken': `${accessToken}` },
                });
                const data = await response.json();
                if (response.ok) setInfo(data.user);
                else if (response.status === 401) {
                    Cookies.set("accessToken", data.accessToken);
                } else if (response.status === 403 || response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                } else navigate('/error')

            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };
        setMessage("");
        fetchUserDetails();
    }, [friend, user, navigate, accessToken]);

    const handleScrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setScrollToBottom(false);
        }
    }, []);

    useEffect(() => handleScrollToBottom(), [scrollToBottom, handleScrollToBottom]);

    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = async ({ newMessage }) => {
            if (newMessage.sender === friend) {
                setHistory((prevHistory) => [...prevHistory, newMessage]);
                socket.emit('message_seen', { receiver: friend, messageId: newMessage._id });
            }
            setScrollToBottom(true);
        };
        const handleTyping = ({ sender }) => {
            if (sender === friend) setBeingTyped(true);
            else setBeingTyped(false);
            setScrollToBottom(true);
        };

        const handleNotTyping = ({ sender }) => {
            if (sender === friend) setBeingTyped(false);
        };

        const handleMessageSent = ({ newMessage }) => {
            console.log(newMessage)
            setHistory((prevHistory) => [...prevHistory, newMessage]);
            setScrollToBottom(true);
        };

        const handleMessageSeen = ({ messageId }) => {
            const result = history.map(msg => {
                if (msg._id === messageId) {
                    return { ...msg, seen: true }
                } else return msg
            })
            console.log(result)
        }

        const handleCallOffer = async ({ offer, sender, type }) => {
            if (sender !== friend) return;

            setCallType(type);
            setIsCalling(true);

            const pc = createPeerConnection(sender);
            setPeerConnection(pc);

            try {
                if (type === 'video') {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(stream);
                    localVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                } else {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setLocalStream(stream);
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit('call-answer', { answer, sender });
            } catch (error) {
                console.error("Error handling call offer:", error);
            }
        };

        const handleCallAnswer = async ({ answer }) => {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error("Error setting remote description from answer:", error);
            }
        };

        const handleICECandidate = ({ candidate }) => {
            try {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding received ICE candidate:", error);
            }
        };

        const handleOnlineUsers = (data) => {
            setOnlineUsers(data)
        }
        socket.emit("mark_message_as_read", { sender: friend })
        socket.on("online_users", handleOnlineUsers)
        socket.on("receive_message", handleReceiveMessage);
        socket.on("receive_file", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("not_typing", handleNotTyping);
        socket.on('message_sent', handleMessageSent);
        socket.on('user_saw_message', handleMessageSeen)
        socket.on('call-offer', handleCallOffer);
        socket.on('call-answer', handleCallAnswer);
        socket.on('ice-candidate', handleICECandidate);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
            socket.off('message_sent', handleMessageSent);
            socket.off('call-offer', handleCallOffer);
            socket.off('call-answer', handleCallAnswer);
            socket.off('ice-candidate', handleICECandidate);
            socket.off('receive_file', handleReceiveMessage)
        };
    }, [socket, friend, user, peerConnection]);

    useEffect(() => {
        if (!user) return;
        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://localhost:3001/message?receiver=${friend}`, {
                    headers: { 'accessToken': `${accessToken}` },
                });
                const data = await response.json();
                setHistory(data.messages);
                setScrollToBottom(true);
                setLoading(false);
                if (response.status === 403) navigate('/login');
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();
    }, [friend, user, navigate, accessToken]);

    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!socket) return;

        if (message.trim() !== "") {
            socket.emit("send_message", { receiver: friend, message });
            setMessage("");
            setShowEmojiPicker(false);
        }
        socket.emit("not_typing", { receiver: friend });
        setScrollToBottom(true);
    }, [message, socket, friend,]);

    const readAndUploadCurrentChunk = async (currentChunk = 0) => {
        const chunkSize = 50 * 1024; // 50 KB per chunk
        const totalChunks = Math.ceil(fileMessage.size / chunkSize);
        const reader = new FileReader();
        if (!fileMessage) return
        const from = currentChunk * chunkSize;
        const to = Math.min(from + chunkSize, fileMessage.size);
        const blob = fileMessage.slice(from, to);
        reader.onload = async (e) => {
            const data = e.target.result;
            await axios.post('http://localhost:3001/uploadFile', { file: data }, {
                headers: {
                    'accesstoken': accessToken,
                    'name': fileMessage.name,
                    'size': fileMessage.size,
                    'currentChunk': currentChunk,
                    'totalchunks': totalChunks
                },
            }).then(response => {
                const isLastChunk = currentChunk === totalChunks - 1;
                const done = currentChunk === totalChunks
                if (isLastChunk) {
                    const finalFileName = response.data.finalFileName
                    setFileName(finalFileName)
                } else {
                    readAndUploadCurrentChunk(currentChunk + 1);
                }
            }).catch(error => {
                console.error('Error uploading chunk:', error);
            });
        };
        reader.readAsDataURL(blob);
        console.log(fileName, 'in returning')
    };

    useEffect(() => {
        const sendDetailsToSocket = () => {
            if (fileName) {
                const newFileMessage = {
                    receiver: friend,
                    fileType: fileMessage.type,
                    fileSize: fileMessage.size,
                    message: fileName,
                    preview: filePreview,
                    time: new Date().toISOString().slice(11, 16),
                };
                socket.emit('send_file_message', { message: newFileMessage });
                setFileMessage(null);
                setFilePreview(null);
                setIsSendingFile(false)
            }
        }
        sendDetailsToSocket()
    }, [fileName])


    const sendFileMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!socket || !fileMessage) return;
        await readAndUploadCurrentChunk(0)
        setIsSendingFile(true);
        setScrollToBottom(true);
        socket.emit('not_typing', { receiver: friend });
    }, [fileMessage, socket, friend, user, fileName]);




    const handleChange = useCallback((e) => {
        const { name, value, files } = e.target;
        if (name === 'media') {
            const file = files[0];
            setFilePreview(URL.createObjectURL(file));
            setFileMessage(files[0]);
            socket.emit('typing', { receiver: friend })
        } else {
            setMessage(value);
            if (value.trim() !== "") socket.emit("typing", { receiver: friend });
            if (value.trim() === "") socket.emit('not_typing', { receiver: friend })
        }
        setScrollToBottom(true);
    }, [socket, friend]);

    const handlePaste = (e) => {
        const file = e.clipboardData.files[0];
        setFilePreview(URL.createObjectURL(file));
        setFileMessage(file);
    };
    const handleDragover = (e) => {
        setIsDragOver(true)

    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0];

        if (file) {
            setFilePreview(URL.createObjectURL(file));
            setFileMessage(file);
        }
        else {
            setMessage('')
        }
    }

    const handleAuxClick = (e) => {
        e.preventDefault()
        console.log(e)
        alert('hello')
    }


    const addEmoji = (emoji) => {
        setMessage((prevMessage) => prevMessage + emoji.native);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend');
        navigate('/chat');
    };

    const handleMouseEnter = (data) => setFocusedMessage(data);
    const handleMouseLeave = () => setFocusedMessage('');
    const handleDeleteMessage = async (data) => {
        if (!data) return;
        try {
            const response = await fetch(`http://localhost:3001/deleteMessage/${data}`, {
                headers: { 'accessToken': `${accessToken}` },
                method: 'DELETE',
            });
            if (response.ok) setRefresh(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = () => {
        setFileMessage(null);
        setFilePreview(null);
    };

    // WebRTC Functions
    const createPeerConnection = (peerId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: peerId,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
            }
        };

        return pc;
    };

    const startCall = async (type) => {
        setCallType(type);
        setIsCalling(true);

        const pc = createPeerConnection(friend);
        setPeerConnection(pc);

        try {
            let stream;
            if (type === 'video') {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideoRef.current.srcObject = stream;
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            setLocalStream(stream);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('call-offer', { offer, receiver: friend, type, });
        } catch (error) {
            console.error("Error starting call:", error);
            endCall();
        }
    };

    const endCall = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
            setRemoteStream(null);
        }
        setIsCalling(false);
        setCallType(null);
    };


    if (!user) return null
    if (loading) return <div className="loading loading-spinner"></div>
    return (
        <div className="flex flex-col h-full" >
            <div onClick={() => { setShowEmojiPicker(false) }}
                className={`${theme === 'dark' ? 'bg-black ' : 'bg-white shadow-md'} flex items-center justify-between p-4 `}>
                <div className="flex items-center">
                    {isMobile && (
                        <button onClick={navigateBackward} className="mr-4 text-gray-500 hover:text-gray-800">
                            ←
                        </button>)}
                    <div className={`flex items-center ${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800 '}`}>
                        <div className="avatar">
                            <div className="h-16 w-16 rounded-full ">
                                {info.imageData ? <img
                                    src={`data:image/jpeg;base64,${info.imageData}`}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                                    : <svg className="ml-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill={`${theme === 'dark-theme' ? 'white' : 'black'}`} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" /></svg>
                                }
                            </div>
                        </div>
                        <div className="ml-4">
                            <div className="text-lg font-semibold">{info.username}</div>
                            {onlineUsers.includes(info.email) ? (beingTyped ? (
                                <div className="text-md text-green-600 ">typing ...</div>) :
                                <div className="text-sm ">Online</div>) :
                                (
                                    <div className="text-sm font-semibold">
                                        last seen: {lastActiveTime}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => startCall('audio')}
                        className={`p-2 bg-green-500 rounded-full hover:bg-green-600 focus:outline-none`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="text-white"                        >
                            <path d="M6.62 10.79a15.05 15.05 0 006.58 6.58l2.2-2.2a1 1 0 011.11-.21 12.38 12.38 0 004.55 1.45 1 1 0 01.89 1v3.75a1 1 0 01-1 1A18 18 0 013 5a1 1 0 011-1h3.75a1 1 0 011 .89 12.38 12.38 0 001.45 4.55 1 1 0 01-.21 1.11l-2.2 2.2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => startCall('video')}
                        className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="text-white"                        >
                            <path d="M17 10.5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3.5l4 4v-11l-4 4z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div
                onClick={() => { setShowEmojiPicker(false) }}
                className={`h-full w-full overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-800 ' : 'bg-gray-100 shadow-md'}`}>
                {loading ? (
                    <div>Loading messages...</div>
                ) : history && history.length > 0 ? (history.map((msg, id) => (
                msg.sender === friend ? (
                <div key={msg._id} className={` chat chat-start rounded-lg p-2  `} >
                    <div className="chat-image avatar">
                        <div
                            className="w-10 rounded-full bg-gray-500 ">
                            {info.imageData ? <img
                                src={`data:image/jpeg;base64,${info.imageData}`}
                                alt="Profile"
                                className=""
                            /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="relative left-1 top-1 text-gray-100 "                        >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>}
                        </div>
                    </div>
                    {msg.type === 'text' ? (
                        <div
                            onAuxClick={handleAuxClick}
                            className="max-w-96 min-w-24 h-auto bg-white text-gray-800 chat-bubble">
                            <div className="max-w-96 h-auto  break-words">{msg.message}</div>
                            <div className="flex float-right">
                                <div className="text-xs opacity-70 mt-1 text-right">
                                    {msg.time}
                                </div>
                            </div>
                        </div>
                    ) : (msg.type.startsWith('image') ? (
                        <div
                            onAuxClick={handleAuxClick}
                            className="bg-blue-500 text-white w-96 p-4 chat-bubble">
                            <img
                                src={msg.file}
                                alt="attachment"
                                className="rounded max-w-80 max-h-96 justify-center "
                            />
                            <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
                        </div>) : (
                        <div
                            onAuxClick={handleAuxClick}
                            className="bg-gray-500 text-white w-96 p-4 chat-bubble">
                            <video
                                src={msg.file}
                                alt="attachment"
                                className="rounded max-w-80 max-h-96 justify-center"
                                autoPlay={false}
                                controls={true}
                            />
                            <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
                        </div>
                    )
                    )}
                </div>
                ) : (
                <div key={msg._id} className={`chat chat-end rounded-lg p-2  `} >
                    {msg.type === 'text' ? (
                        <div
                            onAuxClick={handleAuxClick}
                            className="max-w-96 min-w-24  h-auto bg-blue-500 text-white chat-bubble">
                            <div className="max-w-80  h-auto break-words">{msg.message}</div>
                            <div className="text-xs opacity-70 mt-1 text-right">
                                {msg.time}
                                {msg.seen && (<div className="text-green-400 text-end">✓✓</div>)}
                            </div>
                        </div>
                    ) : (msg.type.startsWith('image') ? (
                        <div
                            onAuxClick={handleAuxClick}
                            className="text-white w-96 p-4 ">
                            <img
                                src={msg.file}
                                alt="attachment"
                                className="rounded-lg max-w-full h-auto justify-center "
                            />
                            <div className="relative bottom-5 right-4 text-right text-xs ">{msg.time}</div>
                        </div>) : (
                        <div
                            onAuxClick={handleAuxClick}
                            className=" text-white w-96 p-4 rounded-lg bg-black">
                            <video
                                src={msg.file}
                                alt="attachment"
                                className="rounded-lg w-full h-72 justify-center"
                                autoPlay={false}
                                controls={true}
                            />
                            <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
                        </div>
                    ))}
                </div>
                )
                ))
                ) : (
                <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                )}
                {beingTyped && (
                    <div className="chat chat-start mb-2">
                        <div className="chat-image avatar">
                            <div
                                className="w-10 rounded-full bg-gray-500 ">
                                {info.imageData ? <img
                                    src={`data:image/jpeg;base64,${info.imageData}`}
                                    alt="Profile"
                                    className=""
                                /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="relative left-1 top-1 text-gray-100 ">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>}
                            </div>
                        </div>
                        <div className="chat-bubble bg-white h-14 min-w-18">
                            <span className="loading loading-dots bg-slate-500 h-full w-full"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef}></div>
            </div>
            <div className={`p-4  ${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800 shadow-md'}`}>
                <form onSubmit={sendMessage} className="flex items-center">
                    <button
                        type="button"
                        onClick={toggleEmojiPicker}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >😊
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-20">
                            <Picker data={data} onEmojiSelect={addEmoji} theme={theme} />
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onChange={handleChange}
                        onPaste={handlePaste}
                        onDragOver={handleDragover}
                        onDrop={handleDrop}
                        className="flex-1 mx-4 p-2 border rounded-lg w-12 break-words focus:outline-none focus:border-blue-500"
                        autoFocus={true}
                    />
                    <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        📎
                        <input type="file" onChange={handleChange} name="media" className="hidden" />
                    </label>
                    <button
                        type="submit"
                        className="ml-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                    >
                        ➤
                    </button>
                </form>
            </div>

            {/* Call Modal */}
            {isCalling && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl">
                        <div className="flex justify-between items-center p-4 bg-gray-800">
                            <div className="text-white font-semibold">
                                {callType === 'video' ? 'Video Call' : 'Audio Call'} with {info.username || friend}
                            </div>
                            <button
                                onClick={endCall}
                                className="text-red-500 hover:text-red-700 focus:outline-none"
                            >
                                ✖
                            </button>
                        </div>
                        <div className="p-4">
                            {callType === 'video' ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-64 bg-black rounded-lg"
                                    ></video>
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-32 h-32 bg-black rounded-lg"
                                    ></video>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor"
                                            className="w-16 h-16 text-gray-500"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M6.62 10.79a15.05 15.05 0 006.58 6.58l2.2-2.2a1 1 0 011.11-.21 12.38 12.38 0 004.55 1.45 1 1 0 01.89 1v3.75a1 1 0 01-1 1A18 18 0 013 5a1 1 0 011-1h3.75a1 1 0 011 .89 12.38 12.38 0 001.45 4.55 1 1 0 01-.21 1.11l-2.2 2.2z" />
                                        </svg>
                                    </div>
                                    <div className="text-lg font-semibold">{info.username || friend}</div>
                                    <div className="text-gray-500">Audio Call</div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center p-4 bg-gray-100">
                            <button
                                onClick={endCall}
                                className="p-3 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none"
                            >
                                ✖ End Call
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {filePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
                        <div className="p-4">
                            {fileMessage.type.startsWith('image/') ? (
                                <img src={filePreview} alt="Preview" className="w-full h-auto rounded" />
                            ) : (
                                <video src={filePreview} autoPlay={false} controls={true} className="h-96 w-full" ></video>
                            )}
                        </div>
                        <div className="flex justify-end p-4 bg-gray-100">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none mr-2"
                            >
                                Cancel
                            </button>

                            <button

                                onClick={sendFileMessage}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none flex items-center justify-center"
                                disabled={isSendingFile} // Disable button while sending
                            >
                                {isSendingFile ? (
                                    <>
                                        <ClipLoader size={20} color="#ffffff" /> {/* Spinner while sending */}
                                        <span className="ml-2">Sending...</span>
                                    </>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
