/* eslint-disable react/prop-types */
import { useEffect, useState, lazy, Suspense } from "react";
import Cookies from "js-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const Settings = lazy(() => import("./Setting"));
const Navigation = lazy(() => import("../screens/Navigator"));
const CreateGroup = lazy(() => import("../screens/CreateGroup"));
const Profile = lazy(() => import("./Profile"));
const GroupContent = lazy(() => import("../screens/GroupContent"));
const ChatContent = lazy(() => import("../screens/ChatContent"));

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        const newSocket = io(url, { withCredentials: true, extraHeaders: { "x-access-token": `${Cookies.get("accessToken")}` } });
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [url]);
    return socket;
};

export default function Dashboard({ isMobile }) {
    const navigate = useNavigate();
    const { friend_name, group_name, type } = useParams();
    const [friends, setFriends] = useState(sessionStorage.getItem('friends') ? JSON.parse(sessionStorage.getItem('friends')) : []);
    const [groups, setGroups] = useState(sessionStorage.getItem('groups') ? JSON.parse(sessionStorage.getItem('groups')) : []);
    const [notifications, setNotifications] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [userInfo, setUserInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const accessToken = Cookies.get("accessToken");
    const socket = useSocket("https://chat-app-production-2663.up.railway.app/");
    const theme = localStorage.getItem("theme");
    const selectedFriend = localStorage.getItem('selectedFriend');
    const [notificationPrompt, setNotificationPrompt] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState([]);

    // Notification permission request
    useEffect(() => {
        if (Notification.permission === "default") setNotificationPrompt(true);
    }, []);

    const handleRequestNotificationPermission = () => {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") console.log("Notification permission granted.");
            setNotificationPrompt(false);
        });
    };

    useEffect(() => {
        if (!accessToken) {
            Cookies.remove("accessToken");
            localStorage.clear();
            navigate("/login");
        }
    }, [navigate, accessToken]);

    useEffect(() => {
        if (!accessToken) return;
        const fetchUserDetails = async () => {
            try {
                const response = await fetch("https://chat-app-production-2663.up.railway.app/getUserProfile", { headers: { accessToken } });
                const data = await response.json();
                if (response.ok) {
                    setUserInfo(data.user);
                    setUnreadMessages(data.user.unreads)
                    sessionStorage.setItem('chatUser', JSON.stringify(data.user));
                } else if (response.status === 401) Cookies.set("accessToken", data.newToken);
                else navigate("/login");
            } catch {
                navigate("/error");
            }
        };
        fetchUserDetails();
    }, [accessToken, navigate]);

    useEffect(() => {
        if (!accessToken) return;
        const fetchInitialData = async () => {
            try {
                const [friendsRes, groupsRes] = await Promise.all([
                    fetch("https://chat-app-production-2663.up.railway.app/allFriends", { headers: { accessToken } }),
                    fetch("https://chat-app-production-2663.up.railway.app/allGroups", { headers: { accessToken } }),
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
                } else navigate("/login");
            } catch {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [accessToken, navigate]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        const handleOnlineUsers = (data) => setOnlineUsers(data);

        const handleIncomingMessage = (message) => {
            const { newMessage, messageType } = message;

            // For direct message (DM)
            if (messageType === 'dm') {
                // Check if the message is for the selected friend
                if (!friend_name && newMessage.sender !== selectedFriend) {
                    socket.emit('message_not_seen', { message: newMessage.message, sender: newMessage.sender });
                }

                // Update notifications
                setNotifications({
                    from: newMessage.sender,
                    to: newMessage.receiver,
                    message: newMessage.message,
                    timestamp: newMessage.timestamp,
                    type: 'dm'
                });

                // Create a new notification
                if (Notification.permission === "granted") {
                    const notification = new Notification(`New message from ${newMessage.sender}`, { body: newMessage.message });
                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                }

                // Update friends list with the latest message
                setFriends(prevFriends => {
                    const updatedFriends = prevFriends.map(friend =>
                        [newMessage.sender, newMessage.receiver].includes(friend.email)
                            ? { ...friend, latestMessage: newMessage }
                            : friend
                    );
                    const sortedFriends = sortByLatestMessage(updatedFriends);

                    // Persist updated friends list in sessionStorage
                    sessionStorage.setItem('friends', JSON.stringify(sortedFriends));

                    return sortedFriends;
                });
            }

            // For group messages
            if (messageType === 'group') {
                // Update groups list with the latest message for the specific group
                setGroups(prevGroups => {
                    const updatedGroups = prevGroups.map(group =>
                        group.name === newMessage.groupName
                            ? { ...group, latestMessage: newMessage }
                            : group
                    );
                    const sortedGroups = sortByLatestMessage(updatedGroups);

                    // Persist updated groups list in sessionStorage
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
                <CreateGroup
                    isMobile={isMobile}
                    theme={theme} />
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
            default: <ChatContent
                friends={friends}
                socket={socket}
                isMobile={isMobile}
                theme={theme} />,
        };

        if (group_name)
            return (
                <GroupContent
                    groups={groups}
                    socket={socket}
                    isMobile={isMobile}
                    theme={theme}
                    userInfo={userInfo}
                    onlineUsers={onlineUsers}
                    friends={friends}
                />
            );
        if (friend_name)
            return (
                <ChatContent
                    friends={friends}
                    socket={socket}
                    isMobile={isMobile}
                    theme={theme}
                />
            );
        return contentMap[type] || contentMap["default"];
    };

    return (
        <div
            className={`flex flex-row w-full h-screen text-sm bg-black`}
        >
            {notificationPrompt && (
                <div
                    role="alert"
                    className="fixed alert z-50">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-info h-6 w-6 shrink-0">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Allow notification to keep up to date</span>
                    <div>
                        <button
                            className="btn btn-sm"
                            onClick={handleRequestNotificationPermission}>
                            Allow Notifications
                        </button>
                        <button
                            className="btn btn-sm"
                            onClick={() => setNotificationPrompt(false)}>
                            Not Now
                        </button>
                    </div>
                </div>
            )}
            <Suspense fallback={
                <div className='h-screen w-screen left-0 top-0 fixed flex justify-center bg-slate-900'>
                    <span className='loading loading-infinity h-screen bg-white'></span>
                </div>
            }>

                <div className='w-full h-full flex justify-evenly '
                >
                    <div
                        className={`${isMobile ? `${type || friend_name || group_name && "hidden"}` : "w-[7%] h-full"}`}
                    >
                        <Navigation
                            socket={socket}
                            isMobile={isMobile}
                            theme={theme}
                            userInfo={userInfo} 
                            unreadMessages={unreadMessages}
                            />

                    </div>
                    <div
                        className={` ${isMobile ? "w-full h-full  rounded-none " : "text-black mr-4 my-2  w-[93%] rounded-3xl"} `}
                    >
                        {renderContent()}
                    </div>
                </div>
            </Suspense>
        </div>
    );
}
