/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import ChatArea from "./dmscreen";
import Cookies from 'js-cookie';
import '../css/dms.css';

const Chat = ({ friends }) => {

    const { username } = useParams();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
    const [friend, setFriend] = useState('')
    const [user, setUser] = useState('');

    const chatNow = (friend) => {
        setFriend(friend.username)
        navigate(`/chat/${username || friend.username}`);
    }


    useEffect(() => {
        const username = Cookies.get('username');
        setUser(username)
        if (!username) navigate('/login');
    }, []);

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
                {friends ? friends
                    .filter(friend => friend.username !== Cookies.get('username'))
                    .map(friend => {
                        let imageBase64 = '';
                        if (friend.imageData && friend.imageData.data) {
                            imageBase64 = arrayBufferToBase64(friend.imageData.data);
                        } else {
                            console.warn("No image data found for friend:", friend.username);
                        }
                        return (
                            <div
                                onClick={() => {
                                    chatNow(friend);
                                    setSelectedUser(friend.email);
                                }}
                                className={`friends ${selectedUser === friend.email ? 'selected' : ''}`}
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
                <ChatArea friend={friend} />
            </div>
        </div>
    );
}

export default Chat;
