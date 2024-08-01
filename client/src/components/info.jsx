/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
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

const Details = ({ onlineUsers,reload }) => {
    const { user, name } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState({});
    const [groupInfo, setGroupInfo] = useState({});
    const [userInfo, setUserInfo] = useState({});
    const [usersImage, setUsersImage] = useState('');
    const [groupImage, setGroupImage] = useState('');
    const username = Cookies.get('username');
    const [userImage, setUserImage] = useState('');

    const fetchUserDetails = async (userParam, setStateCallback) => {
        try {
            const response = await fetch(`http://localhost:3001/getUser/${userParam}`);
            if (!response.ok) throw new Error('Failed to fetch user details');
            const data = await response.json();
            setStateCallback(data.user);
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUserDetails(user, setUserInfo);
        }
    }, [user]);

    useEffect(() => {

        if (name) {
            const fetchGroupDetails = async () => {
                try {
                    const response = await fetch(`http://localhost:3001/getGroup/${name}`);
                    if (!response.ok) throw new Error('Failed to fetch group details');
                    const data = await response.json();
                    console.log("Group data:", data);
                    setGroupInfo(data.group);
                } catch (error) {
                    console.error("Error fetching group details:", error);
                }
            };
            fetchGroupDetails();
        }
    }, [name]);

    useEffect(() => {
        if (username) {
            fetchUserDetails(username, setDetails);
        }
    }, [username,reload]);

    useEffect(() => {
        if (userInfo.imageData) {
            const result = arrayBufferToBase64(userInfo.imageData.data);
            setUsersImage(result);
        }
    }, [userInfo]);

    useEffect(() => {
        if (groupInfo.imageData) {
            const result = arrayBufferToBase64(groupInfo.imageData.data);
            setGroupImage(result);
        }
    }, [groupInfo]);

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
        <div className="flex flex-col p-10 text-xl text-black">
            {user || name ? (
                user ? (
                    <div className="flex flex-col p-10 text-xl text-black">
                        <div>
                            {usersImage ? (
                                <img src={`data:image/jpeg;base64,${usersImage}`} alt="Fetched Image" className="h-28 w-28 rounded-full" />
                            ) : (
                                <img src="/nopro.png" alt="No Profile" className="h-14" />
                            )}
                            {isOnline() && (<span className="text-green-500">Online</span>)}
                        </div>
                        <div>
                            <span className="text-left">{userInfo.f_name}</span>
                            <span className="text-right">{userInfo.l_name}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col p-10 text-xl text-black">
                        <div>
                            {groupImage ? (
                                <img src={`data:image/jpeg;base64,${groupImage}`} className="h-28 w-28 rounded-full" />
                            ) : (
                                <img src="/nopro.png" alt="No Profile" className="h-14" />
                            )}
                        </div>
                        <h3 className="text-center">{groupInfo.name}</h3>
                        <h5>Admin: {groupInfo.admin}</h5>
                    </div>
                )
            ) : (
                <div className="flex flex-col p-10 text-xl text-black">
                    <div>
                        {userImage ? (
                            <img src={`data:image/jpeg;base64,${userImage}`} alt="Fetched Image" className="h-28 w-28 rounded-full" />
                        ) : (
                            <img src="/nopro.png" alt="No Profile" className="h-14" />
                        )}
                    </div>
                    <h3 className="text-center">{details.username}</h3>
                </div>
            )}
        </div>
    );
};

export default Details;
