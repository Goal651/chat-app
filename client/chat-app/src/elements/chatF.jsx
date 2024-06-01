/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import ChatArea from "./dm";
import Cookies from 'js-cookie';
// import io from 'socket.io-client';
// const socket = io.connect("http://localhost:3001", { withCredentials: true });

const Chat = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [chat, setChat] = useState(null);
    const chatNow = ({ username }) => {
        setChat(username);
        navigate(`/chat/${username}`);
    }

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
        <div className="dashboard">
            <div className="users">
                {friends.length > 0 ? friends
                    .filter((friend) => friend.username !== Cookies.get('username'))
                    .map((friend) => {
                        return (
                            <div className="friends" key={friend._id}>
                                <div></div>
                                <h3>{friend.username}</h3>
                                <button onClick={() => { chatNow(friend) }}>Chat</button>
                            </div>
                        )
                    }) : ("No Friends")}
                <div className='chat-screen'>
                    <ChatArea chat={chat} />
                </div>
            </div>
        </div>
    )
}

export default Chat;
