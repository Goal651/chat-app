import { FaLink } from "react-icons/fa";

export default function Sender() {
    return (
        <div className="flex space-x-4">
            <div className="w-4 h-4">
                <FaLink
                    className="text-white"
                    size={'100%'} />
            </div>
            <input
                type='search'
                placeholder="Search"
                className="bg-transparent w-full placeholder:text-gray-600 outline-0 text-white"
            />
        </div>
    )
}