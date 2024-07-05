import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/navigation";
import Chat from "../components/dms";
import GroupChat from "../components/groups";
import CreateGroup from "../components/createGroup";

const Dashboard = () => {
    const navigate = useNavigate();
    const { type, name } = useParams(); // Destructure both type and name from params
    const [friends, setFriends] = useState([]);
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [loading, setLoading] = useState(true);
    const username = Cookies.get('username');
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (!username) {
            navigate('/login');
        }
    }, [navigate, username]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(`http://localhost:3001/allFriends`);
                const data = await response.json();
                const users = data.users.filter((user) => user.username !== username);
                setFriends(users);
            } catch (error) {
                console.error("Error fetching friends:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [username]);

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
        fetchGroups();
    }, []);

    const renderContent = () => {
        if (name) return <GroupChat groupName={name} />;

        switch (type) {
            case 'group':
                return loadingGroup ? <span className="loading loading-spinner text-neutral"></span> : <GroupChat groups={groups} />;
            case 'create-group':
                return <CreateGroup />;
            case 'chat':
                return <Chat friends={friends[0]} />;
            default:
                return loading ? <span className="loading loading-spinner text-neutral"></span> : <Chat friends={friends} />;
        }
    };
    console.log(groups)

    return (
        <div className="flex flex-row bg-black h-screen">
            <div className="w-36">
                <Navigation />
            </div>
            <div className="bg-white text-black mr-4 my-4 p-4 w-full rounded-3xl">
                {renderContent()}
            </div>
            <div>

            </div>
        </div>
    );
};

export default Dashboard;
