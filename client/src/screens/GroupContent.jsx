/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import GroupArea from "./GroupScreen";

export default function GroupContent({ groups, socket, friends, isMobile, theme, userInfo, onlineUsers, dataFromGroupContent }) {
    const navigate = useNavigate();
    const selectedGroup = localStorage.getItem('selectedGroup');
    const [group, setGroup] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const accessToken = useMemo(() => Cookies.get('accessToken'), []);
    const { type, group_name } = useParams();
    const currentUser = useMemo(() => Cookies.get('user'), []);

    useEffect(() => {
        if (!accessToken) navigate('/login');
    }, [accessToken, navigate]);

    useEffect(() => {
        if (selectedGroup) navigate(`/group/${selectedGroup}`);
    }, [selectedGroup, navigate]);


    const chatNow = useCallback((g) => {
        setGroup(g);
        navigate(`/group/${g.name}`);
        localStorage.setItem('selectedGroup', g.name);
    }, [navigate]);

    const handleSearch = useCallback((e) => setSearchQuery(e.target.value.toLowerCase()), []);

    const filteredGroups = useMemo(() =>
        groups.filter(group => group.name.toLowerCase().includes(searchQuery))
        , [groups, searchQuery]);

    const memoizedGroups = useMemo(() => {
        if (filteredGroups.length === 0) {
            return <span>No groups</span>;
        }

        return filteredGroups.map(group => (
            <div
                key={group._id}
                onClick={() => chatNow(group)}
                className={`overflow-hidden flex justify-between mx-4 py-2 rounded-lg cursor-pointer 
                    ${theme === 'dark' ?
                        `${selectedGroup === group.name ? 'bg-gray-800 hover:bg-gray-900' : 'hover:bg-gray-700'}` :
                        `${selectedGroup === group.name ? 'bg-gray-300 hover:bg-gray-400' : 'hover:bg-gray-200'}`}`}
            >
                <div className="flex flex-row justify-between w-full mx-4">
                    <span className="flex items-center w-full h-fit">
                        <div className="avatar">
                            <div className="w-16 rounded-full">
                                {group.imageData ? (
                                    <img
                                        src={group.imageData}
                                        alt="Fetched Image"
                                        className="" />
                                ) : (
                                    <img
                                        src="/nopro.png"
                                        alt="No Image"
                                        className="h-14" />
                                )}
                            </div>
                        </div>
                        <div className="ml-4 font-semibold w-full">
                            <div className="w-1/2">{group.name}</div>
                            <div className="text-sm text-gray-600 break-words line-clamp-1 w-40">
                                {group.latestMessage ? (
                                    group.latestMessage.sender === currentUser ? (
                                        group.latestMessage.type.startsWith('image') || group.latestMessage.type.startsWith('video') ?
                                            'you: sent file' :
                                            `you: ${group.latestMessage.message}`
                                    ) : (
                                        group.latestMessage.type.startsWith('image') || group.latestMessage.type.startsWith('video') ?
                                            'sent file' :
                                            group.latestMessage.message
                                    )
                                ) : (
                                    'Say hi to your new group'
                                )}
                            </div>
                        </div>
                    </span>
                </div>
            </div>
        ));
    }, [chatNow, selectedGroup, filteredGroups, currentUser, theme]);

    const handleDataFromScreen = (data) => {
        dataFromGroupContent(data)
    }

    const navigateBackward = useCallback(() => {
        localStorage.removeItem('selectedGroup');
        navigate('/');
    }, [navigate]);

    return (
        <div className="flex flex-row text-sm bg-white rounded-xl">
            <div
                id="mobile"
                style={{ height: '98vh' }}
                className={` text-gray-800  flex flex-col overflow-y-auto overflow-x-hidden 
                    ${isMobile ?
                        `${type ? `${group_name ? 'hidden' : 'w-full'}` : 'hidden'}` :
                        'w-1/3'}`}
            >
                {isMobile && <button onClick={navigateBackward}>←</button>}
                <button className="btn btn-link" onClick={() => navigate('/create-group')}>Create new group</button>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Search groups..."
                    className="p-2 m-2 border rounded"
                />
                <div>{memoizedGroups}</div>
            </div>
            <div
                className={`overflow-hidden ${isMobile ? `${group_name ? 'w-full' : 'hidden '}` : 'w-2/3'}`}
                style={{ height: '98vh' }}
            >
                <GroupArea
                    group={group}
                    socket={socket}
                    friends={friends}
                    isMobile={isMobile}
                    theme={theme}
                    userInfo={userInfo}
                    onlineUsers={onlineUsers}
                    dataFromScreen={handleDataFromScreen}
                />
            </div>
        </div>
    );
}