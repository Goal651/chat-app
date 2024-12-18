import { FaCamera, FaLink, FaMicrophone, FaPaperPlane} from "react-icons/fa"
import { FaFaceLaugh } from "react-icons/fa6"
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useState } from "react"
import FileMessagePreview from "../utilities/FileMessagePreview"

export default function Sender() {

    const [message, setMessage] = useState('')
    const [fileData, setFileData] = useState<File[] | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setMessage(value)
    }
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!files) return
        setFileData((prev) => (prev ? [...prev, ...Array.from(files)] : Array.from(files)))
    }

    const cancelFile = (fileName: string) => {
        setFileData((prev) => (prev?.filter((file) => file.name !== fileName)) ?? null)
    }

    const handleEmojiSelect = (data: { native: string }) => {
        setMessage((prev) => (prev + data.native))
    }

    return (
        <div className="flex w-full space-x-4">

            <div className=" bg-slate-700 w-full p-4 rounded-lg space-y-4">
                <div className="flex space-x-4">
                    <div>
                        <label className="cursor-pointer"
                            htmlFor="fileInput">
                            <FaLink
                                className="text-white w-4 h-4"
                            />
                        </label>
                        <input
                            type='file'
                            id="fileInput"
                            onChange={handleFileInputChange}
                            className="hidden"
                            multiple
                        />
                    </div>
                    <input
                        type='text'
                        placeholder="message..."
                        onChange={handleChange}
                        value={message}

                        className="bg-transparent w-full placeholder:text-gray-400 outline-0 text-white"
                    />
                    <div className="flex space-x-4">
                        <FaFaceLaugh
                            className="text-white cursor-pointer"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        />
                        <FaCamera
                            className="text-white" />
                    </div>
                </div>
                <div className="flex space-x-2 w-full overflow-x-auto">
                    {fileData && fileData.length > 0 && (
                        fileData.map((file, index) => (
                            <FileMessagePreview
                                key={index} 
                                data={file}
                                cancelFile={cancelFile} 
                            />
                        ))
                    )}
                </div>

            </div>
            <div className="flex items-center">
                {message || fileData ? (
                    <button className="btn bg-blue-500 border-0 flex items-center">
                        <FaPaperPlane className=" text-xl text-black" />
                    </button>
                ) : (
                    <button className="btn bg-blue-500 border-0 flex items-center">
                        <FaMicrophone className=" text-xl text-black" />
                    </button>
                )}
            </div>
            {showEmojiPicker && (
                <div className="fixed bottom-48">
                    <Picker
                        data={data}
                        theme={'dark'}
                        onEmojiSelect={handleEmojiSelect}
                    />
                </div>
            )}
        </div>
    )
}