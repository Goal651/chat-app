import { useEffect, useState, lazy } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
const Navigation = lazy(() => import("../components/navigation"))
const CreateGroup = lazy(() => import("../components/createGroup"))
const NotFound = lazy(() => import("./construction"))
const Details = lazy(() => import("../components/info"))
const Profile = lazy(() => import("./profile"))
const GroupContent = lazy(() => import( "../components/GroupContent"))
const ChatContent = lazy(() => import("../components/ChatContent"))

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(url, { withCredentials: true });
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, [url]);

    return socket;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { group, user, type } = useParams();
    const [friends, setFriends] = useState([]);
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [loading, setLoading] = useState(true);
    const username = Cookies.get('username');
    const [groups, setGroups] = useState([]);
    const socket = useSocket("http://localhost:3001");

    useEffect(() => {
        if (!username) navigate('/login');
    }, [navigate, username]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [friendsResponse, groupsResponse] = await Promise.all([
                    fetch('http://localhost:3001/allFriends'),
                    fetch('http://localhost:3001/allGroups'),
                ]);
                const friendsData = await friendsResponse.json();
                const groupsData = await groupsResponse.json();
                setFriends(friendsData.users.filter((user) => user.username !== username));
                setGroups(groupsData.groups);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
                setLoadingGroup(false);
            }
        };
        fetchData();
    }, [username]);

    const renderContent = () => {
        if (loading || loadingGroup) {
            return <span className="loading loading-spinner text-neutral"></span>;
        }

        const contentMap = {
            'group': <GroupContent groups={groups} socket={socket} />,
            'create-group': <CreateGroup />,
            'chat': <ChatContent friends={friends} socket={socket} />,
            'profile': <Profile />,
            'default': <NotFound />,
        };

        if (group) {
            return <GroupContent groups={groups} socket={socket} />;
        }

        if (user) {
            return <ChatContent friends={friends} socket={socket} />;
        }

        return contentMap[type] || <ChatContent friends={friends} socket={socket} />;
    };

    return (
        <div className="flex flex-row bg-black h-screen">
            <div className="w-48">
                <Navigation />
            </div>
            <div className="bg-white text-black mr-4 my-4 pt-6 pl-0 w-full rounded-3xl">
                {renderContent()}
            </div>
            <div className="w-96 bg-white my-4 mr-4 rounded-3xl">
                <Details />
            </div>
        </div>
    );
};

export default Dashboard;
