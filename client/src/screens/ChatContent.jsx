/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react"
import { useNavigate, useParams } from 'react-router-dom'
import ChatArea from "./Dms"
import Cookies from 'js-cookie'

export default function ChatContent({ friends, socket, isMobile, theme }) {
    const navigate = useNavigate()
    const { user, type } = useParams()
    const selectedFriend = localStorage.getItem('selectedFriend')
    const [friend, setFriend] = useState('')
    const [lastFriend, setLastFriend] = useState(null)
    const [unreadMessages, setUnreadMessages] = useState([])
    const [onlineUsers, setOnlineUsers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [typingUser, setTypingUser] = useState('')
    const accessToken = Cookies.get('accessToken')
    const currentUser = Cookies.get('user');


    useEffect(() => { if (!accessToken) navigate('/login') }, [navigate, accessToken])
    useEffect(() => {
        socket.emit('fetch_online_users')

    }, [socket])
    useEffect(() => {
        if (!lastFriend) return
        navigate(`/chat/${lastFriend.username}`)
    }, [lastFriend])


    useEffect(() => {
        if (!selectedFriend) return
        if (!friends) return
        let current = friends.filter(friend => friend.email === selectedFriend)
        if (current) setLastFriend(current[0])
    }, [navigate, selectedFriend, lastFriend])


    useEffect(() => {
        if (!socket) return;
        socket.on('connect', () => socket.emit('fetch_unread_messages'))
        socket.on('unread_messages', messages => setUnreadMessages(messages))
        socket.on('receive_message', () => socket.emit('fetch_unread_messages'));
        socket.on('marked_as_read', () => socket.emit('fetch_unread_messages'));
        socket.on('online_users', (data) => {
            setOnlineUsers(data)
            socket.emit('fetch_unread_messages');
        })
        socket.on('typing', ({ sender }) => setTypingUser(sender))
        socket.on('not_typing', () => setTypingUser(''))
        return () => {
            socket.off('connect');
            socket.off('unread_messages');
            socket.off('marked_as_read');
            socket.off('receive_message')
            socket.off('online_users');
            socket.off('typing')
            socket.off('not_typing')
        }
    }, [socket, accessToken]);

    const getUnreadCountForFriend = friend => { return unreadMessages.filter(msg => msg.sender === friend).length }

    const chatNow = useCallback((friend) => {
        setFriend(friend.username)
        navigate(`/chat/${friend.username}`)
        localStorage.setItem('selectedFriend', `${friend.email}`)
    }, [navigate, socket])

    const handleSearch = (e) => setSearchQuery(e.target.value.toLowerCase());

    const filteredFriends = friends
        .filter(friend => friend.username.toLowerCase().includes(searchQuery))
        .sort((a, b) => {
            const aTime = a.latestMessage ? new Date(a.latestMessage.timestamp).getTime() : 0;
            const bTime = b.latestMessage ? new Date(b.latestMessage.timestamp).getTime() : 0;
            return bTime - aTime;
        })

    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend')
        navigate('/')
    }
    const isTyping = (data) => {
        return typingUser == data
    }
    return (
        <div className="flex flex-row">
            <div id="mobile"
                style={{ height: '95vh' }}
                className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-800'} flex flex-col  overflow-y-auto overflow-x-hidden ${isMobile ? `${type ? `${user ? 'hidden' : 'w-full'}` : 'hidden'}` : 'w-1/3'}`} >
                {isMobile && (<button onClick={navigateBackward}>←</button>)}
                <input type="text" onChange={handleSearch} placeholder="Search friends..." className="p-2 m-2 border rounded" />
                <div>
                    {filteredFriends && filteredFriends.length > 0 ? (
                        filteredFriends
                            .filter(friend => friend.email !== Cookies.get('user'))
                            .map(friend => {
                                const unreadCount = getUnreadCountForFriend(friend.email)
                                const isOnline = onlineUsers.includes(friend.email)
                                return (
                                    <div onClick={() => chatNow(friend)}
                                        className={`overflow-hidden flex justify-between mx-4 py-2 rounded-lg cursor-pointer my-2 ${theme === 'dark' ? `${selectedFriend === friend.email ? 'bg-gray-800 hover:bg-gray-900' : ''} hover:bg-gray-700 ` : `${selectedFriend === friend.email ? 'bg-gray-300 hover:bg-gray-400' : ''}hover:bg-gray-200`}`}
                                        key={friend._id}>
                                        <div className="flex flex-row justify-between w-full mx-4">
                                            <span className="flex items-center w-full h-fit">
                                                <div className="flex h-14 w-14 ">
                                                    <div className={`avatar ${isOnline ? 'online' : 'offline'}`}>
                                                        <div className="h-12 w-12 rounded-lg bg-gray-200">{friend.imageData ?
                                                            <img src={`data:image/png;base64,${friend.imageData}`} alt="Fetched Image" className="h-full w-full object-cover" />
                                                            : <svg className="ml-4 mt-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill={`${theme === 'dark' ? 'white' : 'gray'}`} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" /></svg>
                                                        }</div>
                                                    </div>
                                                </div>
                                                <div className="ml-4 w-full">
                                                    <div className="w-1/2 text-sm font-bold"> {friend.username}</div>
                                                    {isTyping(friend.email) ? (<div className="text-green-500 text-sm ">
                                                        typing...
                                                    </div>) : (<div className="text-xs text-gray-600 break-words line-clamp-1 w-48 ">
                                                        {friend.latestMessage ? (friend.latestMessage.sender == currentUser ?
                                                            (friend.latestMessage.type.startsWith(`${'image' || 'video'}`) ?
                                                                'you: sent file' : `you: ${friend.latestMessage.message}`) : (friend.latestMessage.type.startsWith(`${'image' || 'video'}`)
                                                                    ? 'sent file' : friend.latestMessage.message)) : 'Say hi to your new friend'}
                                                    </div>)}
                                                </div>
                                                {unreadCount > 0 && (
                                                    <span className="badge h-7 w-7 ml-auto bg-orange-500 text-white text-sm font-semibold rounded-full border-0">
                                                        {unreadCount > 9 ? `9+` : unreadCount}
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
            </div >
            <div
                className={`overflow-hidden  ${isMobile ? `${user ? 'w-full' : 'hidden '}` : '  w-2/3'}`}
                style={{ height: '95vh' }}>
                <ChatArea
                    socket={socket}
                    friend={friend}
                    isMobile={isMobile}
                    theme={theme} />
            </div>
        </div >
    )
}