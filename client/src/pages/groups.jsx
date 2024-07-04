/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from "socket.io-client";
import GroupArea from "./groupScreen";

const GroupChat = () => {
    const [groups, setGroups] = useState([]);
    const { name } = useParams();
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [group, setGroup] = useState({});
    const [socket, setSocket] = useState(null)
    const username = Cookies.get('username');


    useEffect(() => {
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);


    useEffect(() => {
        const fetchGroups = async () => {
            const response = await fetch('http://localhost:3001/allGroups');
            const data = await response.json();
            setGroups(data.groups);
        };
        fetchGroups();
    }, []);

    const chatNow = (group) => {
        setGroup(group);
        navigate(`/group/${group.name}`);
        socket.emit('connect-group', { room: group.name })
    };

    useEffect(() => {
        if (!username) navigate('/login');
    }, [username, navigate]);

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
                <button onClick={() => { navigate('/create-group') }}>Create new group</button>
                {groups.length > 0 ? groups.map(group => {
                    let imageBase64 = '';
                    if (group && group.imageData && group.imageData.data) {
                        imageBase64 = arrayBufferToBase64(group.imageData.data);
                    } else {
                        console.warn("No image data found for group:", group.name);
                    }
                    return (
                        <div onClick={() => {
                            chatNow(group);
                            setSelectedGroup(group.name);
                        }}
                            className={`group ${selectedGroup === group.name ? 'selected' : ''}`}
                            key={group._id}
                        >
                            <div>
                                {imageBase64 ? (
                                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Group Image" />
                                ) : (
                                    <img src="/nogro.png" alt="No Group" />
                                )}
                            </div>
                            <h3>{group.name}</h3>
                        </div>
                    );
                }) : "No Groups"}
            </div>
            <div className='overflow-hidden w-full' style={{ height: '83vh' }}>
                {selectedGroup && <GroupArea group={group} />}
            </div>
        </div>
    );
};

export default GroupChat;
