/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import GroupArea from "./groupScreen";


const GroupContent = ({ groups, socket }) => {
    const { name } = useParams();
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState('');
    const [group, setGroup] = useState({});
    const username = Cookies.get('username');
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        if (!socket) return;

        const addUser = () => {
            socket.emit('join_room', { room: groupName, user: username });
        };
        socket.on('room_exists', addUser);
        return () => {
            socket.off('room_exists', addUser);
        };
    }, [groupName, username, socket]);

    const chatNow = useCallback((g) => {
        setGroup(g);
        navigate(`/group/${g.name}`);
        setGroupName(g.name);
        socket.emit('connect_group', { room: g.name });
    }, [navigate, socket]);

    useEffect(() => {
        if (!username) navigate('/login');
    }, [username, navigate]);

    const arrayBufferToBase64 = useCallback((buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }, []);

    useEffect(() => {
        const fetchGroup = async () => {
            if (!name) return;
            const result = await fetch(`http://localhost:3001/getGroup/${name}`);
            const data = await result.json();
            setGroup(data.group);
        };
        fetchGroup();
    }, [name]);

    const memoizedGroups = useMemo(() => {
        return groups && groups.length > 0 ? groups.map(group => {
            let imageBase64 = '';
            if (group.imageData && group.imageData.data) {
                imageBase64 = arrayBufferToBase64(group.imageData.data);
            } else {
                console.warn("No image data found for group:", group.name);
            }
            return (
                <div onClick={() => {
                    chatNow(group);
                    setSelectedGroup(group.name);
                }}
                    className={`menu ${selectedGroup === group.name ? 'selected' : ''}`}
                    key={group._id} >
                    <li>
                        <div>
                            {imageBase64 ? (
                                <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Group Image" className="w-14 h-14 rounded-lg" />
                            ) : (
                                <img src="/nogro.png" alt="No Group" />
                            )}
                            {group.name}
                        </div>
                    </li>
                </div>
            );
        }) : <span className="loading loading-spinner text-neutral"></span>;
    }, [groups, chatNow, selectedGroup, arrayBufferToBase64]);

    return (
        <div className="flex flex-row">
            <div className="flex flex-col w-1/3">
                <button className="btn btn-link" onClick={() => { navigate('/create-group'); }}>Create new group</button>
                {memoizedGroups}
            </div>
            <div className='overflow-hidden w-2/3' style={{ height: '90vh' }}>
                <GroupArea group={group} socket={socket} />
            </div>
        </div>
    );
};

export default GroupContent;
