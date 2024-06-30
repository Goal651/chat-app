/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../css/groups.css';
import GroupArea from "./groupScreen";

const GroupChat = () => {
    const [groups, setGroups] = useState([]);
    const { name } = useParams();
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [group, setGroup] = useState('');
    const [user, setUser] = useState('');

    useEffect(() => {
        const fetchGroups = async () => {
            const response = await fetch('http://localhost:3001/allGroups');
            const data = await response.json();
            setGroups(data.groups);
        };
        fetchGroups();
    }, []);

    const chatNow = (group) => {
        setGroup(group.name);
        navigate(`/group/${group.name}`);
    };

    useEffect(() => {
        const username = Cookies.get('username');
        setUser(username);
        if (!username) navigate('/login');
    }, [navigate]);

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
        <div className="group-chat">
            <div className="groups">
                <button onClick={() => { navigate('/create-group') }}>Create new group</button>
                {groups ? groups.map(group => {
                    let imageBase64 = '';
                    if (group.imageData && group.imageData.data) {
                        imageBase64 = arrayBufferToBase64(group.imageData.data);
                    } else {
                        console.warn("No image data found for group:", group.name);
                    }
                    return (
                        <div
                            onClick={() => {
                                chatNow(group);
                                setSelectedGroup(group.name);
                            }}
                            className={`groups ${selectedGroup === group.name ? 'selected' : ''}`}
                            key={group._id}
                        >
                            <div>
                                {imageBase64 ? (
                                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Group Image" />
                                ) : (
                                    <div>No Image</div>
                                )}
                            </div>
                            <h3>{group.name}</h3>
                        </div>
                    );
                }) : "No Groups"}
            </div>
            <div className='group-screen'>
                <GroupArea group={group} />
            </div>
        </div>
    );
};

export default GroupChat;
