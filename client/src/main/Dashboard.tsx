import { Socket } from "socket.io-client"
import { FaSearch } from "react-icons/fa"
import Navigator from "../content/Navigator"
import GroupContent from "../content/GroupContent"
import FriendContent from "../content/FriendContent"

export default function Dashboard({ socket }: { socket: Socket }) {
    console.log(socket)
    return (
        <div className="bg-slate-700 h-screen p-5 flex space-x-10">
            <div className="md:w-1/6 bg-blue-600 md:p-2 rounded-2xl">
                <Navigator />
            </div>
            <div className="w-1/3 bg-transparent rounded-2xl flex flex-col space-y-10">
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
                <div className="bg-black rounded-2xl h-full">
                    <GroupContent />
                </div>
                <div className="bg-black rounded-2xl h-full">
                    <FriendContent />
                </div>
            </div>
            <div className="w-1/2  bg-black p-4 rounded-2xl"></div>
        </div>
    )
}
