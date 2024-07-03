import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/navigation";
import Chat from "./dms";
import GroupChat from "./groups";
import CreateGroup from "../components/createGroup";

const Dashboard = () => {
    const navigate = useNavigate();
    const { type, name } = useParams(); // Destructure both type and name from params
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const username = Cookies.get('username');
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

    const renderContent = () => {
        if (name) return <GroupChat groupName={name} />;

        switch (type) {
            case 'group':
                return <GroupChat />;
            case 'create-group':
                return <CreateGroup />;
            case 'chat':
                return <Chat friends={friends[0]} />;
            default:
                return loading ? <div>Loading...</div> : <Chat friends={friends} />;
        }
    };

    return (
        <div className="chat-app">
            <div className="navigation">
                <Navigation />
            </div>
            <div className="dashboard">
                {renderContent()}
            </div>
        </div>
    );
};

export default Dashboard;
