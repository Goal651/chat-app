/* eslint-disable react/prop-types */
import { useEffect, useState, lazy, Suspense } from "react";
import Cookies from "js-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
const Settings = lazy(() => import("./Setting"))
const Navigation = lazy(() => import("../screens/Navigator"));
const CreateGroup = lazy(() => import("../screens/CreateGroup"));
const Details = lazy(() => import("../components/Info"));
const Profile = lazy(() => import("./Profile"));
const GroupContent = lazy(() => import("../screens/GroupContent"));
const ChatContent = lazy(() => import("../screens/ChatContent"));
const NotificationBanner = lazy(() => import("../components/Notification"))

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        const newSocket = io(url, { withCredentials: true ,extraHeaders: { "x-access-token": `${Cookies.get("accessToken")}` }});
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [url]);
    return socket;
};

export default function Dashboard({ isMobile }) {
    const navigate = useNavigate();
    const { friend_name, group_name, type } = useParams();
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [notifications, setNotifications] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [userInfo, setUserInfo] = useState([])
    const [loading, setLoading] = useState(true);
    const [reloadProfile, setReloadProfile] = useState(false);
    const accessToken = Cookies.get("accessToken");
    const socket = useSocket("http://localhost:3001");
    const theme = localStorage.getItem("theme");
    const [showGroupInfo, setShowingGroupInfo] = useState(false)
    const selectedFriend = localStorage.getItem('selectedFriend')

    useEffect(() => {
        if (!accessToken) navigate("/login");
    }, [navigate, accessToken]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!accessToken) return
            try {
                const response = await fetch(`http://localhost:3001/getUserProfile`, { headers: { accessToken: `${accessToken}` }, });
                const data = await response.json();
                if (response.status === 401) {
                    Cookies.set("accessToken", data);
                    window.location.reload();
                } else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                }
                else if (response.ok) setUserInfo(data.user)
            } catch (error) { navigate("/error"); }
        }
        fetchUserDetails()
    }, [accessToken, reloadProfile, navigate]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [friendsResponse, groupsResponse] = await Promise.all([
                    fetch("http://localhost:3001/allFriends", {
                        headers: { accessToken },
                    }),
                    fetch("http://localhost:3001/allGroups", {
                        headers: { accessToken },
                    }),
                ]);

                if (friendsResponse.status === 401 && groupsResponse.status === 401) {
                    const newToken = await friendsResponse.json();
                    Cookies.set("accessToken", newToken.newToken);
                } else if (friendsResponse.status === 403 && groupsResponse.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                }
                else {
                    setFriends(sortByLatestMessage((await friendsResponse.json()).users));
                    setGroups(sortByLatestMessage((await groupsResponse.json()).groups));
                }
            } catch (error) { console.error("Error fetching data:", error) }
            finally { setLoading(false) }
        };
        fetchInitialData();
    }, [accessToken, navigate]);


    useEffect(() => {
        if (!socket) return;
        const handleOnlineUsers = data => setOnlineUsers(data)
        const handleIncomingMessage = (message) => {
            const { newMessage } = message
            if (!friend_name && newMessage.sender !== selectedFriend) {
                socket.emit('message_not_seen', { message: newMessage.message, sender: newMessage.sender })
            }
            const newNotifications = {
                from: newMessage.sender,
                to: newMessage.receiver,
                message: newMessage.message,
                timestamp: newMessage.timestamp,
                type: 'dm'
            };
            setNotifications(newNotifications);
            setFriends((prevFriends) =>
                sortByLatestMessage(
                    prevFriends.map((friend) =>
                        [newMessage.sender, newMessage.receiver].includes(friend.email)
                            ? { ...friend, latestMessage: newMessage }
                            : friend
                    )
                )
            );
        };
        socket.emit("fetch_online_users");
        socket.on("online_users", handleOnlineUsers);
        socket.on("marked_as_read", updateAllData);
        socket.on("receive_message", handleIncomingMessage);
        socket.on("receive_group_message", handleIncomingGroupMessage);
        socket.on("message_sent", handleMessageSent);
        socket.on("group_message_sent", handleIncomingGroupMessage);

        return () => {
            socket.off("online_users");
            socket.off("marked_as_read");
            socket.off("receive_message");
            socket.off("receive_group_message");
            socket.off("message_sent");
            socket.off("group_message_sent");
        }
    }, [socket])

    useEffect(() => {
        const friendsInterval = setInterval(updateFriends, 10000);
        const groupsInterval = setInterval(updateGroups, 10000);

        return () => {
            clearInterval(friendsInterval);
            clearInterval(groupsInterval);
        };
    }, []);

    const updateAllData = async () => {
        await updateFriends();
        await updateGroups();
    };

    const updateFriends = async () => {
        try {
            const response = await fetch("http://localhost:3001/allFriends", {
                headers: { accessToken: Cookies.get("accessToken") },
            });
            const data = await response.json();
            if (response.ok) setFriends(sortByLatestMessage(data.users));
            else if (response.status === 401) Cookies.set("accessToken", data.newToken);
            else if (response.status === 403) {
                Cookies.remove('accessToken')
                navigate("/login")
            }
        } catch (error) {
            console.error("Error updating friends:", error);
        }
    };

    const updateGroups = async () => {
        try {
            const response = await fetch("http://localhost:3001/allGroups", {
                headers: { accessToken: Cookies.get("accessToken") },
            });
            const data = await response.json();
            if (response.ok) setGroups(sortByLatestMessage(data.groups));
            else if (response.status === 401) Cookies.set("accessToken", data.newToken);
            else if (response.status === 403) {
                Cookies.remove('accessToken')
                navigate("/login")
            }
        } catch (error) {
            console.error("Error updating groups:", error);
        }
    };


    const handleMessageSent = (message) => {
        const { newMessage } = message
        setFriends((prevFriends) => sortByLatestMessage(
            prevFriends.map((friend) =>
                [newMessage.sender, newMessage.receiver].includes(friend.email)
                    ? { ...friend, latestMessage: newMessage }
                    : friend
            )
        )
        );
    };

    const handleIncomingGroupMessage = (message) => {
        setGroups((prevGroups) =>
            sortByLatestMessage(
                prevGroups.map((group) =>
                    group.name === message.group
                        ? { ...group, latestMessage: message }
                        : group
                )
            )
        );
    };

    const sortByLatestMessage = (items) =>
        items.sort(
            (a, b) =>
                new Date(b.latestMessage?.timestamp || 0) -
                new Date(a.latestMessage?.timestamp || 0)
        );

    const handleDataFromChild = () => setReloadProfile(!reloadProfile);
    const handleDataFromGroupContent = (data) => {
        setShowingGroupInfo(data)
    }

    const renderContent = () => {
        if (loading) {
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
                            {[...Array(6)].map((_, index) => (
                                <div
                                    key={index}
                                    className={`chat ${index % 2 === 0 ? "chat-start" : "chat-end"
                                        }`}
                                >
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
            group: (
                <GroupContent
                    groups={groups}
                    socket={socket}
                    onlineUsers={onlineUsers}
                    friends={friends}
                    isMobile={isMobile}
                    theme={theme}
                    userInfo={userInfo}
                    dataFromGroupContent={handleDataFromGroupContent}
                />
            ),
            "create-group": <CreateGroup
                isMobile={isMobile}
                theme={theme} />,
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
                    dataFromProfile={handleDataFromChild}
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
                    dataFromGroupContent={handleDataFromGroupContent}
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
            <NotificationBanner details={notifications} />
            <Suspense fallback={<div>Loading...</div>}>
                <div className={`${isMobile ? `${type || friend_name || group_name ? "hidden" : ""}` : "w-1/12 h-full"}`}>
                    <Navigation
                        socket={socket}
                        isMobile={isMobile}
                        theme={theme}
                        userInfo={userInfo} />
                </div>
                <div
                    className={` rounded-3xl  ${isMobile ? "w-full " : "text-black mr-4 my-2 pl-0 w-full"}`}
                >
                    {renderContent()}
                </div>
                <div
                    id="mobile"
                    className={`${isMobile ? "hidden" : `${showGroupInfo ? 'w-1/6 h-screen py-4 mr-4 rounded-3xl' : 'hidden'} `}`}
                >
                    <Details
                        onlineUsers={onlineUsers}
                        isMobile={isMobile}
                        userInfo={userInfo}
                        theme={theme}
                    />
                </div>
            </Suspense>
        </div>
    );
}
