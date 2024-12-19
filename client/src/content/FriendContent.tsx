import { useEffect } from "react"
import { User } from "../interfaces/interfaces"



export default function FriendContent({ initialFriends }: { initialFriends: User[] }) {

    useEffect(() => {
        console.log(initialFriends)
    }, [initialFriends])

    return (
        <div className="bg-transparent h-full p-4 flex flex-col space-y-4 overflow-y-auto">
            <div className="text-white font-semibold text-xl">Friends</div>
            {initialFriends && initialFriends.length > 0 ? (
                initialFriends.map((friend) => (
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
                                    <div className="text-white font-semibold text-lg">
                                        {friend.username}
                                    </div>
                                    <div className="text-gray-400">
                                        {friend?.latestMessage?.message}
                                    </div>
                                </div>
                            </div>
                            <div className="h-fit flex flex-col ">
                                <div>{friend.lastActiveTime.toString()}</div>
                                {friend?.latestMessage?.receiver?.id === friend.id && (
                                    <div className={`${friend?.latestMessage.seen ? ' text-blue-500' : 'text-white-500'}  text-3xl text-right`}>
                                        <div>✓</div>
                                        {friend?.latestMessage.isMessageSent ? <div>✓</div> : <div>✗</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ))
            ) : (
                <div className="text-white font-semibold text-xl">No friends available</div>
            )}
        </div>
    )
}