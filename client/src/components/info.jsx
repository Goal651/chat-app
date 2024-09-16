/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import GroupInfo from "./GroupInfo";

export default function Details({ onlineUsers, reloadProfile }) {
    const { user, name } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState({});
    const [groupInfo, setGroupInfo] = useState({});
    const [userInfo, setUserInfo] = useState({});
    const friend = localStorage.getItem('selectedFriend')
    const accessToken = Cookies.get('accessToken')
    const showGroupInfo = localStorage.getItem('g_i')

    const fetchUserDetails = async (userParam, setStateCallback) => {
        if (!accessToken) return
        try {
            const response = await fetch(`http://localhost:3001/getUser/${userParam}`, { headers: { 'accessToken': `${accessToken}` } });
            const data = await response.json();
            if (response.status === 403) navigate('/login')
            else if (response.status === 401) Cookies.set('accessToken', data.newToken)
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



    return (
        <div>{name && showGroupInfo && groupInfo && (
            <div className=" flex flex-col  text-black justify-between  h-full px-2">
                <div className="h-1/2 shadow-md rounded-lg mb-2 bg-gray-100 px-4">
                    <div className="font-semibold text-xl my-4"> Group Info</div>
                    <div className="font-semibold">Files</div>
                    <div className="my-4">{groupInfo.details.images} photos</div>
                    <div className="my-4">{groupInfo.details.videos} videos</div>
                    <div className="my-4">{groupInfo.details.audios} audios</div>
                </div>
                <div
                    className="h-1/2 overflow-auto shadow-lg rounded-lg mt-2 px-4 py-2 bg-gray-100"
                >
                    <GroupInfo />
                </div>
            </div>
        )}</div>
    );
}