/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { useParams, useNavigate } from "react-router-dom";
import Messages from '../components/Message'
import Sender from "../components/Sender";
import Calls from "../components/Calls";


export default function DMArea({ socket, isMobile, theme, friends }) {
    const navigate = useNavigate();
    const friend = localStorage.getItem('selectedFriend');
    const storedMessages = JSON.parse(sessionStorage.getItem(`${friend}Message`))
    const storedFriendData = JSON.parse(sessionStorage.getItem(`friend-${friend}`))
    const { friend_name } = useParams();
    const [lastMessage, setLastMessage] = useState("");
    const [history, setHistory] = useState(storedMessages ? storedMessages : []);
    const [beingTyped, setBeingTyped] = useState(false);
    const [info, setInfo] = useState(storedFriendData ? storedFriendData : null);
    const [loading, setLoading] = useState(true);
    const accessToken = Cookies.get('accessToken');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastActiveTime, setLastActiveTime] = useState('');
    const [editingMessage, setEditingMessage] = useState(null)
    const [replying, setReplying] = useState(null)
    const [callType, setCallType] = useState('')


    useEffect(() => {
        const findUserDetails = () => {
            setInfo(storedFriendData ? storedFriendData : null)
            if (friends) {
                const currentUser = friends.find((user) => user.email === friend);
                if (currentUser) {
                    setInfo(currentUser)
                    const cleanFriend = { ...currentUser, imageData: null }
                    sessionStorage.setItem(`friend-${currentUser.email}`, JSON.stringify(cleanFriend))
                }
            }
        }
        findUserDetails();
    }, [friends, navigate, friend, friend_name])

    useEffect(() => {
        setLoading(true)
    }, [friend_name])


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
            } else if (difference * 60 > 0) {
                const lastActiveTime = Math.floor(difference * 60)
                if (lastActiveTime > 0) setLastActiveTime(`${lastActiveTime} seconds ago`)
                else setLastActiveTime('just now')
            } else {
                setLastActiveTime('')
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

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("not_typing", handleNotTyping);
            socket.off('message_sent', handleMessageSent);
            socket.off('receive_file', handleReceiveMessage)
            socket.off('message_seen', handleMessageSeen)
            socket.off('message_edited', handleMessageEdition)
            socket.off('message_deleted', handleMessageDeletion)
            socket.off('receive_reacting', handleReaction)
            socket.off('online_users', handleOnlineUsers)
        };
    }, [socket, friend, friend_name]);


    useEffect(() => {
        if (!friend_name) return;
        const fetchMessages = async () => {
            try {
                const response = await fetch(`https://chat-app-production-2663.up.railway.app/message?receiver=${friend}`, { headers: { 'accessToken': `${accessToken}` }, });
                const data = await response.json();
                if (response.status === 401) Cookies.set("accessToken", data.newToken);
                else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate('/login')
                } else if (response.ok) {
                    setHistory(data.messages)
                    const cleanMessage = data.messages.map((message) => { return { ...message, file: null } })
                    sessionStorage.setItem(`${friend}Messages`, JSON.stringify(cleanMessage));
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally { setLoading(false) }
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

    const startCall = (type) => setCallType(type)
    const handleEndingCall = (data) => setCallType(data)



    if (!friend_name) return null
    if (!info || !friends) return null

    return (
        <div className="flex flex-col h-full" >
            <div className={` flex items-center justify-between p-4 `}>
                <div className="flex items-center">
                    {info && (
                        <div className={`flex items-center `}>
                            <div className="">
                                <div className="h-14 w-14 rounded-full bg-inherit ">
                                    {info.imageData ? <img
                                        src={info.imageData}
                                        alt="Profile"
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                        :
                                        <img
                                            src='/welcome.jpg'
                                            alt="Profile"
                                            className="h-full w-full rounded-full object-cover"
                                        />}
                                </div>
                            </div>
                            <div className="ml-4">
                                <div className="text-lg font-semibold">
                                    {info.username}
                                </div>
                                {onlineUsers.includes(info.email) ? (beingTyped ? (
                                    <div className="text-md text-green-600 ">typing ...</div>) :
                                    <div className="text-sm ">Online</div>
                                ) : (
                                    <div className="text-sm font-semibold">
                                        last seen: {lastActiveTime}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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

            <Calls
                socket={socket}
                type={callType}
                endingCall={handleEndingCall} />

        </div>
    )
}
