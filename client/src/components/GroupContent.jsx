/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import GroupArea from "./groupScreen";



const GroupContent = ({ groups, socket, friends, isMobile }) => {
    const navigate = useNavigate();
    const selectedGroup = localStorage.getItem('selectedGroup')
    const [group, setGroup] = useState(null);
    const [searchQuery, setSearchQuery] = useState('')
    const accessToken = Cookies.get('accessToken')
    const { type, name } = useParams()
    const currentUser = Cookies.get('user')

    useEffect(() => { if (!accessToken) navigate('/login') }, [accessToken, navigate]);
    useEffect(() => { if (selectedGroup) navigate(`/group/${selectedGroup}`) }, [navigate])

    useEffect(() => {
        if (!socket) return;
        socket.on('room_exists', () => {
            socket.emit('join_room', { room: selectedGroup })
        })
        return () => {
            socket.off('room_exists');
        };
    }, [selectedGroup, socket]);


    const chatNow = useCallback((g) => {
        setGroup(g)
        navigate(`/group/${g.name}`)
        setGroup(g.name)
        localStorage.setItem('selectedGroup', g.name)
        socket.emit('connect_group', { room: g.name });
    }, [navigate, socket]);

    const handleSearch = e => setSearchQuery(e.target.value.toLowerCase());
    const filteredGroups = groups
        .filter(group => group.name.toLowerCase().includes(searchQuery));

    const memoizedGroups = useMemo(() => {
        return filteredGroups && filteredGroups.length > 0 ? filteredGroups.map(group => {
            return (
                <div onClick={() => chatNow(group)}
                    className={`overflow-hidden flex justify-between mx-4 py-2 rounded-lg cursor-pointer ${selectedGroup === group.name ? 'bg-gray-200' : ''} hover:bg-gray-100`}
                    key={group._id} >
                    <div className="flex flex-row justify-between w-full mx-4">
                        <span className="flex items-center w-full h-fit">
                            <div className="flex h-14 w-14 bg-slate-300 rounded-lg items-center align-middle justify-center">{group.imageData ?
                                <img src={`data:image/jpeg;base64,${group.imageData}`} alt="Fetched Image" className="max-w-14 max-h-14 rounded-lg" />
                                : <img src="/nopro.png" alt="No Image" className="h-14" />
                            }
                            </div>
                            <div className="ml-4 font-semibold">
                                <div> {group.name}</div>
                                <div className="text-sm text-gray-600">
                                    {group.latestMessage ? (group.latestMessage.sender == currentUser ? `you: ${group.latestMessage.message}` : group.latestMessage.message) : 'Say hi to your new friend'}
                                </div>
                            </div>
                            {/* {unreadCount > 0 && (
                                                    <span className="badge ml-auto bg-red-500 text-white rounded-full px-2 py-1">
                                                        {unreadCount}
                                                    </span>
                                                )} */}
                        </span>
                    </div>
                </div>
            );
        }) : <span className="">No groups</span>;
    }, [chatNow, selectedGroup, filteredGroups,currentUser]);
    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend')
        navigate('/')
    }
    return (
        <div className="flex flex-row text-sm">
            <div id="mobile" style={{ height: '90vh' }} className={`flex flex-col  overflow-y-auto overflow-x-hidden ${isMobile ? `${type ? `${name ? 'hidden' : 'w-full'}` : 'hidden'}` : 'w-1/3'}`}>
                {isMobile && (<button onClick={navigateBackward}>←</button>)}                <button className="btn btn-link" onClick={() => { navigate('/create-group'); }}>Create new group</button>
                <input type="text" value={searchQuery} onChange={handleSearch} placeholder="Search friends..." className="p-2 m-2 border rounded" />
                <div> {memoizedGroups}</div>
            </div>
            <div className={`overflow-hidden  ${isMobile ? `${name ? 'w-full' : 'hidden '}` : 'pr-10  w-2/3'}`} style={{ height: '90vh' }}>
                <GroupArea group={group} socket={socket} friends={friends} isMobile={isMobile} />
            </div>
        </div>
    );
};

export default GroupContent;
