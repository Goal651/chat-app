import * as iconsFa from "react-icons/fa"
export default function Navigator() {

    return (
        <div className="flex flex-col space-y-4 lg:space-y-10 h-full justify-evenly md:place-items-center">
            <div className="flex justify-center">
                <img
                    src="/b.jpg"
                    className="bg-transparent rounded-full object-cover w-8 h-8 md:w-16 md:h-16 lg:w-24 lg:h-24 xl:w-36 xl:h-36 "
                />
            </div>
            <div className="flex flex-col items-center space-y-2 md:space-y-4 lg:space-y-8 xl:space-y-14">
                <div className="flex space-x-4">
                    <div className="w-8 h-8">
                        <iconsFa.FaHome size={'100%'} className="text-slate-200" />
                    </div>
                    <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
                </div>
                <div className="flex space-x-4">
                    <div className="w-8 h-8">
                        <iconsFa.FaRegCommentDots size={'100%'} className="text-slate-200" />
                    </div>
                    <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
                </div>
                <div className="flex space-x-4">
                    <div className="w-8 h-8">
                        <iconsFa.FaBell size={'100%'} className="text-slate-200" />
                    </div>
                    <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
                </div >
                <div className="flex space-x-4">
                    <div className="w-8 h-8">
                        <iconsFa.FaCog size={'100%'} className="text-slate-200" />
                    </div>
                    <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
                </div>
            </div>

            <div className="flex justify-center space-x-4">
                <div className="w-8 h-8">
                    <iconsFa.FaDoorOpen size={'100%'} className="text-slate-200" />
                </div>
                <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
            </div>
        </div>
    )
}