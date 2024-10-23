/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import Messages from '../components/Message'
import Sender from "../components/Sender";


export default function DMArea({ socket, isMobile, theme }) {
    const navigate = useNavigate();
    const { friend_name } = useParams();
    const friend = localStorage.getItem('selectedFriend');
    const [lastMessage, setLastMessage] = useState("");
    const [history, setHistory] = useState([]);
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const accessToken = Cookies.get('accessToken');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastActiveTime, setLastActiveTime] = useState('');
    const [editingMessage, setEditingMessage] = useState(null)
    const [replying, setReplying] = useState(null)

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const messagesEndRef = useRef(null);

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
                const lastActiveTime = Math.floor(difference / 1440)
                if (lastActiveTime > 1) setLastActiveTime(`${lastActiveTime} days ago`)
                else setLastActiveTime('today')
            } else if (difference * 60 > 3600) {
                const lastActiveTime = Math.floor(difference / 60)
                if (lastActiveTime > 0) setLastActiveTime(`${lastActiveTime} hours ago`)
                else setLastActiveTime('an hour ago')
            } else if (difference * 60 > 60) {
                const lastActiveTime = Math.floor(difference)
                if (lastActiveTime > 0) setLastActiveTime(`${lastActiveTime} minutes ago`)
                else setLastActiveTime('a minute ago')
            } else {
                const lastActiveTime = Math.floor(difference * 60)
                if (lastActiveTime > 0) setLastActiveTime(`${lastActiveTime} seconds ago`)
                else setLastActiveTime('just now')
            }
        };
        getTimeDifference()
    }, [info, navigate, onlineUsers, socket])

    useEffect(() => {
        const isLastMessage = () => {
            if (!friend_name) return
            if (!history) return
            const lastM = history[history.length - 1]
            if (lastM && lastM.sender === friend) {
                setLastMessage(lastM._id)
            }
        }
        isLastMessage()
    }, [history, friend, friend_name, navigate])

    useEffect(() => {
        if (!friend_name) return;
        const fetchUserDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUser/${friend}`, {
                    headers: { 'accessToken': `${accessToken}` },
                });
                const data = await response.json();
                if (response.ok) setInfo(data.user);
                else if (response.status === 401) Cookies.set("accessToken", data.newToken);
                else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                } else navigate('/error')
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };
        fetchUserDetails();
    }, [friend, friend_name, navigate, accessToken]);




    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = async ({ newMessage }) => {
            if (newMessage.sender === friend) {
                setHistory((prevHistory) => [...prevHistory, newMessage]);
                socket.emit('message_seen', { receiver: friend, messageId: newMessage._id });
            }
        };

        const handleTyping = ({ sender }) => {
            if (sender === friend) setBeingTyped(true);
            else setBeingTyped(false);
        };

        const handleNotTyping = ({ sender }) => {
            if (sender === friend) setBeingTyped(false);
        };

        const handleMessageSent = ({ newMessage }) => {
            setHistory((prevHistory) => [...prevHistory, newMessage]);
        };

        const handleMessageSeen = ({ id, sender }) => {
            if (sender !== friend) return
            setHistory((prevHistory) => {
                const message = prevHistory.filter((message) => message._id === id)[0]
                const newMessage = { ...message, seen: true }
                return prevHistory.map((message) => message._id === id ? newMessage : message)
            });
        }

        const handleMessageEdition = (data) => {
            if (!data) return
            setHistory((prevHistory) => {
                const message = prevHistory.filter((history) => history._id === data.id)[0]
                const newMessage = { ...message, message: data.message, edited: true }
                console.log(newMessage)
                return prevHistory.map((message) => message._id === data.id ? newMessage : message)
            })
        }

        const handleMessageDeletion = (id) => {
            if (!id) return
            setHistory((prevHistory) => {
                return prevHistory.filter((message) => message._id !== id)
            })
        }

        const handleReaction = (data) => {
            if (!data) return
            setHistory((prevHistory) => {
                const message = prevHistory.filter((history) => history._id === data.id)[0]
                const newMessage = { ...message, reactions: [{ reaction: data.reaction, reactor: data.reactor }] }
                return prevHistory.map((message) => message._id === data.id ? newMessage : message)
            })
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
        socket.on('message_seen', handleMessageSeen)
        socket.on('message_edited', handleMessageEdition)
        socket.on('message_deleted', handleMessageDeletion)
        socket.on('receive_reacting', handleReaction)
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
            socket.off('message_seen', handleMessageSeen)
            socket.off('message_edited', handleMessageEdition)
            socket.off('message_deleted', handleMessageDeletion)
            socket.off('receive_reacting', handleReaction)
            socket.off('online_users', handleOnlineUsers)
        };
    }, [socket, friend, friend_name, peerConnection]);

    useEffect(() => {
        if (!friend_name) return;
        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://localhost:3001/message?receiver=${friend}`, {
                    headers: { 'accessToken': `${accessToken}` },
                });
                const data = await response.json();
                if (response.status === 401) Cookies.set("accessToken", data.newToken);
                else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate('/login')
                } else if (response.ok) setHistory(data.messages);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();
    }, [friend, friend_name, navigate, accessToken]);

    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend');
        navigate('/chat');
    };

    const handleEditMessage = (id) => {
        if (!id) return
        const message = history.filter((message) => message._id === id)[0]
        setEditingMessage(message)
    }

    const handleReplying = (id) => {
        if (!id) return
        const message = history.filter((message) => message._id === id)[0]
        setReplying(message)
    }

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

    if (!friend_name) return null
    if (loading) return <div className="loading loading-spinner"></div>
    return (
        <div className="flex flex-col h-full" >
            <div
                className={` flex items-center justify-between p-4 `}>
                <div className="flex items-center">
                    {isMobile && (
                        <button onClick={navigateBackward} className="mr-4 text-gray-500 hover:text-gray-800">
                            ←
                        </button>)}
                    <div className={`flex items-center ${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800 '}`}>
                        <div className="avatar">
                            <div className="h-14 w-14 rounded-lg ">
                                {info.imageData ? <img
                                    src={info.imageData}
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
                        className={`p-2 bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="text-white"                        >
                            <path d="M6.62 10.79a15.05 15.05 0 006.58 6.58l2.2-2.2a1 1 0 011.11-.21 12.38 12.38 0 004.55 1.45 1 1 0 01.89 1v3.75a1 1 0 01-1 1A18 18 0 013 5a1 1 0 011-1h3.75a1 1 0 011 .89 12.38 12.38 0 001.45 4.55 1 1 0 01-.21 1.11l-2.2 2.2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => startCall('video')}
                        className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="text-white"                        >
                            <path d="M17 10.5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3.5l4 4v-11l-4 4z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div
                className={`h-full w-full overflow-y-auto p-4 bg-transparent`}>
                {loading ? (
                    <div className=""><span className="loading loading-spinner"></span></div>
                ) : <Messages
                    messages={history}
                    info={info}
                    editingMessage={handleEditMessage}
                    socket={socket}
                    replying={handleReplying}
                />}

            </div>
            <Sender
                editingMessage={editingMessage}
                socket={socket}
                replying={replying}
            />

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

        </div>
    )
}
