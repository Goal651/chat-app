/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import ChatArea from "./dmscreen";
import Cookies from 'js-cookie';
import '../css/dms.css';


const Chat = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    let { params } = useParams();
    const [chat, setChat] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null); // State to track selected user
    const chatNow = (friend) => {
        setChat(params);
        navigate(`/chat/${username || friend.username}`)
    }
    console.log(useParams());
    useEffect(() => {
        const username = Cookies.get('username');
        if (!username) return navigate('/login');
    }, [navigate]);

    useEffect(() => {
        const fetchMessage = async () => {
            const response = await fetch(`http://localhost:3001/allFriends`);
            const data = await response.json();
            setFriends(data);
        };
        fetchMessage();
    }, []);

    return (
        <div className="dm-chat">
            <div className="users">
                {friends.length > 0 ? friends
                    .filter((friend) => friend.username !== Cookies.get('username'))
                    .map((friend) => {
                        return (
                            <div onClick={() => {
                                chatNow(friend || params);
                                setSelectedUser(friend.email); // Set the selected user
                            }}
                                className={`friends ${selectedUser === friend.email ? 'selected' : ''}`} // Apply 'selected' class if user is selected
                                key={friend._id}
                            >
                                <div></div>
                                <h3>{friend.username}</h3>
                            </div>
                        )
                    }) : ("No Friends")}
            </div>
            <div className='chat-screen'>
                <ChatArea chat={chat} />
            </div>
        </div>
    )
}

export default Chat;