import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Navigation from "../components/navigation";
import Chat from "../components/dms";
import GroupChat from "../components/groups";
import CreateGroup from "../components/createGroup";
import NotFound from "./construction";
import Details from "../components/info";


const Dashboard = () => {
    const navigate = useNavigate()
    const { type, name, params } = useParams()
    const [friends, setFriends] = useState([])
    const [loadingGroup, setLoadingGroup] = useState(true)
    const [loading, setLoading] = useState(true)
    const username = Cookies.get('username')
    const [groups, setGroups] = useState([])
    const [socket, setSocket] = useState(null)


    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true })
        setSocket(newSocket)
        return () => {
            newSocket.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!username) {
            navigate('/login')
        }
    }, [navigate, username])


    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(`http://localhost:3001/allFriends`)
                const data = await response.json()
                const users = await data.users.filter((user) => user.username !== username)
                setFriends(users)
            } catch (error) {
                console.error("Error fetching friends:", error);
            } finally {
                setLoading(false)
            }
        };

        fetchFriends()
    }, [username])

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch('http://localhost:3001/allGroups')
                const data = await response.json()
                setGroups(data.groups)
            } catch (error) {
                console.error("Error fetching friends:", error);
            } finally {
                setLoadingGroup(false)
            }
        };
        fetchGroups()
    }, [])
    const renderContent = () => {
        if (name) return groups && groups.length > 0 ? <GroupChat groups={groups} socket={socket} /> : <span className="loading loading-spinner text-neutral"></span>
        if (params) return loading ? <span className="loading loading-spinner text-neutral"></span> : <Chat friends={friends} socket={socket} />;

        switch (type) {
            case 'group':
                return loadingGroup ? <span className="loading loading-spinner text-neutral"></span> : <GroupChat groups={groups} socket={socket} />;
            case 'create-group':
                return <CreateGroup />;
            case 'chat':
                return <Chat socket={socket} friends={friends[1]} />;
            case undefined:
                return <Chat socket={socket} friends={friends} />;
            default:
                return <NotFound />

        }
    }

    return (
        <div className="flex flex-row bg-black h-screen">
            <div className="w-36">
                <Navigation />
            </div>
            <div className="bg-white text-black mr-4 my-4 p-4 w-full rounded-3xl">
                {renderContent()}
            </div>
            <div className="w-52 bg-white my-4 rounded-3xl">
                <Details />
            </div>
        </div>
    );
};

export default Dashboard;
