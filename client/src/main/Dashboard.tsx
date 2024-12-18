import { Socket } from "socket.io-client"
import { FaSearch, FaPhone, FaVideo, FaEllipsisV } from "react-icons/fa"
import Navigator from "../content/Navigator"
import GroupContent from "../content/GroupContent"
import FriendContent from "../content/FriendContent"
import Messages from "../content/Messages"
import Sender from "../content/Sender"

export default function Dashboard({ socket }: { socket: Socket }) {
    console.log(socket)
    return (
        <div className="bg-slate-700 h-screen p-5 flex space-x-6 overflow-hidden">
            <div className="w-fit sm:w-fit xl:w-64 bg-blue-600 p-4 sm:p-8  rounded md:rounded-2xl overflow-y-auto ">
                <Navigator />
            </div>
            <div className="w-1/3 bg-transparent rounded-2xl flex flex-col space-y-12">
                <div className="flex bg-black w-full h-fit rounded-xl md:p-1 lg:p-2 xl:p-3 space-x-6">
                    <div className="w-8 h-8">
                        <FaSearch
                            className="text-white"
                            size={'100%'} />
                    </div>
                    <input
                        type='search'
                        placeholder="Search"
                        className="bg-transparent w-full placeholder:text-gray-600 outline-0 text-white"
                    />
                </div>
                <div className="grid grid-rows-2 w-full space-y-10 overflow-y-auto h-full">
                    <div className="bg-black rounded-2xl ">
                        <GroupContent />
                    </div>
                    <div className="bg-black rounded-2xl ">
                        <FriendContent />
                    </div>

                </div>
            </div>
            <div className="w-1/2  bg-black py-4 px-6 rounded-2xl flex flex-col">
                <div className="flex justify-between border-b border-slate-700 pb-6">
                    <div className="flex space-x-4 items-center">
                        <div>
                            <img
                                src="/b.jpg"
                                alt=""
                                className="w-16 h-16 object-cover rounded-full bg-transparent "
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-white font-semibold text-xl">Swahili</div>
                            <div className="text-gray-400">Online</div>
                        </div>
                    </div>
                    <div className="flex space-x-8 items-center">
                        <FaPhone
                            className="rotate-90 text-blue-500 w-6 h-6" />
                        <FaVideo
                            className="text-blue-500 w-6 h-6" />
                        <FaEllipsisV
                            className="text-blue-500 w-6 h-6" />
                    </div>
                </div>

                <div className="h-full flex flex-col space-y-4 ">
                    <div className="h-4/6">
                        <Messages />
                    </div>
                    <div className="h-1/6 flex items-center">
                        <Sender />
                    </div>
                </div>
                <div>

                </div>
            </div>
        </div>
    )
}
