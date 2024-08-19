/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";


const Details = ({ onlineUsers, reloadProfile }) => {
    const { user, name } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState({});
    const [groupInfo, setGroupInfo] = useState({});
    const [userInfo, setUserInfo] = useState({});
    const friend = localStorage.getItem('selectedFriend')
    const accessToken = Cookies.get('accessToken')

    const fetchUserDetails = async (userParam, setStateCallback) => {
        if (!accessToken) return
        try {
            const response = await fetch(`http://localhost:3001/getUser/${userParam}`, { headers: { 'accessToken': `${accessToken}` } });
            if (response.status === 403) navigate('/login')
            const data = await response.json();
            setStateCallback(data.user);
        } catch (error) { navigate('/error') }
    };

    useEffect(() => {
        if (!accessToken) return
        if (user) fetchUserDetails(friend, setUserInfo)
    }, [user, accessToken]);

    useEffect(() => {
        if (!accessToken) return
        if (!name) return
        const fetchGroupDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getGroup/${name}`, { headers: { 'accessToken': `${Cookies.get('accessToken')}` } });
                if (response.status === 403) navigate('/login')
                const data = await response.json()
                setGroupInfo(data.group)
            } catch (error) { navigate('/error') }
        }
        fetchGroupDetails();
    }, [name, navigate, accessToken]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!accessToken) return
            try {
                const response = await fetch(`http://localhost:3001/getUserProfile`, { headers: { 'accessToken': `${accessToken}` } })
                const data = await response.json()
                setDetails(data.user)
            } catch (error) { navigate('/error') }
        }
        fetchUserDetails()
    }, [accessToken, reloadProfile, navigate])


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
                            {userInfo.imageData ? <img src={`data:image/jpeg;base64,${userInfo.imageData}`} alt="Fetched Image" className="max-h-28 max-w-28 rounded-full" />
                                : <img src="/nopro.png" alt="No Profile" className="max-h-18 max-w-18" />}
                            {isOnline() && (<span className="text-green-500">Online</span>)}
                        </div>
                        <div>
                            <span className="text-left font-semibold">{userInfo.names}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col p-10 text-xl text-black">
                        <div>{groupInfo.imageData ?
                            <img src={`data:image/jpeg;base64,${groupInfo.imageData}`} className="max-h-28 max-w-28 rounded-full" />
                            : <img src="/nopro.png" alt="No Profile" className="h-14" />
                        }</div>
                        <h3 className="text-center font-semibold">{groupInfo.name}</h3>
                        <h5 className="">Admin: {groupInfo.admin}</h5>
                    </div>
                )
            ) : (
                <div className="flex flex-col p-10 text-xl text-black">
                    <div>{details.imageData ?
                        <img src={`data:image/jpeg;base64,${details.imageData}`} alt="Fetched Image" className="max-h-28 max-w-28 rounded-full" />
                        : <img src="/nopro.png" alt="No Profile" className="h-14" />
                    }</div>
                    <h3 className="text-center">{details.username}</h3>
                </div>
            )}
        </div>
    );
};

export default Details;
