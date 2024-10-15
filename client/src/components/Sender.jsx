/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Cookies from 'js-cookie';
import { ReactMic } from 'react-mic'; // Import React Mic
import DocViewer from 'react-doc-viewer'



export default function Sender({ socket, editingMessage, replying }) {
    const { friend_name, group_name } = useParams();
    const friend = localStorage.getItem('selectedFriend');
    const [fileName, setFileName] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [message, setMessage] = useState('');
    const [fileMessage, setFileMessage] = useState(null);
    const accessToken = Cookies.get('accessToken');
    const [isSendingFile, setIsSendingFile] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recording, setRecording] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [editMode, setEditMode] = useState(false)
    const [replyMode, setReplyMode] = useState(false)
    const chat_user=Cookies.get('user')

    useEffect(() => {
        if (editingMessage) {
            setEditMode(true)
            setMessage(editingMessage.message)
        }
    }, [editingMessage])


    useEffect(() => {
        if (replying) setReplyMode(true)
    }, [replying])


    const handleMessageEdition = async (id, message) => {
        if (!socket || !id || !message) return
        socket.emit('edit_message', { id, message, receiver: friend })

    }

    const sendMessage = useCallback((e) => {
        e.preventDefault();
        if (!socket) return;
        if (editMode) {
            handleMessageEdition(editingMessage._id, message)
            setEditMode(false)

        } else {
            if (message.trim() !== "") {
                if (friend_name) {
                    if (replyMode) socket.emit("reply_message", { receiver: friend, message, id: replying._id });
                    else socket.emit("send_message", { receiver: friend, message });
                    socket.emit("not_typing", { receiver: friend });


                }
                if (group_name) {
                    const newMessage = {
                        type: 'text',
                        message,
                        group: group_name,
                        time: new Date().toISOString().slice(11, 16),
                        seen: [],
                    };
                    socket.emit("send_group_message", { message: newMessage });
                }
            }
        }
        setMessage("");
        setShowEmojiPicker(false);
        setReplyMode(false)
        replying(null)
        socket.emit("not_typing", { receiver: friend });
    }, [message, socket, friend, friend_name, group_name]);

    const readAndUploadCurrentChunk = async (currentChunk = 0) => {
        if (!fileMessage) return;
        const chunkSize = 50 * 1024;
        let fileName = fileMessage.name
        if (!fileMessage.name) fileName = `${fileMessage.size + friend.split('.')[0]}.mp3`
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
                    'name': encodeURIComponent(fileName),
                    'type': fileMessage.type,
                    'currentChunk': currentChunk,
                    'totalchunks': totalChunks
                },
            }).then(response => {
                const isLastChunk = currentChunk === totalChunks - 1;
                const progress = Math.round((currentChunk / totalChunks) * 100);
                setUploadProgress(progress);
                if (isLastChunk) {
                    setFileName(response.data.finalFileName);
                    setUploadProgress(100); // Mark as 100% completed
                    setTimeRemaining(0);
                } else readAndUploadCurrentChunk(currentChunk + 1);
            }).catch(error => {
                console.error('Error uploading chunk:', error);
            });
        };
        reader.readAsDataURL(blob);
    };

    useEffect(() => {
        const sendDetailsToSocket = () => {
            const fileType = fileMessage?.type
            if ((fileName && fileMessage)) {
                const newFileMessage = {
                    group: group_name || undefined,
                    receiver: friend || undefined,
                    fileType: fileType,
                    message: fileName,
                    preview: filePreview,
                    time: new Date().toISOString().slice(11, 16),
                };
                socket.emit(group_name ? 'send_group_file_message' : 'send_file_message', { message: newFileMessage });
                setFilePreview(null);
                setFileMessage(null)
                setFileName('')
                setIsSendingFile(false);
            }
        }
        sendDetailsToSocket();
    }, [fileName, socket, friend_name, group_name, friend, fileMessage, filePreview]);

    const sendFileMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!socket && !fileMessage) return;
        const startTime = Date.now();
        await readAndUploadCurrentChunk(0, startTime);
        setIsSendingFile(true);
        socket.emit('not_typing', { receiver: friend });
    }, [fileMessage, socket, friend]);

    const handleChange = useCallback((e) => {
        const { name, files, value } = e.target;
        if (name === 'media') {
            const file = files[0];
            if (file) {
                setFilePreview(URL.createObjectURL(file));
                setFileMessage(file);
                socket.emit('typing', { receiver: friend });

            }
        } else {
            socket.emit('member_typing', { group: group_name });
            setMessage(value);
            socket.emit(value.trim() ? 'typing' : 'not_typing', { receiver: friend });
        }
    }, [socket, friend]);

    const handleCancel = () => {
        setFileMessage(null);
        setFilePreview(null);
    };

    const onStartRecording = () => {
        setRecording(true);
    };

    const onStopRecording = (recordedBlob) => {
        setRecording(false);
        setRecordedAudio(recordedBlob);
        if (recordedBlob.blob) {
            setFilePreview(URL.createObjectURL(recordedBlob.blob));
            setFileMessage(recordedBlob.blob);
        }
    };


    const addEmoji = (emoji) => {
        setMessage((prevMessage) => prevMessage + emoji.native);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    return (
        <>
            {replyMode && (
                <div className={`p-5 mx-4 border-t-slate-300 border-t-2 text-gray-800 `}>
                    <div className='float-right'>
                        <button
                            className='text-gray-500 btn btn-circle btn-xs'
                            onClick={() => setReplyMode(false)}
                        > X
                        </button>
                    </div>
                    <p className="text-gray-500 font-bold">Replying to {replying.sender== chat_user ? 'Yourself' : friend_name}</p>
                    <p className="text-gray-500">{replying?.message}</p>
                </div>
            )}
            <div className={`px-2 mx-4 bg-slate-300 text-gray-800  rounded-lg`}>
                <form onSubmit={sendMessage} className="flex items-center">
                    <button type="button" onClick={toggleEmojiPicker} className="text-gray-500 text-lg">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="gray"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="emoji"
                            width="20"
                            height="20"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-20">
                            <Picker
                                data={data}
                                onEmojiSelect={addEmoji}
                                theme="light" />
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onChange={handleChange}
                        className="flex-1 mx-4 rounded-lg w-12 break-words"
                        autoFocus={true}
                    />
                    <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className=" -rotate-45 "
                            width="20"
                            height="20"
                        >
                            <path d="M21.44 11.05L12.41 20.07a5 5 0 01-7.07-7.07l8.42-8.41a3 3 0 014.24 4.24L10.59 16.76a1 1 0 01-1.42-1.42l7.07-7.07" />
                        </svg>
                        <input
                            type="file"
                            onChange={handleChange}
                            name="media"
                            className="hidden" />
                    </label>
                    <button
                        type="button"
                        className={`ml-4  text-white text-lg rounded-md`}
                        onClick={recording ? onStopRecording : onStartRecording}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke={`${recording ? 'red' : 'black'}`}
                            className="mic-normal"
                            width="18"
                            height="18"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1"
                                d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4zm1 18.93a8.001 8.001 0 007-7.93h-2a6 6 0 01-12 0H4a8.001 8.001 0 007 7.93V23h2v-3.07z"
                            />
                        </svg>
                    </button>
                    <button type="submit" className="ml-4 bg-transparent text-indigo-500 text-xl rounded-md btn btn-ghost">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="indigo"
                            viewBox="0 0 24 24"
                            width="25"
                            height="25"
                        >
                            <path
                                fill='blue'
                                d="M2 21l21-9-21-9v7l15 2-15 2v7z" />
                        </svg>
                    </button>
                </form>
                <ReactMic
                    record={recording}
                    className="sound-wave hidden"
                    onStop={onStopRecording}
                    strokeColor="#000000"
                    backgroundColor="#FF4081"
                    visualSetting="sinewave"
                    style={{ display: 'none' }} />
            </div>

            {filePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
                        <div className="p-4 bg-gray">
                            {fileMessage?.type?.startsWith('image/') && <img src={filePreview} alt="Preview" className="w-full h-auto rounded" />}
                            {fileMessage?.type?.startsWith('video/') && <video src={filePreview} controls className="h-96 w-full" />}
                            {fileMessage?.type?.startsWith('audio/') && <audio controls src={filePreview}>
                                Your browser does not support the audio element.
                            </audio>}
                            {(!fileMessage?.type?.startsWith('image/') &&
                                !fileMessage?.type?.startsWith('video/') &&
                                !fileMessage?.type?.startsWith('audio/')) &&
                                <DocViewer
                                    documents={[{
                                        uri: filePreview
                                    }]}
                                />}
                        </div>
                        <div className="flex justify-end p-4">
                            <button onClick={handleCancel} className="btn btn-secondary mr-4">Cancel</button>
                            <button onClick={sendFileMessage} className="btn btn-primary">
                                {isSendingFile ? <div>
                                    {uploadProgress}%
                                </div> : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
