/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import ChatArea from "./dmscreen";
import Cookies from 'js-cookie';

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const ChatContent = ({ friends, socket }) => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
    const [friend, setFriend] = useState('');

    useEffect(() => {
        const username = Cookies.get('username');
        if (!username) navigate('/login');
    }, [navigate]);

    const chatNow = useCallback((friend) => {
        console.log(friend);
        setFriend(friend.username);
        navigate(`/chat/${friend.username}`);
        setSelectedUser(friend.username);
    }, [navigate]);

    return (
        <div className="flex flex-row">
            <div className="flex flex-col w-1/3 overflow-auto">
                {friends && friends.length > 0 ? (
                    friends
                        .filter(friend => friend.username !== Cookies.get('username'))
                        .map(friend => {
                            let imageBase64 = '';
                            if (friend.imageData && friend.imageData.data) {
                                imageBase64 = arrayBufferToBase64(friend.imageData.data);
                            }

                            return (
                                <ul
                                    onClick={() => chatNow(friend)}
                                    className={`menu flex justify-between w-full ${selectedUser === friend.username ? 'selected' : ''}`}
                                    key={friend._id}
                                >
                                    <li className="flex flex-row justify-between w-full">
                                        <span className="w-full">
                                            {imageBase64 ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${imageBase64}`}
                                                    alt="Fetched Image"
                                                    className="w-14 h-16 rounded-lg"
                                                />
                                            ) : (
                                                <img
                                                    src="/nopro.png"
                                                    alt="No Image"
                                                    className="h-14"
                                                />
                                            )}
                                            {friend.username}
                                        </span>
                                    </li>
                                </ul>
                            );
                        })
                ) : (
                    <span className="loading loading-spinner text-neutral"></span>
                )}
            </div>
            <div className="overflow-hidden w-2/3 pr-10" style={{ height: '90vh' }}>
                <ChatArea socket={socket} friend={friend} />
            </div>
        </div>
    );
};

export default ChatContent;
