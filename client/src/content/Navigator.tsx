import * as iconsFa from "react-icons/fa"
import * as iconsBi from 'react-icons/fi'
export default function Navigator() {

    return (
        <div className="grid grid-rows-3 grid-flow-col lg:space-y-10 h-full place-items-center">
            <div className="flex justify-center">
                <img
                    src="/b.jpg"
                    className="bg-transparent rounded-full object-cover md:w-16 md:h-16 lg:w-24 lg:h-24 xl:w-36 xl:h-36 "
                />
            </div>
            <div className="flex flex-col items-center md:space-y-4 lg:space-y-8 xl:space-y-14">
                <div className="flex space-x-4">
                    <div className="w-8 h-8">
                        <iconsFa.FaHome size={'100%'} className="text-slate-200" />
                    </div>
                    <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
                </div>
                <div className="flex space-x-4">
                    <div className="w-8 h-8">
                        <iconsBi.FiMessageCircle size={'100%'} className="text-slate-200" />
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

            <div className="flex items-center space-x-4">
                <div className="w-8 h-8">
                    <iconsFa.FaDoorOpen size={'100%'} className="text-slate-200" />
                </div>
                <div className="hidden xl:block text-slate-200 font-semibold text-xl">Home</div>
            </div>
        </div>
    )
}