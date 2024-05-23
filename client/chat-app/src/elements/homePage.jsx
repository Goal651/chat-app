/* eslint-disable no-unused-vars */
import io from 'socket.io-client';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import ChatArea from "./dm";
import Cookies from 'js-cookie';

const Dashboard = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [chat,setChat]=useState([]);
    const user = Cookies.get('username');
    useEffect(() => {
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/allFriends`);
            const data = await response.json();
            setFriends(data);
        }
        fetchMessage();
    }, []);
    return (
        <div className="dashboard">
            <div className="users">
                {friends.map((friend) => {
                    return (
                        <div className="friends" key={friend._id}>
                            <div></div>
                            <h3>{friend.username}</h3>
                            <button onClick={() => { setChat(friend)}}>Chat</button>
                        </div>
                    )
                })}
                <div className='chat-screen'>
                    <ChatArea chat={chat.username}/>
                </div>


            </div>
        </div>
    )
}
export default Dashboard