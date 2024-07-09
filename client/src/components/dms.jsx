/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import ChatArea from "./dmscreen";
import Cookies from 'js-cookie';

const Chat = ({ friends, socket }) => {
    const { username } = useParams()
    const navigate = useNavigate()
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
        <div className="flex flex-row p-4">
            <div className="flex flex-col w-52">
                {friends && friends.length > 0 ? friends
                    .filter(friend => friend.username !== Cookies.get('username'))
                    .map(friend => {
                        let imageBase64 = '';
                        if (friend.imageData && friend.imageData.data) {
                            imageBase64 = arrayBufferToBase64(friend.imageData.data);
                        } else {
                            console.warn("No image data found for friend:", friend.username);
                        }
                        return (
                            <ul onClick={() => { chatNow(friend) }}
                                className={`menu flex justify-between ${selectedUser === friend.email ? 'selected' : ''}`}
                                key={friend._id}
                            >
                                <li className="flex flex-row justify-between">
                                    <span>{imageBase64 ? (<img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className=" w-14 h-14 rounded-lg" />)
                                        : (<img src="/nopro.png" alt="" className=" h-14 " />)}
                                        {friend.username}</span>
                                </li>

                            </ul>
                        );
                    }) : <span className="loading loading-spinner text-neutral"></span>}
            </div>
            <div className='overflow-hidden w-full ' style={{ height: '83vh' }}>
                <ChatArea socket={socket} friend={friend} />
            </div>
        </div >
    );
}

export default Chat;
