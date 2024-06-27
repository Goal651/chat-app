import Chat from "./dms";
import { useEffect,useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/navigation";


function Dashboard() {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    
    const [selectedUser, setSelectedUser] = useState(null);


    useEffect(() => {
        const username = Cookies.get('username');
        if (!username) return navigate('/login');
    }, [navigate]);

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await fetch(`http://localhost:3001/allFriends`);
                const data = await response.json();
                setFriends(data.users); // Adjust this line according to your backend response structure
            } catch (error) {
                console.error("Error fetching friends:", error);
            }
        };
        fetchMessage();
    }, []);



    return (
        <div className="chat-app">
            <div className="navigation">
                <Navigation />
            </div>
            <div className="dashboard">
                <Chat friends={friends}/>
            </div>
        </div>
    );
}

export default Dashboard;
