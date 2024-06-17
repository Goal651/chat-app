import Chat from "./dms";
import { useEffect } from "react";
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";
import Navigation from "../components/navigation";


function Dashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        const username = Cookies.get('username');
        if (!username) return navigate('/login');
    }, [navigate]);

    return (
        <div className="chat-app">
            <div className="navigation">
                <Navigation />
            </div>
            <div className="dashboard">
                <Chat />
            </div>
        </div>
    );
}

export default Dashboard;
