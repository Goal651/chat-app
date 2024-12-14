/* eslint-disable react/prop-types */
import { useEffect, useState, lazy, Suspense } from "react";
import Cookies from "js-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import NotificationBanner from "../components/NotificationBanner";

const NotificationPermissionModal = lazy(() => import('../components/NotificationPermissionModal'))
const Settings = lazy(() => import("./Setting"));
const Navigation = lazy(() => import("../screens/Navigator"));
const CreateGroup = lazy(() => import("../screens/CreateGroup"));
const Profile = lazy(() => import("./Profile"));
const GroupContent = lazy(() => import("../screens/GroupContent"));
const ChatContent = lazy(() => import("../screens/ChatContent"));

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(url, {
            withCredentials: true,
            extraHeaders: { "x-access-token": `${Cookies.get("accessToken")}` }
        });
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [url]);
    return socket;
};

export default function Dashboard({ isMobile }) {
    const navigate = useNavigate();
    const { friend_name, group_name, type } = useParams();

    // State variables
    const [friends, setFriends] = useState(sessionStorage.getItem('friends') ? JSON.parse(sessionStorage.getItem('friends')) : []);
    const [groups, setGroups] = useState(sessionStorage.getItem('groups') ? JSON.parse(sessionStorage.getItem('groups')) : []);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [userInfo, setUserInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission);

    // Access token and socket 
    const accessToken = Cookies.get("accessToken");
    const socket = useSocket("https://chat-app-production-2663.up.railway.app/");
    const theme = localStorage.getItem("theme");
    const selectedFriend = localStorage.getItem('selectedFriend');

    useEffect(() => {
        if (!accessToken) {
            Cookies.remove("accessToken");
            localStorage.clear();
            navigate("/login");
        }
    }, [navigate, accessToken]);

    // Fetch user details
    const fetchUserDetails = async () => {
        try {
            const response = await fetch("https://chat-app-production-2663.up.railway.app/getUserProfile", { headers: { accessToken } });
            const data = await response.json();
            if (response.ok) {
                setUserInfo(data.user);
                setUnreadMessages(data.user.unreads);
                sessionStorage.setItem('chatUser', JSON.stringify(data.user));
            } else if (response.status === 401) {
                Cookies.set("accessToken", data.newToken);
            } else {
                navigate("/login");
            }
        } catch {
            navigate("/error");
        }
    };

    // Fetch initial data (friends and groups)
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [friendsRes, groupsRes] = await Promise.all([
                fetch("https://chat-app-production-2663.up.railway.app/allFriends", { headers: { accessToken } }),
                fetch("https://chat-app-production-2663.up.railway.app/allGroups", { headers: { accessToken } })
            ]);

            if (friendsRes.ok && groupsRes.ok) {
                const friendsData = await friendsRes.json();
                const groupsData = await groupsRes.json();
                setFriends(sortByLatestMessage(friendsData.users));
                setGroups(sortByLatestMessage(groupsData.groups));
                sessionStorage.setItem('friends', JSON.stringify(friendsData.users));
                sessionStorage.setItem('groups', JSON.stringify(groupsData.groups));
                setLoading(false);
            } else if (friendsRes.status === 401 || groupsRes.status === 401) {
                Cookies.set("accessToken", (await friendsRes.json()).newToken);
            } else {
                navigate("/login");
            }
        } catch {
            setLoading(false);
        }
    };

    // Notification permission check
    const checkNotificationAllowed = async () => {
        if (permissionStatus === 'default' && !isModalVisible) {
            setIsModalVisible(true);
        }
    };

    // Handle notifications permission
    const handleAllowNotifications = async () => {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        setIsModalVisible(false);
    };

    // Close notification modal
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    useEffect(() => {
        checkNotificationAllowed();
    }, [permissionStatus]);

    useEffect(() => {
        if (!accessToken) return;
        fetchUserDetails();
        if (friends.length || groups.length) setLoading(false);
        else fetchInitialData();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleOnlineUsers = (data) => setOnlineUsers(data);
        const handleIncomingMessage = (message) => {
            const { newMessage, messageType } = message;
            if (messageType === 'dm') {
                if (!friend_name && newMessage.sender !== selectedFriend) {
                    socket.emit('message_not_seen', { message: newMessage.message, sender: newMessage.sender });
                }
                const senderDetails = friends.filter((friend) => friend.email == newMessage.sender)[0]
                NotificationBanner({
                    userDetails:senderDetails,
                    title: senderDetails.username,
                    body: newMessage.message
                });

                setFriends(prevFriends => {
                    const updatedFriends = prevFriends.map(friend =>
                        [newMessage.sender, newMessage.receiver].includes(friend.email)
                            ? { ...friend, latestMessage: newMessage }
                            : friend
                    );
                    const sortedFriends = sortByLatestMessage(updatedFriends);
                    sessionStorage.setItem('friends', JSON.stringify(sortedFriends));
                    return sortedFriends;
                });
            }

            else if (messageType === 'group') {
                setGroups(prevGroups => {
                    const updatedGroups = prevGroups.map(group =>
                        group.name === newMessage.groupName
                            ? { ...group, latestMessage: newMessage }
                            : group
                    );
                    const sortedGroups = sortByLatestMessage(updatedGroups);
                    sessionStorage.setItem('groups', JSON.stringify(sortedGroups));
                    return sortedGroups;
                });
            }
        };

        socket.emit("fetch_online_users");
        socket.on("online_users", handleOnlineUsers);
        socket.on("receive_message", handleIncomingMessage);

        return () => {
            socket.off("online_users", handleOnlineUsers);
            socket.off("receive_message", handleIncomingMessage);
        };
    }, [socket, friend_name, selectedFriend]);

    const sortByLatestMessage = (data) => {
        return data.sort((a, b) => new Date(b.latestMessage?.timestamp || 0) - new Date(a.latestMessage?.timestamp || 0));
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className='h-screen w-screen left-0 top-0 fixed flex justify-center bg-slate-900'>
                    <span className='loading loading-infinity h-screen bg-white'></span>
                </div>
            );
        }

        const contentMap = {
            group: (
                <GroupContent
                    groups={groups}
                    socket={socket}
                    onlineUsers={onlineUsers}
                    friends={friends}
                    isMobile={isMobile}
                    theme={theme}
                    userInfo={userInfo}
                />
            ),
            "create-group": (
                <CreateGroup isMobile={isMobile} theme={theme} />
            ),
            chat: (
                <ChatContent
                    friends={friends}
                    socket={socket}
                    isMobile={isMobile}
                    theme={theme}
                />
            ),
            profile: (
                <Profile
                    isMobile={isMobile}
                    theme={theme}
                    userInfo={userInfo}
                />
            ),
            setting: <Settings isMobile={isMobile} />,
            default: <ChatContent friends={friends} socket={socket} isMobile={isMobile} theme={theme} />,
        };

        if (group_name) return <GroupContent groups={groups} socket={socket} isMobile={isMobile} theme={theme} userInfo={userInfo} onlineUsers={onlineUsers} friends={friends} />;
        if (friend_name) return <ChatContent friends={friends} socket={socket} isMobile={isMobile} theme={theme} />;
        return contentMap[type] || contentMap["default"];
    };

    return (
        <div className={`flex flex-row w-full h-screen text-sm bg-black`}>

            <Suspense fallback={
                <div className='h-screen w-screen left-0 top-0 fixed flex justify-center bg-slate-900'>
                    <span className='loading loading-infinity h-screen bg-white'></span>
                </div>
            }>
                {isModalVisible && (
                    <NotificationPermissionModal
                        onAllow={handleAllowNotifications}
                        onClose={handleCloseModal}
                    />
                )}
                <div className='w-full h-screen flex items-center'>
                    <div className='h-full p-4'>
                        <Navigation
                            socket={socket}
                            isMobile={isMobile}
                            theme={theme}
                            userInfo={userInfo}
                            unreadMessages={unreadMessages}
                        />
                    </div>
                    <div className='w-full lg:m-4 md:m-2 bg-white lg:rounded-xl md:rounded-lg'>
                        {renderContent()}
                    </div>
                </div>
            </Suspense>
        </div>
    );
}
