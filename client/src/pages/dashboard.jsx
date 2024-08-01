/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, lazy } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Settings from "./setting";
const Navigation = lazy(() => import("../components/navigation"))
const CreateGroup = lazy(() => import("../components/createGroup"))
const NotFound = lazy(() => import("./construction"))
const Details = lazy(() => import("../components/info"))
const Profile = lazy(() => import("./profile"))
const GroupContent = lazy(() => import("../components/GroupContent"))
const ChatContent = lazy(() => import("../components/ChatContent"))

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        const newSocket = io(url, { withCredentials: true })
        setSocket(newSocket)
        return () => newSocket.disconnect();
    }, [url]);
    return socket;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { name, user, type } = useParams();
    const [friends, setFriends] = useState([]);
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [loading, setLoading] = useState(true);
    const username = Cookies.get('username');
    const [groups, setGroups] = useState([]);
    const socket = useSocket("http://localhost:3001");
    const [reload, setReload] = useState(false)
    const [onlineUsers, setOnlineUsers] = useState([])

    useEffect(() => { if (!username) navigate('/login') }, [navigate, username])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [friendsResponse, groupsResponse] = await Promise.all([
                    fetch(`http://localhost:3001/allFriends?username=${username}`),
                    fetch('http://localhost:3001/allGroups'),
                ])
                const friendsData = await friendsResponse.json();
                const groupsData = await groupsResponse.json();
                setFriends(friendsData.users.filter((user) => user.username !== username));
                setGroups(groupsData.groups);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
                setLoadingGroup(false);
                setReload(false)
            }
        }
        fetchData()
    }, [username, reload])

    useEffect(() => {
        if (!socket) return
        socket.emit('fetch_online_users', username)
    }, [])


    useEffect(() => {
        if (!socket) return
        socket.on('online_users', data => setOnlineUsers(data))
        socket.on('marked_as_read', () => setReload(true))
        socket.on('receive_message', () => setReload(true))
        socket.on('message_sent', () => { setReload(true) })
        return () => {
            socket.off('marked_as_read')
            socket.off('online_user')
            socket.off('receive_message')
            socket.off('message_sent')
        }
    }, [socket])
    const handleDataFromProfile = (data) => {
        setReload(data)
    }

    const renderContent = () => {
        if (loading || loadingGroup) {
            return (<div className="skeleton"> </div>)
        }

        const contentMap = {
            'group': <GroupContent groups={groups} socket={socket} onlineUsers={onlineUsers} />,
            'create-group': <CreateGroup />,
            'chat': <ChatContent friends={friends} socket={socket} />,
            'profile': <Profile dataFromProfile={handleDataFromProfile} />,
            'setting': <Settings />,
            'default': <NotFound />,
        }
        if (name) return <GroupContent groups={groups} socket={socket} />
        if (user) return <ChatContent friends={friends} socket={socket} />
        return contentMap[type] || <ChatContent friends={friends} socket={socket} />;
    }

    return (
        <div className="flex flex-row bg-black h-screen">
            <div className="w-48">
                <Navigation socket={socket} />
            </div>
            <div className="bg-white text-black mr-4 my-4 pt-6 pl-0 w-full rounded-3xl">
                {renderContent()}
            </div>
            <div className="w-96 bg-white my-4 mr-4 rounded-3xl">
                <Details onlineUsers={onlineUsers} reload={reload}/>
            </div>
        </div>
    );
};

export default Dashboard;
