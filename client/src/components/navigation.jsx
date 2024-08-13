/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';

const Navigation = ({ socket }) => {
    const navigate = useNavigate()
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
        <ul className="menu menu-lg rounded-box w-full h-full navigation ">
            <li onClick={() => toChats()}>
                <div>
                    <img src="/folder.png" alt="" />
                    <h3>All chats</h3>
                </div>
            </li>
            <li onClick={() => { toGroups() }}>
                <div>
                    <img src="/folder.png" alt="" />
                    <h3>Groups</h3>
                </div>
            </li>
            <li onClick={() => { toProfile() }}>
                <div>
                    <img src="/folder.png" alt="" />
                    <h3>Profile</h3>
                </div>
            </li>
            <li onClick={() => { toSetting() }}>
                <div >
                    <img src="/folder.png" alt="" />
                    <h3>Setting</h3>
                </div>
            </li>
            <li>
                <div className="" onClick={() => { logOut() }}>
                    <img src="/logout.png" alt="logout" className="w-2 rotate-180" style={{ width: '30px' }} />
                    <h4>Log out</h4>
                </div>
            </li>
        </ul>
    )
}
export default Navigation;