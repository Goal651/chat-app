/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const Details = ({ onlineUsers, reload }) => {
    const { user, name } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState({});
    const [groupInfo, setGroupInfo] = useState({});
    const [userInfo, setUserInfo] = useState({});
    const [usersImage, setUsersImage] = useState('');
    const [groupImage, setGroupImage] = useState('');
    const friend = localStorage.getItem('selectedFriend')
    const [userImage, setUserImage] = useState('');
    const accessToken=Cookies.get('accessToken')

    const fetchUserDetails = async (userParam, setStateCallback) => {
        try {
            const response = await fetch(`http://localhost:3001/getUser/${userParam}`, { headers: { 'accessToken': `${Cookies.get('accessToken')}` } });
            if (response.status === 403) navigate('/login')
            const data = await response.json();
            setStateCallback(data.user);
        } catch (error) { navigate('/error') }
    };

    useEffect(() => { if (user) fetchUserDetails(friend, setUserInfo) }, [user]);

    useEffect(() => {
        if (name) {
            const fetchGroupDetails = async () => {
                try {
                    const response = await fetch(`http://localhost:3001/getGroup/${name}`, { headers: { 'accessToken': `${Cookies.get('accessToken')}` } });
                    if (response.status === 403) navigate('/login')
                    const data = await response.json()
                    setGroupInfo(data.group)
                } catch (error) { navigate('/error') }
            }
            fetchGroupDetails();
        }
    }, [name, navigate]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUserProfile`, { headers: { 'accessToken': `${accessToken}` } })
                const data = await response.json()
                setDetails(data.user)
            } catch (error) { navigate('/error') }
        }
        fetchUserDetails()
    }, [accessToken, reload, navigate])

    useEffect(() => {
        if (userInfo.imageData) {
            const result = arrayBufferToBase64(userInfo.imageData.data);
            setUsersImage(result);
        }
    }, [userInfo])

    useEffect(() => {
        if (groupInfo.imageData) {
            const result = arrayBufferToBase64(groupInfo.imageData.data);
            setGroupImage(result);
        }
    }, [groupInfo])

    useEffect(() => {
        if (details.imageData) {
            const result = arrayBufferToBase64(details.imageData.data);
            setUserImage(result);
        }
    }, [details]);

    const isOnline = () => {
        if (!onlineUsers) return false;
        return onlineUsers.includes(user);
    }

    return (
        <div className="info flex flex-col p-10 text-xl text-black">
            {user || name ? (
                user ? (
                    <div className="flex flex-col p-10 text-xl text-black">
                        <div className="h-28 w-28 rounded-full bg-black flex justify-center">
                            {usersImage ? <img src={`data:image/jpeg;base64,${usersImage}`} alt="Fetched Image" className="max-h-28 max-w-28 rounded-full" />
                                : <img src="/nopro.png" alt="No Profile" className="max-h-18 max-w-18" />}
                            {isOnline() && (<span className="text-green-500">Online</span>)}
                        </div>
                        <div>
                            <span className="text-left font-semibold">{userInfo.names}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col p-10 text-xl text-black">
                        <div>{groupImage ?
                            <img src={`data:image/jpeg;base64,${groupImage}`} className="max-h-28 max-w-28 rounded-full" />
                            : <img src="/nopro.png" alt="No Profile" className="h-14" />
                        }</div>
                        <h3 className="text-center font-semibold">{groupInfo.name}</h3>
                        <h5 className="">Admin: {groupInfo.admin}</h5>
                    </div>
                )
            ) : (
                <div className="flex flex-col p-10 text-xl text-black">
                    <div>{userImage ?
                        <img src={`data:image/jpeg;base64,${userImage}`} alt="Fetched Image" className="max-h-28 max-w-28 rounded-full" />
                        : <img src="/nopro.png" alt="No Profile" className="h-14" />
                    }</div>
                    <h3 className="text-center">{details.username}</h3>
                </div>
            )}
        </div>
    );
};

export default Details;
