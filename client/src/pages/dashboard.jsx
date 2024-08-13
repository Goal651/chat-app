/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, lazy } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Settings from "./setting";

const Navigation = lazy(() => import("../components/navigation"));
const CreateGroup = lazy(() => import("../components/createGroup"));
const NotFound = lazy(() => import("./construction"));
const Details = lazy(() => import("../components/info"));
const Profile = lazy(() => import("./profile"));
const GroupContent = lazy(() => import("../components/GroupContent"));
const ChatContent = lazy(() => import("../components/ChatContent"));

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(url, { withCredentials: true });
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [url]);

    return socket;
};

const Dashboard = ({ isMobile }) => {
    const navigate = useNavigate();
    const { name, user, type } = useParams();
    const [friends, setFriends] = useState([]);
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [loading, setLoading] = useState(true);
    const accessToken = Cookies.get('accessToken');
    const [groups, setGroups] = useState([]);
    const socket = useSocket("http://localhost:3001");
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!accessToken) {
            navigate('/login');
        }
    }, [navigate, accessToken]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [friendsResponse, groupsResponse] = await Promise.all([
                    fetch('http://localhost:3001/allFriends', { headers: { 'accessToken': accessToken } }),
                    fetch('http://localhost:3001/allGroups', { headers: { 'accessToken': accessToken } }),
                ]);

                if (friendsResponse.status === 401 && groupsResponse.status === 401) {
                    const newToken = await groupsResponse.json();
                    Cookies.set('accessToken', newToken.accessToken);
                    window.location.reload();
                } else if (friendsResponse.status === 400 && groupsResponse.status === 400) {
                    navigate('/login');
                } else {
                    const friendsData = await friendsResponse.json();
                    const groupsData = await groupsResponse.json();
                    setFriends(friendsData.users);
                    setGroups(groupsData.groups);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
                setLoadingGroup(false);
            }
        };

        fetchData();
    }, [accessToken, navigate]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('fetch_online_users');
        socket.on('online_users', setOnlineUsers);
        socket.on('marked_as_read', updateFriends);
        socket.on('receive_message', updateFriendsWithMessage);
        socket.on('message_sent', updateFriendsWithMessage);

        return () => {
            socket.off('online_users');
            socket.off('marked_as_read');
            socket.off('receive_message');
            socket.off('message_sent');
        };
    }, [socket]);

    useEffect(() => {
        const interval = setInterval(updateFriends, 10000);
        return () => clearInterval(interval);
    }, []);

    const updateFriends = async () => {
        try {
            const friendsResponse = await fetch(`http://localhost:3001/allFriends`, { headers: { 'accessToken': Cookies.get('accessToken') } });
            const friendsData = await friendsResponse.json();
            setFriends(friendsData.users);
        } catch (error) {
            console.error("Error updating friends:", error);
        }
    };

    const updateFriendsWithMessage = (message) => {
        setFriends(friends => {
            const updatedFriends = friends.map(friend => {
                if (friend.email === message.sender || friend.email === message.receiver) {
                    return { ...friend, latestMessage: message };
                }
                return friend;
            });
            return sortFriendsByLatestMessage(updatedFriends);
        });
    };

    const sortFriendsByLatestMessage = (friends) => {
        return friends.sort((a, b) => {
            const aTimestamp = a.latestMessage ? new Date(a.latestMessage.timestamp) : new Date(0);
            const bTimestamp = b.latestMessage ? new Date(b.latestMessage.timestamp) : new Date(0);
            return bTimestamp - aTimestamp;
        });
    };

    const renderContent = () => {
        if (loading || loadingGroup) {
            return (
                <div className="flex h-full w-full">
                    <div className="flex flex-col w-1/3 justify-around h-full gap-4 pl-10">
                        {[...Array(7)].map((_, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="skeleton h-16 w-16 shrink-0 rounded-full"></div>
                                <div className="flex flex-col gap-4">
                                    <div className="skeleton h-4 w-28"></div>
                                    <div className="skeleton h-4 w-28"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="h-screen w-2/3 ml-40">
                        <div className="flex items-center gap-4 h-1/6">
                            <div className="skeleton h-16 w-16 shrink-0 rounded-2xl"></div>
                            <div className="flex flex-col gap-4">
                                <div className="skeleton h-4 w-28"></div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-around h-4/6">
                            {[...Array(3)].map((_, index) => (
                                <div key={index} className="chat chat-start">
                                    <div className="skeleton chat-bubble w-60"></div>
                                </div>
                            ))}
                            {[...Array(3)].map((_, index) => (
                                <div key={index} className="chat chat-end">
                                    <div className="skeleton chat-bubble w-60"></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center">
                            <div className="skeleton input w-full" />
                        </div>
                    </div>
                </div>
            );
        }

        const contentMap = {
            group: <GroupContent groups={groups} socket={socket} onlineUsers={onlineUsers} friends={friends} isMobile={isMobile} />,
            'create-group': <CreateGroup isMobile={isMobile} />,
            chat: <ChatContent friends={friends} socket={socket} isMobile={isMobile} />,
            profile: <Profile isMobile={isMobile} />,
            setting: <Settings isMobile={isMobile} />,
            default: <NotFound />,
        };

        if (name) return <GroupContent groups={groups} socket={socket} />;
        if (user) return <ChatContent friends={friends} socket={socket} />;
        return contentMap[type] || <ChatContent friends={friends} socket={socket} />;
    };

    return (
        <div className="flex flex-row bg-black h-full">
            <div id="mobile" className="w-1/12">
                <Navigation socket={socket} isMobile={isMobile} />
            </div>
            <div className="bg-white text-black mr-4 my-4 pt-6 pl-0 w-5/6 rounded-3xl">
                {renderContent()}
            </div>
            <div id="mobile" className="w-1/6 bg-white my-4 mr-4 rounded-3xl">
                <Details onlineUsers={onlineUsers} isMobile={isMobile} />
            </div>
        </div>
    );
};

export default Dashboard;
