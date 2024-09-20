/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react'
import {  useParams } from 'react-router-dom'
import axios from 'axios'
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Cookies from 'js-cookie'
import { ClipLoader } from 'react-spinners';



export default function Sender({ socket,theme }) {
    const { user } = useParams();
    const friend = localStorage.getItem('selectedFriend')
    const [fileName, setFileName] = useState(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [message, setMessage] = useState('')
    const [fileMessage, setFileMessage] = useState(null)
    const accessToken = Cookies.get('accessToken')
    const [isSendingFile, setIsSendingFile] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false)




    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!socket) return;

        if (message.trim() !== "") {
            socket.emit("send_message", { receiver: friend, message });
            setMessage("");
            setShowEmojiPicker(false);
        }
        socket.emit("not_typing", { receiver: friend });
    }, [message, socket, friend,]);

    const readAndUploadCurrentChunk = async (currentChunk = 0) => {
        const chunkSize = 50 * 1024; // 50 KB per chunk
        const totalChunks = Math.ceil(fileMessage.size / chunkSize);
        const reader = new FileReader();
        if (!fileMessage) return
        const from = currentChunk * chunkSize;
        const to = Math.min(from + chunkSize, fileMessage.size);
        const blob = fileMessage.slice(from, to);
        reader.onload = async (e) => {
            const data = e.target.result;
            await axios.post('http://localhost:3001/uploadFile', { file: data }, {
                headers: {
                    'accesstoken': accessToken,
                    'name': fileMessage.name,
                    'size': fileMessage.size,
                    'currentChunk': currentChunk,
                    'totalchunks': totalChunks
                },
            }).then(response => {
                const isLastChunk = currentChunk === totalChunks - 1;
                if (isLastChunk) {
                    const finalFileName = response.data.finalFileName
                    setFileName(finalFileName)
                } else {
                    readAndUploadCurrentChunk(currentChunk + 1);
                }
            }).catch(error => {
                console.error('Error uploading chunk:', error);
            });
        };
        reader.readAsDataURL(blob);
        console.log(fileName, 'in returning')
    };

    const handleCancel = () => {
        setFileMessage(null);
        setFilePreview(null);
    };

    useEffect(() => {
        const sendDetailsToSocket = () => {
            if (fileName) {
                const newFileMessage = {
                    receiver: friend,
                    fileType: fileMessage.type,
                    fileSize: fileMessage.size,
                    message: fileName,
                    preview: filePreview,
                    time: new Date().toISOString().slice(11, 16),
                };
                socket.emit('send_file_message', { message: newFileMessage });
                setFileMessage(null);
                setFilePreview(null);
                setIsSendingFile(false)
            }
        }
        sendDetailsToSocket()
    }, [fileName])


    const sendFileMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!socket || !fileMessage) return;
        await readAndUploadCurrentChunk(0)
        setIsSendingFile(true);
        socket.emit('not_typing', { receiver: friend });
    }, [fileMessage, socket, friend, user, fileName]);



    const handleChange = useCallback((e) => {
        const { name, value, files } = e.target;
        if (name === 'media') {
            const file = files[0];
            setFilePreview(URL.createObjectURL(file));
            setFileMessage(files[0]);
            socket.emit('typing', { receiver: friend })
        } else {
            setMessage(value);
            if (value.trim() !== "") socket.emit("typing", { receiver: friend });
            if (value.trim() === "") socket.emit('not_typing', { receiver: friend })
        }
    }, [socket, friend]);

    const handlePaste = (e) => {
        const file = e.clipboardData.files[0];
        setFilePreview(URL.createObjectURL(file));
        setFileMessage(file);
    };
    const handleDragover = () => {
        setIsDragOver(true)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0];

        if (file) {
            setFilePreview(URL.createObjectURL(file));
            setFileMessage(file);
        }
        else {
            setMessage('')
        }
    }



    const addEmoji = (emoji) => {
        setMessage((prevMessage) => prevMessage + emoji.native);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    return (
        <>
            <div className={`p-4  ${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800 shadow-md'}`}>
                <form onSubmit={sendMessage} className="flex items-center">
                    <button
                        type="button"
                        onClick={toggleEmojiPicker}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >😊
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-20">
                            <Picker data={data} onEmojiSelect={addEmoji} theme={theme} />
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onChange={handleChange}
                        onPaste={handlePaste}
                        onDragOver={handleDragover}
                        onDrop={handleDrop}
                        className="flex-1 mx-4 p-2 border rounded-lg w-12 break-words focus:outline-none focus:border-blue-500"
                        autoFocus={true}
                    />
                    <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        📎
                        <input type="file" onChange={handleChange} name="media" className="hidden" />
                    </label>
                    <button
                        type="submit"
                        className="ml-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                    >
                        ➤
                    </button>
                </form>
            </div>

            {filePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
                        <div className="p-4">
                            {fileMessage.type.startsWith('image/') ? (
                                <img src={filePreview} alt="Preview" className="w-full h-auto rounded" />
                            ) : (
                                <video src={filePreview} autoPlay={false} controls={true} className="h-96 w-full" ></video>
                            )}
                        </div>
                        <div className="flex justify-end p-4 bg-gray-100">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none mr-2"
                            >
                                Cancel
                            </button>

                            <button

                                onClick={sendFileMessage}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none flex items-center justify-center"
                                disabled={isSendingFile} // Disable button while sending
                            >
                                {isSendingFile ? (
                                    <>
                                        <ClipLoader size={20} color="#ffffff" /> {/* Spinner while sending */}
                                        <span className="ml-2">Sending...</span>
                                    </>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}