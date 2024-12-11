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
        <div
            className="grid grid-rows-5 grid-flow-row w-full   h-full overflow-x-hidden overflow-y-auto justify-items-center"
        >
            <div
                onClick={toChats}
                className="pt-2"
            >
                <img
                    src="/chat.png"
                    alt="no profile pic"
                    className=" w-14 h-14 object-cover"
                />
                {unreadMessages && unreadMessages.length > 0 && (
                    <span className="bg-slate-200 p-1 rounded-full relative z-50 left-10 bottom-14 text-xs border-2 border-black">
                        {unreadMessages.length > 9 ? `9+` : unreadMessages.length}
                    </span>
                )}
            </div>

            <div
                onClick={toGroups}
                className=""
            >
                <img
                    src="/nogro.png"
                    alt=""
                    className=" w-20 h-20 object-cover"
                />
            </div>
            <div
                onClick={toSetting}
                className=""
            >
                <div className="">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="50"
                        height="50"
                    >
                        <path
                            fill="lightgray"
                            d="M19.14 12.936a6.995 6.995 0 0 0 .06-.936 6.995 6.995 0 0 0-.06-.936l2.05-1.593a.5.5 0 0 0 .12-.646l-1.94-3.362a.5.5 0 0 0-.617-.226l-2.42.97a7.03 7.03 0 0 0-1.614-.936l-.36-2.556a.5.5 0 0 0-.498-.424h-3.88a.5.5 0 0 0-.498.424l-.36 2.556a7.03 7.03 0 0 0-1.614.936l-2.42-.97a.5.5 0 0 0-.617.226L2.66 9.825a.5.5 0 0 0 .12.646l2.05 1.593a6.995 6.995 0 0 0 0 1.872l-2.05 1.593a.5.5 0 0 0-.12.646l1.94 3.362a.5.5 0 0 0 .617.226l2.42-.97a7.03 7.03 0 0 0 1.614.936l.36 2.556a.5.5 0 0 0 .498.424h3.88a.5.5 0 0 0 .498-.424l.36-2.556a7.03 7.03 0 0 0 1.614-.936l2.42.97a.5.5 0 0 0 .617-.226l1.94-3.362a.5.5 0 0 0-.12-.646l-2.05-1.593zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                        />
                    </svg>
                </div>
            </div>

            <div
                onClick={toProfile}
                className=""
            >
                <div className="">
                    <div className="">
                        {userInfo.imageData ? (
                            <img
                                src={userInfo.imageData}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <img
                                className="w-20 h-20 rounded-full  object-cover"
                                src="/nopro.png"
                                alt="no profile"
                            />
                        )}
                    </div>
                </div>
            </div>
            <div
                onClick={logOut}
                className=""
            >
                <img
                    src="/door.png"
                    alt=""
                    className=" w-16 h-16 object-cover"
                />
            </div>
        </div>
    );
}
