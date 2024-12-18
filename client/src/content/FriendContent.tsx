export default function FriendContent() {
    return (
        <div className="bg-transparent h-full p-4 flex flex-col space-y-4 overflow-y-auto">
            <div className="text-white font-semibold text-xl">Friends</div>
            <div className="w-full">
                <div className="flex justify-between ">
                    <div className="flex space-x-4">
                        <div className="bg-transparent rounded-full">
                            <img
                                src="/b.jpg"
                                alt=""
                                className="w-14 h-14 rounded-full object-cover" />
                        </div>
                        <div>
                            <div className="text-white font-semibold text-lg">WIGOTHEHACKER</div>
                            <div className="text-gray-400">Hey yooooo</div>
                        </div>
                    </div>
                    <div className="h-fit flex flex-col ">
                        <div>Today, 5:27pm</div>
                        <div className="text-blue-500  text-3xl text-right">
                            <div>✓</div>
                            <div className="relative bottom-8">✓</div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between">
                    <div className="flex space-x-4">
                        <div className="bg-transparent rounded-full">
                            <img
                                src="/b.jpg"
                                alt=""
                                className="w-14 h-14 rounded-full object-cover" />
                        </div>
                        <div>
                            <div className="text-white font-semibold text-lg">WIGOTHEHACKER</div>
                            <div className="text-gray-400">Hey yooooo</div>
                        </div>
                    </div>
                    <div className="h-fit flex flex-col">
                        <div>Today, 5:27pm</div>
                        <div className="text-blue-100  text-3xl text-right">
                            <div>✓</div>
                            <div className="relative bottom-8">✓</div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between">
                    <div className="flex space-x-4">
                        <div>
                            <div className="bg-transparent rounded-full">
                                <img
                                    src="/b.jpg"
                                    alt=""
                                    className="w-14 h-14 rounded-full object-cover"
                                />
                            </div>
                            <div className="relative left-10 bottom-3 w-3 h-3 border border-inherit rounded-full bg-green-500"></div>
                        </div>
                        <div>
                            <div className="text-white font-semibold text-lg">WIGOTHEHACKER</div>
                            <div className="text-gray-400">Hey yooooo</div>
                        </div>
                    </div>
                    <div className="h-fit flex flex-col ">
                        <div>Today, 5:27pm</div>
                        <div className="flex justify-end">
                            <div className=' bg-blue-500 text-black p-2 rounded-full text-center w-10 h-10  '>
                                2
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}