/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import { useNavigate, useParams } from "react-router-dom";
import Cookies from 'js-cookie';

export default function Navigation({ socket, isMobile, theme, userInfo }) {
    const navigate = useNavigate();
    const { type } = useParams();
    const logOut = () => {
        socket.emit('disconnected');
        Cookies.remove('accessToken');
        Cookies.remove('user')
        navigate('/login');
    }

    const toChats = () => navigate('/chat');
    const toGroups = () => navigate('/group');
    const toProfile = () => navigate('/profile');
    const toSetting = () => navigate('/setting');

    return (
        <ul className={` ${isMobile && `${type ? 'hidden' : 'block'}`} menu menu-lg rounded-box w-full h-full navigation text-sm  justify-evenly bg-transparent`}>
            <li onClick={toChats}>
                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24">
                        <path
                            fill={`gray`}
                            d="M20 2H4c-1.1 0-2 .9-2 2v16l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6V8h12v4zm0-6H6V4h12v2z" />
                    </svg>
                    <div>All chats</div>
                </div>
            </li>
            <li onClick={toGroups}>
                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24">
                        <path
                            fill="gray"
                            d="M16 10c1.66 0 2.99 1.34 2.99 3H21v2h-2.01c-.04.58-.18 1.13-.43 1.64.58.45.98 1.14.98 1.86v1H4v-1c0-.72.4-1.41.98-1.86-.25-.51-.39-1.06-.43-1.64H3v-2h2.01C5.04 11.34 6.37 10 8 10h8zm-4-2c-1.66 0-2.99-1.34-2.99-3S10.34 2 12 2s2.99 1.34 2.99 3-1.34 3-2.99 3zM8 12H6v-2h2v2zm10-2h-2v2h2v-2z" />
                    </svg>
                    <div>Groups</div>
                </div>
            </li>
            <li onClick={toProfile}>
                <div className="avatar">
                    <div className="h-16 w-16 rounded-full bg-gray-400 ">
                        {userInfo.imageData ? <img
                            src={userInfo.imageData}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                            : <svg
                                className="justify-self-center object-cover"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24">
                                <path
                                    fill={`gray`}
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" />
                            </svg>
                        }
                    </div>
                </div>
            </li>
            <li onClick={toSetting}>
                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                    >
                        <path
                            fill="gray"
                            d="M19.14 12.936a6.995 6.995 0 0 0 .06-.936 6.995 6.995 0 0 0-.06-.936l2.05-1.593a.5.5 0 0 0 .12-.646l-1.94-3.362a.5.5 0 0 0-.617-.226l-2.42.97a7.03 7.03 0 0 0-1.614-.936l-.36-2.556a.5.5 0 0 0-.498-.424h-3.88a.5.5 0 0 0-.498.424l-.36 2.556a7.03 7.03 0 0 0-1.614.936l-2.42-.97a.5.5 0 0 0-.617.226L2.66 9.825a.5.5 0 0 0 .12.646l2.05 1.593a6.995 6.995 0 0 0 0 1.872l-2.05 1.593a.5.5 0 0 0-.12.646l1.94 3.362a.5.5 0 0 0 .617.226l2.42-.97a7.03 7.03 0 0 0 1.614.936l.36 2.556a.5.5 0 0 0 .498.424h3.88a.5.5 0 0 0 .498-.424l.36-2.556a7.03 7.03 0 0 0 1.614-.936l2.42.97a.5.5 0 0 0 .617-.226l1.94-3.362a.5.5 0 0 0-.12-.646l-2.05-1.593zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                    </svg>
                    <div>Setting</div>
                </div>
            </li>
            <li onClick={() => logOut()}>
                <div className="">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className="rotate-180">
                        <path
                            fill={`gray`}
                            d="M10 16.5l4-4-4-4V9l5 5-5 5v-2.5zM19 3H5v2h14V3zm0 14v2H5v-2h14z" />
                    </svg>
                    <div>Log out</div>
                </div>
            </li>
        </ul>
    );
}

