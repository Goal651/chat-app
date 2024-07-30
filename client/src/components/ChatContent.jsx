/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react"
import { useNavigate, useParams } from 'react-router-dom'
import ChatArea from "./dmscreen"
import Cookies from 'js-cookie'

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const ChatContent = ({ friends, socket }) => {
    const navigate = useNavigate()
    const { user } = useParams()
    const [selectedUser, setSelectedUser] = useState(user)
    const [friend, setFriend] = useState('')
    const [unreadMessages, setUnreadMessages] = useState([])
    const [onlineUsers, setOnlineUsers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const username = Cookies.get('username')

    useEffect(() => {
        if (!username) navigate('/login')
    }, [navigate, username])

    useEffect(() => {
        socket.emit('fetch_online_users', username)
    }, [])

    useEffect(() => {
        if (!socket) return;
        socket.on('connect', () => socket.emit('fetch_unread_messages', username))
        socket.on('unread_messages', messages => setUnreadMessages(messages))
        socket.on('receive_message', () => socket.emit('fetch_unread_messages'));
        socket.on('online_users', (data) => {
            setOnlineUsers(data)
            socket.emit('fetch_unread_messages', username);
        })

        return () => {
            socket.off('connect');
            socket.off('unread_messages');
            socket.off('marked_as_read');
            socket.off('online_users');
        }
    }, [socket, username]);

    const getUnreadCountForFriend = friendUsername => { return unreadMessages.filter(msg => msg.sender === friendUsername).length }

    const chatNow = useCallback((friend) => {
        setFriend(friend.username)
        navigate(`/chat/${friend.username}`)
        setSelectedUser(friend.username)
        socket.emit('mark_messages_as_read', { sender: username, receiver: friend.username });
    }, [navigate, socket, username])

    const handleSearch = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
    }

    const filteredFriends = friends.filter(friend => friend.username.toLowerCase().includes(searchQuery));

    return (
        <div className="flex flex-row">
            <div className="flex flex-col w-1/3 overflow-y-auto overflow-x-hidden">
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={handleSearch} 
                    placeholder="Search friends..." 
                    className="p-2 m-2 border rounded"
                />
                {filteredFriends && filteredFriends.length > 0 ? (
                    filteredFriends
                        .filter(friend => friend.username !== Cookies.get('username'))
                        .map(friend => {
                            let imageBase64 = '';
                            if (friend.imageData && friend.imageData.data) imageBase64 = arrayBufferToBase64(friend.imageData.data);
                            const unreadCount = getUnreadCountForFriend(friend.username)
                            const isOnline = onlineUsers.includes(friend.username)
                            return (
                                <ul onClick={() => chatNow(friend)}
                                    className={`overflow-hidden flex justify-between mx-4 py-2 rounded-lg w-2/3 ${selectedUser === friend.username ? 'bg-gray-300' : ''} hover:bg-gray-400`}
                                    key={friend._id}
                                >
                                    <li className="flex flex-row justify-between w-full mx-4">
                                        <span className="flex items-center w-full h-fit">
                                            <div className="h-fit">{imageBase64 ?
                                                <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="w-14 h-16 rounded-lg" />
                                                : <img src="/nopro.png" alt="No Image" className="h-14" />
                                            }
                                                {isOnline && (<span className="badge badge-sm border-green-500  bg-green-500  w-3 h-4 absolute ml-12 -mt-3  "></span>)}

                                            </div>
                                            <span className="ml-4 font-semibold">
                                                <div> {friend.username}</div>
                                                <div className="text-sm text-gray-600">
                                                    {friend.latestMessage ? friend.latestMessage : 'No messages yet'}
                                                </div>
                                            </span>

                                            {unreadCount > 0 && (
                                                <span className="badge ml-auto bg-red-500 text-white rounded-full px-2 py-1">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                </ul>
                            )
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
