/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react"
import { useNavigate, useParams } from 'react-router-dom'
import ChatArea from "./dmscreen"
import Cookies from 'js-cookie'

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]) }
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
    const accessToken = Cookies.get('accessToken')

    useEffect(() => { if (!accessToken) navigate('/login') }, [navigate, accessToken])
    useEffect(() => { socket.emit('fetch_online_users') }, [socket])
    useEffect(() => {
        if (!socket) return;
        socket.on('connect', () => socket.emit('fetch_unread_messages'))
        socket.on('unread_messages', messages => setUnreadMessages(messages))
        socket.on('receive_message', () => socket.emit('fetch_unread_messages'));
        socket.on('online_users', (data) => {
            setOnlineUsers(data)
            socket.emit('fetch_unread_messages');
        })

        return () => {
            socket.off('connect');
            socket.off('unread_messages');
            socket.off('marked_as_read');
            socket.off('online_users');
        }
    }, [socket, accessToken]);

    const getUnreadCountForFriend = friend => { return unreadMessages.filter(msg => msg.sender === friend).length }

    const chatNow = useCallback((friend) => {
        setFriend(friend.username)
        navigate(`/chat/${friend.username}`)
        setSelectedUser(friend.email)
        socket.emit('mark_messages_as_read', { receiver: friend.email });
        localStorage.setItem('selectedFriend',`${friend.email}`)
    }, [navigate, socket])

    const handleSearch = (e) => setSearchQuery(e.target.value.toLowerCase());

    const filteredFriends = friends
        .filter(friend => friend.username.toLowerCase().includes(searchQuery))
        .sort((a, b) => {
            const aTime = a.latestMessage ? new Date(a.latestMessage.timestamp).getTime() : 0;
            const bTime = b.latestMessage ? new Date(b.latestMessage.timestamp).getTime() : 0;
            return bTime - aTime;
        });

    return (
        <div className="flex flex-row" >
            <div id="mobile" style={{ height: '90vh' }} className="flex flex-col w-1/3 overflow-y-auto overflow-x-hidden" >
                <input type="text" onChange={handleSearch} placeholder="Search friends..." className="p-2 m-2 border rounded" />
                <div>
                    {filteredFriends && filteredFriends.length > 0 ? (
                        filteredFriends
                            .filter(friend => friend.accessToken !== Cookies.get('accessToken'))
                            .map(friend => {
                                let imageBase64 = '';
                                if (friend.imageData && friend.imageData.data) imageBase64 = arrayBufferToBase64(friend.imageData.data);
                                const unreadCount = getUnreadCountForFriend(friend.email)
                                const isOnline = onlineUsers.includes(friend.accessToken)
                                return (
                                    <div onClick={() => chatNow(friend)}
                                        className={`overflow-hidden flex justify-between mx-4 py-2 rounded-lg cursor-pointer ${selectedUser === friend.email ? 'bg-gray-200' : ''} hover:bg-gray-100`}
                                        key={friend._id}>
                                        <div className="flex flex-row justify-between w-full mx-4">
                                            <span className="flex items-center w-full h-fit">
                                                <div className="flex h-14 w-14 bg-slate-300 rounded-lg items-center align-middle justify-center">{imageBase64 ?
                                                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="max-w-14 max-h-14 rounded-lg" />
                                                    : <img src="/nopro.png" alt="No Image" className="h-14" />
                                                }
                                                    {isOnline && (<span className="badge badge-sm border-green-500  bg-green-500  w-3 h-4 ml-12 -mt-3  "></span>)}
                                                </div>
                                                <div className="ml-4 font-semibold">
                                                    <div> {friend.accessToken}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {friend.latestMessage ? friend.latestMessage.message : ''}
                                                    </div>
                                                </div>
                                                {unreadCount > 0 && (
                                                    <span className="badge ml-auto bg-red-500 text-white rounded-full px-2 py-1">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                    ) : (
                        <div className="flex w-52 flex-col gap-4">
                            <p className="text-center">No results found</p>
                        </div>
                    )}</div>
            </div>
            <div className="overflow-hidden w-2/3 pr-10" style={{ height: '90vh' }}>
                <ChatArea socket={socket} friend={friend} />
            </div>
        </div>
    )
}

export default ChatContent;
