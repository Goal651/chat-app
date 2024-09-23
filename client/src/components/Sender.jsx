/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Cookies from 'js-cookie'
import { ClipLoader } from 'react-spinners';



export default function Sender({ socket, theme }) {
    const { user, name } = useParams();
    const friend = localStorage.getItem('selectedFriend')
    const [fileName, setFileName] = useState(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [message, setMessage] = useState('')
    const [fileMessage, setFileMessage] = useState(null)
    const accessToken = Cookies.get('accessToken')
    const [isSendingFile, setIsSendingFile] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false)
    const [isRecording, setIsRecording] = useState(false);
    const [audioChunks, setAudioChunks] = useState([]);
    const mediaRecorderRef = useRef(null);




    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!socket) return;

        if (message.trim() !== "") {
            if (user) {
                socket.emit("send_message", { receiver: friend, message });
            }
            if (name) {
                const newMessage = {
                    sender: user,
                    type: 'text',
                    message: message,
                    group: name,
                    time: new Date().toISOString().slice(11, 16),
                    seen: [],
                };
                socket.emit("send_group_message", { message: newMessage });
            }
        }
        setMessage("");
        setShowEmojiPicker(false);
        socket.emit("not_typing", { receiver: friend });
    }, [message, socket, friend,]);


    const readAndUploadCurrentChunk = async (currentChunk = 0) => {
        if (!fileMessage) return
        console.log(fileMessage)
        const chunkSize = 50 * 1024;
        const totalChunks = Math.ceil(fileMessage.size / chunkSize);
        const reader = new FileReader();
        const from = currentChunk * chunkSize;
        const to = Math.min(from + chunkSize, fileMessage.size);
        const blob = fileMessage.slice(from, to);
        reader.onload = async (e) => {
            const data = e.target.result;
            await axios.post('http://localhost:3001/uploadFile', { file: data }, {
                headers: {
                    'accesstoken': accessToken,
                    'name': encodeURIComponent(fileMessage.name),
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
    };

    const handleCancel = () => {
        setFileMessage(null);
        setFilePreview(null);
    };

    useEffect(() => {
        const sendDetailsToSocket = () => {
            if (user && fileName) {
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
            if (name && fileName) {
                const newFileMessage = {
                    sender: user,
                    group: name,
                    fileName: fileName,
                    imageData: filePreview,
                    fileType: fileMessage.type,
                    time: new Date().toISOString().slice(11, 16),
                };
                socket.emit('send_group_file_message', { message: newFileMessage });
                setFileMessage(null);
                setFilePreview(null);
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
            if (file) {
                if (file.type.startsWith('image')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFilePreview(reader.result);  // Base64 preview
                    };
                    reader.readAsDataURL(file);
                } else {
                    setFilePreview(URL.createObjectURL(file));
                }
                setFileMessage(file);
                socket.emit('typing', { receiver: friend });
            }

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



    const startRecording = () => {
        setIsRecording(true);
        setAudioChunks([]);
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            console.log(stream)
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            mediaRecorderRef.current.ondataavailable = (event) => {
                console.log("Data available:", event.data);
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                } else {
                    console.error("No data captured in event");
                }
            };
            
        });
    };

    const stopRecording = () => {
        setIsRecording(false);
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
            console.log("Audio blob size:", audioBlob.size);
            if (audioBlob.size > 0) {
                const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
                console.log("Audio file size:", audioFile.size);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);  // Base64 preview for audio
                };
                reader.readAsDataURL(audioFile);
                setFileMessage(audioFile);
            } else {
                console.error("Recording failed: Audio Blob is empty");
            }
        };
    };
    



    const addEmoji = (emoji) => {
        setMessage((prevMessage) => prevMessage + emoji.native);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    return (
        <>
            <div className={`p-2  ${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800 '} border border-zinc-500 rounded-lg`}>
                <form onSubmit={sendMessage} className="flex items-center">
                    <button
                        type="button"
                        onClick={toggleEmojiPicker}
                        className="text-gray-500 text-lg "
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
                        className="flex-1 mx-4 rounded-lg w-12 break-words "
                        autoFocus={true}
                    />
                    <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        📎
                        <input type="file" onChange={handleChange} name="media" className="hidden" />
                    </label>
                    <button
                        type="submit"
                        className="ml-4  bg-transparent text-indigo-500 text-xl rounded-md btn btn-ghost"
                    >
                        ➤
                    </button>
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`ml-4 ${isRecording ? 'bg-red-500' : 'bg-green-500'} text-white text-lg rounded-md`}
                    >
                        {isRecording ? 'Stop' : 'Record'}
                    </button>
                </form>
            </div>

            {filePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
                        <div className="p-4">
                            {fileMessage && fileMessage.type && fileMessage.type.startsWith('image/') && (
                                <img src={filePreview} alt="Preview" className="w-full h-auto rounded" />
                            )}
                            {fileMessage && fileMessage.type && fileMessage.type.startsWith('video/') && (
                                <video src={filePreview} autoPlay={false} controls={true} className="h-96 w-full" ></video>
                            )}
                            {fileMessage && fileMessage.type && fileMessage.type.startsWith('audio/') && (
                                <audio controls src={filePreview}></audio>
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