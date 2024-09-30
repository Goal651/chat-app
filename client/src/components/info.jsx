/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import GroupInfo from "./GroupInfo";

export default function Details({ onlineUsers, reloadProfile }) {
    const { group_name } = useParams();
    const navigate = useNavigate();
    const [groupInfo, setGroupInfo] = useState(null);
    const friend = localStorage.getItem('selectedFriend')
    const accessToken = Cookies.get('accessToken')
    const showGroupInfo = localStorage.getItem('g_i')

    useEffect(() => {
        if (!accessToken) return
        if (!group_name) return
        const fetchGroupDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getGroup/${group_name}`, { headers: { 'accessToken': `${accessToken}` } });
                if (response.status === 403) navigate('/login')
                const data = await response.json()
                setGroupInfo(data.group)
            } catch (error) { navigate('/error') }
        }
        fetchGroupDetails();
    }, [group_name, navigate]);

    return (
        <div>{group_name && groupInfo && groupInfo.details && (
            <div className=" flex flex-col  text-black justify-between  h-full px-2">
                <div className="h-1/2 shadow-md rounded-2xl mb-2 bg-gray-100 px-4">
                    <div className="font-semibold text-xl my-4"> Group Info</div>
                    <div className="font-semibold">Files</div>
                    <div className="my-4">{groupInfo.details.images} photos</div>
                    <div className="my-4">{groupInfo.details.videos} videos</div>
                    <div className="my-4">{groupInfo.details.audios} audios</div>
                </div>
                <div
                    className="h-1/2 overflow-auto shadow-lg rounded-2xl mt-2 px-4 py-2 bg-gray-100"
                >
                    <GroupInfo />
                </div>
            </div>
        )}</div>
    );
}