/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import ChatArea from "./dmscreen";
import Cookies from 'js-cookie';
import '../css/dms.css';


const Chat = ({ friends }) => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [chat, setChat] = useState([]);
    const [files, setFiles] = useState([]);

    const chatNow = (friend) => {
        setChat(friend);
        navigate(`/chat/${username || friend.username}`)
    }

    useEffect(() => {
        const username = Cookies.get('username');
        if (!username) navigate('/login');
    }, [navigate]);



    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    return (
        <div className="dm-chat">
            <div className="users">
                {friends.length > 0 ? friends
                    .filter((friend) => friend.username !== Cookies.get('username'))
                    .map((friend) => {
                        let imageBase64 = '';
                        if (friend.imageData && friend.imageData.data && friend.imageData.data) imageBase64 = arrayBufferToBase64(friend.imageData.data)
                        else console.warn("No image data found for friend:", friend);

                        return (
                            <div
                                onClick={() => {
                                    chatNow(friend);
                                    setSelectedUser(friend.email); // Set the selected user
                                }}
                                className={`friends ${selectedUser === friend.email ? 'selected' : ''}`} // Apply 'selected' class if user is selected
                                key={friend._id}
                            >
                                <div>
                                    {imageBase64 ? (
                                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" />
                                    ) : (
                                        <div>No Image</div>
                                    )}
                                </div>
                                <h3>{friend.username}</h3>
                            </div>
                        );
                    }) : "No Friends"}

            </div>
            <div className='chat-screen'>
                <ChatArea chat={chat} />
            </div>
        </div>
    );
}

export default Chat;
