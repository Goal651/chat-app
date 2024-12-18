import { FaCamera, FaLink, FaMicrophone } from "react-icons/fa";
import { FaFaceLaugh } from "react-icons/fa6";

export default function Sender() {
    return (
        <div className="flex w-full space-x-4">
            <div className="flex space-x-4 bg-slate-700 w-full p-4 rounded-lg">
                <div className="">
                    <FaLink
                        className="text-white w-4 h-4" />
                </div>
                <input
                    type='text'
                    placeholder="message..."
                    className="bg-transparent w-full placeholder:text-gray-400 outline-0 text-white"
                />
                <div className="flex space-x-4">
                    <FaFaceLaugh
                        className="text-white" />
                    <FaCamera
                        className="text-white" />
                </div>
            </div>
            <div className="">
                <button className="btn bg-blue-500 border-0 flex items-center">
                    <FaMicrophone className=" text-xl text-black" />
                </button>
            </div>
        </div>
    )
}