/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback, } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import UserInfo from "../components/UserInfo";
import Messages from "../components/Message";
import Sender from "../components/Sender";


function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]) }
    return window.btoa(binary);
}

export default function GroupArea({ socket, isMobile, theme, onlineUsers, dataFromScreen, friends }) {
    const { name } = useParams()
    const navigate = useNavigate()
    const [scrollToBottom, setScrollToBottom] = useState(false)
    const [history, setHistory] = useState([])
    const [typingMembers, setTypingMembers] = useState([])
    const [typing, setTyping] = useState(false)
    const [group, setGroup] = useState([])
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [loading, setLoading] = useState(false)
    const [showingGroupInfo, setShowingGroupInfo] = useState(false)
    const user = Cookies.get('user')
    const accessToken = Cookies.get('accessToken')
    const selectedGroup = localStorage.getItem('selectedGroup')
    const [lou, setLou] = useState(0)

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const messagesEndRef = useRef(null);

    const ICE_SERVERS = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
        ],
    };
    useEffect(() => {
        const fetchGroup = async () => {
            if (!name || !accessToken) return;
            const result = await fetch(`http://localhost:3001/getGroup/${name}`, { headers: { 'accessToken': `${accessToken}` } });
            const data = await result.json();
            if (result.ok) setGroup(data.group);
            else navigate('/error');
        };
        fetchGroup();
    }, [name, accessToken, navigate]);


    useEffect(() => {
        if (socket && history.length > 0) {
            socket.emit('mark_group_messages_seen', {
                group: name,
                messages: history.map(msg => msg._id),
                user: user,
            });
        }
    }, [history, socket, name, user]);

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

        const handleReceiveMessage = ({ message }) => {
            setHistory((prevHistory) => [...prevHistory, message,]);
            setScrollToBottom(true);
            socket.emit('group_message_seen', { id: message._id, group: message.group })
        };

        const handleTyping = ({ group, member }) => {
            if (group === selectedGroup) {
                setTypingMembers((prev) => {
                    if (!prev.includes(member)) return [...prev, member]
                    return prev
                })
            }
            else setTyping(false)
            setScrollToBottom(true)
        }

        const handleNotTyping = () => setTyping(false);

        const handleMessageSeen = ({ messages: seenMessages, user }) => {
            setHistory((prevMessages) =>
                prevMessages.map((message) => {
                    if (seenMessages.includes(message._id)) {
                        return {
                            ...message,
                            seen: [...message.seen, { member: user, timestamp: new Date() }],
                        };
                    }
                    return message;
                })
            );
        }


        const handleMemberSawMessage = ({ id, member }) => {
            setHistory((prevHistory) => {
                return prevHistory.map((message) => {
                    if (message._id === id) {
                        return { ...message, seen: [...message.seen, member] };
                    }
                    return message;
                });
            });
        };

        const handleGroupMessageSent = ({ message }) => {

            setHistory((prevHistory) => [...prevHistory, message])
            setScrollToBottom(true)
        }

        const handleCallOffer = async ({ offer, sender, type }) => {
            if (sender !== name) return;

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

        socket.on("receive_group_message", handleReceiveMessage);
        socket.on('member_typing', handleTyping);
        socket.on('not_typing', handleNotTyping);
        socket.on('group-message', handleReceiveMessage);
        socket.on('group_message_sent', handleGroupMessageSent);
        socket.on("group_message_seen", handleMessageSeen);
        socket.on('member_saw_message', handleMemberSawMessage)
        socket.on('call-offer', handleCallOffer);
        socket.on('call-answer', handleCallAnswer);
        socket.on('ice-candidate', handleICECandidate);

        return () => {
            socket.off("receive_group_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
            socket.off('group-message', handleReceiveMessage);
            socket.off('group_message_sent', handleGroupMessageSent);
            socket.off('call-offer', handleCallOffer);
            socket.off('call-answer', handleCallAnswer);
            socket.off('ice-candidate', handleICECandidate);
        };
    }, [socket, name]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                if (!name || !accessToken) return;
                const response = await fetch(`http://localhost:3001/gmessage/${name}`, {
                    headers: { 'accessToken': `${accessToken}` }
                })
                const data = await response.json();
                if (response.ok) {
                    setHistory(data.gmessages);
                    setScrollToBottom(true);
                } else if (response.status === 401) {
                    Cookies.set("accessToken", data.accessToken);
                } else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                }
            }
            catch (err) { console.log(err) }
            finally { setLoading(false) }
        };

        fetchMessages();
    }, [name, accessToken, navigate]);


    const sendDataToParent = () => {
        dataFromScreen(showingGroupInfo)
    }


    const navigateBackward = () => {
        localStorage.removeItem('selectedGroup');
        navigate('/group');
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

        const pc = createPeerConnection(name);
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
            socket.emit('call-offer', { offer, receiver: name, type, });
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


    useEffect(() => {
        const getOnlineMembers = () => {
            if (!onlineUsers) return 0;
            const result = onlineUsers.filter(u => u !== Cookies.get('user')).length;
            setLou(result)
        };
        getOnlineMembers()
    }, [onlineUsers])

    const showGroupInfo = () => {
        setShowingGroupInfo(!showingGroupInfo)
        localStorage.setItem('g_i', showingGroupInfo)
        sendDataToParent()
    }
    if (!name) return null
    if (loading) return <div className="loading loading-spinner"></div>

    return (
        <div className="flex flex-col h-full " >
            <div
                className={` flex items-center justify-between p-4 w-full`}>
                <div
                    className="flex items-center w-full">
                    {isMobile && (
                        <button onClick={navigateBackward} className="mr-4 text-gray-500 hover:text-gray-800">
                            ←
                        </button>
                    )}
                    <div
                        onClick={showGroupInfo}
                        className={`flex items-center w-full  text-gray-800 `}>
                        <div className="avatar ">
                            <div className="h-14 w-14 rounded-full ">
                                {group.imageData ? <img
                                    src={group.imageData}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                                    : <svg
                                        className="ml-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="24"
                                        height="24"><path fill={`${theme === 'dark' ? 'white' : 'black'}`} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" /></svg>
                                }
                            </div>
                        </div>
                        <div className="ml-4 flex-col w-full">
                            <div className="text-lg font-semibold text-center">{group.name}</div>
                            <div className="text-sm font-semibold text-gray-600 flex justify-center ">
                                <div className="flex justify-between w-32">
                                    <div className="text-sm">{group.members ? group.members.length : '0'}members</div>
                                    <div className="text-sm">{lou}online</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-4 w-1/3">
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
                className={`h-full w-full overflow-y-auto p-4 `}
            >
                {loading ? (
                    <div>Loading messages...</div>
                ) : <Messages
                    history={history}
                    group={group}
                    onlineUsers={onlineUsers}
                    typingMembers={typingMembers}
                />}
            </div>

            <Sender socket={socket} />

            {isCalling && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl">
                        <div className="flex justify-between items-center p-4 bg-gray-800">
                            <div className="text-white font-semibold">
                                {callType === 'video' ? 'Video Call' : 'Audio Call'} with {group.name}
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
                                    <div className="text-lg font-semibold">{group.name}</div>
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

            {name && (<div>
                <UserInfo friends={friends} />
            </div>)}
        </div>
    );
}