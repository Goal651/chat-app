import { Socket } from "socket.io-client"
import Navigator from "../content/Navigator"

export default function Dashboard({ socket }: { socket: Socket }) {
    console.log(socket)
    return (
        <div className="bg-slate-700 h-screen p-5 flex space-x-10">
            <div className="md:w-1/6 bg-blue-600 md:p-2 rounded-2xl">
                <Navigator />
            </div>
            <div className="w-1/3 bg-black p-2 rounded-2xl"></div>
            <div className="w-1/2  bg-black p-4 rounded-2xl"></div>
        </div>
    )
}
