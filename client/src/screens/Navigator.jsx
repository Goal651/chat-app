/* eslint-disable react/prop-types */
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";

export default function Navigation({ socket, isMobile, userInfo, unreadMessages }) {
    const navigate = useNavigate();
    const { type } = useParams();

    const logOut = () => {
        socket.emit("disconnected");
        Cookies.remove("accessToken");
        Cookies.remove("user");
        navigate("/login");
    };

    const toChats = () => navigate("/chat");
    const toGroups = () => navigate("/group");
    const toProfile = () => navigate("/profile");
    const toSetting = () => navigate("/setting");

    return (
        <ul
            className={` w-full h-full navigation text-sm  bg-transparent 
            ${isMobile ? (type ? "hidden" : " flex justify-between items-center px-4 space-x-4") : "menu flex justify-between menu-lg rounded-box py-10"} `}
        >
            <li
                onClick={toChats}
                className="min-w-24 max-w-[100%] flex items-center"
            >
                <div className="relative">

                    <img
                        src="/chat.png"
                        alt="no profile pic"
                        className="w-16 h-16 object-cover rounded-full"
                    />


                    {unreadMessages && unreadMessages.length > 0 && (
                        <span className="absolute top-0 right-0 h-7 w-7 bg-orange-400 text-white text-sm font-semibold flex items-center justify-center rounded-full border-0">
                            {unreadMessages.length > 9 ? `9+` : unreadMessages.length}
                        </span>
                    )}
                </div>
            </li>


            <li
                onClick={toGroups}
                className="min-w-24 max-w-[100%]"
            >
                <div className="w-auto h-auto">
                    <img src="/nogro.png" alt="" />
                </div>
            </li>
            <li
                onClick={toSetting}
                className="min-w-24 max-w-[100%]"
            >
                <div className="w-auto h-auto">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="50"
                        height="50"
                    >
                        <path
                            fill="blue"
                            d="M19.14 12.936a6.995 6.995 0 0 0 .06-.936 6.995 6.995 0 0 0-.06-.936l2.05-1.593a.5.5 0 0 0 .12-.646l-1.94-3.362a.5.5 0 0 0-.617-.226l-2.42.97a7.03 7.03 0 0 0-1.614-.936l-.36-2.556a.5.5 0 0 0-.498-.424h-3.88a.5.5 0 0 0-.498.424l-.36 2.556a7.03 7.03 0 0 0-1.614.936l-2.42-.97a.5.5 0 0 0-.617.226L2.66 9.825a.5.5 0 0 0 .12.646l2.05 1.593a6.995 6.995 0 0 0 0 1.872l-2.05 1.593a.5.5 0 0 0-.12.646l1.94 3.362a.5.5 0 0 0 .617.226l2.42-.97a7.03 7.03 0 0 0 1.614.936l.36 2.556a.5.5 0 0 0 .498.424h3.88a.5.5 0 0 0 .498-.424l.36-2.556a7.03 7.03 0 0 0 1.614-.936l2.42.97a.5.5 0 0 0 .617-.226l1.94-3.362a.5.5 0 0 0-.12-.646l-2.05-1.593zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                        />
                    </svg>
                </div>
            </li>

            <li
                onClick={toProfile}
                className="min-w-24 max-w-[100%]"
            >
                <div className="avatar w-auto h-auto">
                    <div className="h-16 w-16 rounded-full">
                        {userInfo.imageData ? (
                            <img
                                src={userInfo.imageData}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <img
                                className="h-auto w-full object-cover"
                                src="/nopro.png"
                                alt="no profile"
                            />
                        )}
                    </div>
                </div>
            </li>
            <li
                onClick={logOut}
                className=" min-w-24 max-w-[100%]"
            >
                <div className="w-auto h-auto">
                    <img src="./door.png" alt="" />
                </div>
            </li>
        </ul>
    );
}
