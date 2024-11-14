/* eslint-disable react/prop-types */
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";

export default function Navigation({ socket, isMobile, userInfo }) {
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
            className={`menu menu-lg rounded-box w-full h-full navigation text-sm justify-evenly bg-transparent
            ${isMobile ? (type ? "hidden" : "block") : "flex md:flex-row"} 
            md:space-x-4 md:justify-between`}
        >
            <li
                onClick={toChats}
                className="hover:bg-gray-200 md:hover:bg-transparent"
            >
                <div>
                    <img src="/chat.svg" alt="" />
                </div>
            </li>
            <li
                onClick={toGroups}
                className="hover:bg-gray-200 md:hover:bg-transparent"
            >
                <div>
                    <img src="./group.png" alt="" />
                </div>
            </li>
            <li
                onClick={toSetting}
                className="hover:bg-gray-200 md:hover:bg-transparent"
            >
                <div>
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
                className="hover:bg-gray-200 md:hover:bg-transparent"
            >
                <div className="avatar">
                    <div className="h-16 w-16 rounded-full bg-gray-400">
                        {userInfo.imageData ? (
                            <img
                                src={userInfo.imageData}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <svg
                                className="justify-self-center object-cover"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                            >
                                <path
                                    fill="gray"
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z"
                                />
                            </svg>
                        )}
                    </div>
                </div>
            </li>
            <li
                onClick={logOut}
                className="hover:bg-gray-200 md:hover:bg-transparent"
            >
                <div>
                    <img src="./door.png" alt="" />
                </div>
            </li>
        </ul>
    );
}
