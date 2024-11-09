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
    const [userInfo, setUserInfo] = useState({})
    const [loading, setLoading] = useState(true);
    const accessToken = Cookies.get("accessToken");
    const socket = useSocket("https://chat-app-production-2663.up.railway.app/");
    const theme = localStorage.getItem("theme");
    const [showGroupInfo, setShowingGroupInfo] = useState(false)
    const selectedFriend = localStorage.getItem('selectedFriend')
    const friend = localStorage.getItem('selectedFriend')

    useEffect(() => {
        if (!accessToken) {
            Cookies.remove("accessToken");
            Cookies.remove("user");
            localStorage.removeItem('selectedFriend')
            localStorage.removeItem('selectedGroup')
            navigate("/login");
        }
    }, [navigate, accessToken]);

    useEffect(() => {
        if (!accessToken) return
        const fetchUserDetails = async () => {

            try {
                const response = await fetch(`https://chat-app-production-2663.up.railway.app/getUserProfile`, {
                    headers: { accessToken: `${accessToken}` },
                });
                const data = await response.json();
                if (response.status === 401) {
                    Cookies.set("accessToken", data);
                    window.location.reload();
                } else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                } else if (response.status === 404) navigate("/login")
                else if (response.ok) {
                    setUserInfo(data.user)
                    sessionStorage.setItem('chatUser', JSON.stringify(data.user))
                }
            } catch (error) { navigate("/error"); }
        }
        fetchUserDetails()
    }, [accessToken, navigate]);


    useEffect(() => {
        if (!accessToken) return;

        const fetchInitialData = async () => {
            try {
                const [friendsResponse, groupsResponse] = await Promise.all([
                    fetch("https://chat-app-production-2663.up.railway.app/allFriends", {
                        headers: { accessToken },
                    }),
                    fetch("https://chat-app-production-2663.up.railway.app/allGroups", {
                        headers: { accessToken },
                    }),
                ]);

                if (friendsResponse.status === 401 || groupsResponse.status === 401) {
                    const newToken = await friendsResponse.json();
                    Cookies.set("accessToken", newToken.newToken);
                } else if (friendsResponse.status === 403 || groupsResponse.status === 403) {
                    Cookies.remove('accessToken');
                    navigate("/login");
                } else {
                    const friendsData = await friendsResponse.json();
                    const groupsData = await groupsResponse.json();

                    const sortedFriends = sortByLatestMessage(friendsData.users);
                    const sortedGroups = sortByLatestMessage(groupsData.groups);

                    setFriends(sortedFriends);
                    setGroups(sortedGroups);

                    const cleanFriends = friendsData.users.map(user => ({ ...user, imageData: null }));
                    const cleanGroups = groupsData.groups.map(group => ({ ...group, imageData: null }));

                    const friendSession = sortByLatestMessage(cleanFriends)
                    const groupSession = sortByLatestMessage(cleanGroups)

                    sessionStorage.setItem('friends', JSON.stringify(friendSession));
                    sessionStorage.setItem('groups', JSON.stringify(groupSession));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
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
        if (!friend) return;
        if (!accessToken) return
        const fetchUserDetails = async () => {
            try {
                const response = await fetch(`https://chat-app-production-2663.up.railway.app/getUser/${friend}`, {
                    headers: { 'accessToken': `${accessToken}` },
                });
                const data = await response.json();
                if (response.ok) {
                    const cleanUser = { ...data.user, imageData: null }
                    sessionStorage.setItem(`friend-${data.user.email}`, JSON.stringify(cleanUser))
                }
                else if (response.status === 401) Cookies.set("accessToken", data.newToken);
                else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                } else if (response.status === 404) localStorage.removeItem('selectedFriend')
                else navigate('/error')
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };
        fetchUserDetails();
    }, []);


    useEffect(() => {
        if (!localStorage.getItem('selectedGroup')) return;
        if (!accessToken) return
        const fetchGroup = async () => {
            try {
                const result = await fetch(`https://chat-app-production-2663.up.railway.app/getGroup/${localStorage.getItem('selectedGroup')}`, {
                    headers: { 'accessToken': `${accessToken}` }
                });
                const data = await result.json();
                if (result.ok) {
                    if (data.group == null) {
                        localStorage.removeItem('selectedGroup')
                        navigate('/group')
                    }
                    else {
                        const cleanGroup = { ...data.group, imageData: null }
                        sessionStorage.setItem(`group-${data.group.name}`, JSON.stringify(cleanGroup))
                    }
                } else if (result.status == 401) Cookies.set("accessToken", data.newToken);
                else if (result.status == 403) {
                    Cookies.remove('accessToken')
                    navigate("/login")
                } else navigate('/error');
            } catch (err) {
                navigate('/error')
            }
        };
        fetchGroup();
    }, []);


    useEffect(() => {
        if (!friend) return;
        if (!accessToken) return
        const fetchMessages = async () => {
            try {
                const response = await fetch(`https://chat-app-production-2663.up.railway.app/message?receiver=${friend}`, { headers: { 'accessToken': `${accessToken}` }, });
                const data = await response.json();
                if (response.status === 401) Cookies.set("accessToken", data.newToken)
                else if (response.status === 403) {
                    Cookies.remove('accessToken')
                    navigate('/login')
                } else if (response.ok) {
                    const cleanMessages = data.messages.map((message) => {
                        return { ...message, file: null }
                    })
                    sessionStorage.setItem(`${friend}Messages`, JSON.stringify(cleanMessages))
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();
    }, []);





    const updateAllData = async () => {
        if (!accessToken) return
        await updateFriends();
        await updateGroups();
    };

    const updateFriends = async () => {
        try {
            const response = await fetch("https://chat-app-production-2663.up.railway.app/allFriends", {
                headers: { accessToken: Cookies.get("accessToken") },
            });
            const data = await response.json();
            if (response.ok) {
                setFriends(sortByLatestMessage(data.users))
                sessionStorage.setItem('friends', JSON.stringify(sortByLatestMessage(data.users)))
            } else if (response.status === 401) Cookies.set("accessToken", data.newToken);
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
            const response = await fetch("https://chat-app-production-2663.up.railway.app/allGroups", {
                headers: { accessToken: Cookies.get("accessToken") },
            });
            const data = await response.json();
            if (response.ok) {
                setGroups(sortByLatestMessage(data.groups));
                sessionStorage.setItem('groups', JSON.stringify(sortByLatestMessage(data.groups)))
            }
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

    const handleDataFromChild = (image) => {
        setUserInfo(prev => ({ ...prev, imageData: image }))
        console.log(userInfo)
    }
    const handleDataFromGroupContent = data => setShowingGroupInfo(data)


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
                    dataFromGroupContent={handleDataFromGroupContent}
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
