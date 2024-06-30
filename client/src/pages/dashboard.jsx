import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/navigation";
import Chat from "./dms";
import GroupChat from "./groups";

const Dashboard = () => {
    const navigate = useNavigate();
    const { type } = useParams()
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const username = Cookies.get('username');
        if (!username) {
            navigate('/login');
        }
    }, [navigate])
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(`http://localhost:3001/allFriends`);
                const data = await response.json();
                setFriends(data.users);
            } catch (error) {
                console.error("Error fetching friends:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, []);

    return (
        <div className="chat-app">
            <div className="navigation">
                <Navigation />
            </div>
            {type === 'groups' ? (
                <div className="groupArea">
                    <GroupChat />
                </div>
            ) : (
                <div className="dashboard">
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <Chat friends={friends} />
                    )}
                </div>)}
        </div>
    );
};

export default Dashboard;
