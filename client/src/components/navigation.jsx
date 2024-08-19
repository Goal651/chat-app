/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import { useNavigate, useParams } from "react-router-dom";
import Cookies from 'js-cookie';

const Navigation = ({ socket, isMobile }) => {
    const navigate = useNavigate()
    const { type } = useParams()
    const logOut = () => {
        socket.emit('disconnected')
        Cookies.remove('accessToken')
        navigate('/login')
    }

    const toChats = () => navigate('/chat')
    const toGroups = () => navigate('/group')
    const toProfile = () => navigate('/profile')
    const toSetting = () => navigate('/setting')
    return (
        <ul className={` ${isMobile ? `${type ? 'hidden' : 'block'}` : 'block'}menu menu-lg rounded-box w-full h-full navigation text-sm`}>
            <li onClick={() => toChats()}>
                <div>
                    <img src="/folder.png" alt="" />
                    <div>All chats</div>
                </div>
            </li>
            <li onClick={() => { toGroups() }}>
                <div>
                    <img src="/folder.png" alt="" />
                    <div>Groups</div>
                </div>
            </li>
            <li onClick={() => { toProfile() }}>
                <div>
                    <img src="/folder.png" alt="" />
                    <div>Profile</div>
                </div>
            </li>
            <li onClick={() => { toSetting() }}>
                <div >
                    <img src="/folder.png" alt="" />
                    <div>Setting</div>
                </div>
            </li>
            <li>
                <div className="" onClick={() => { logOut() }}>
                    <img src="/logout.png" alt="logout" className="max-w-7 h-auto rotate-180" />
                    <div>Log out</div>
                </div>
            </li>
        </ul>
    )
}
export default Navigation;