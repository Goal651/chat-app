/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'

export default function CreateGroup({ isMobile }) {
    const navigate = useNavigate()
    const accessToken = Cookies.get('accessToken')
    const [group, setGroup] = useState('')
    const [imagePreview, setImagePreview] = useState('')
    const [image, setImage] = useState(null)
    const fileInputRef = useRef(null);
    const [filePath, setFilePath] = useState('')
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSendingFile, setIsSendingFile] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file))
        } else setGroup(value);
    };

    const uploadFile = async (currentChunk = 0) => {
        if (!image) return;
        const chunkSize = 50 * 1024;
        let fileName = image.name;
        const totalChunks = Math.ceil(image.size / chunkSize);
        const reader = new FileReader();
        const from = currentChunk * chunkSize;
        const to = Math.min(from + chunkSize, image.size);
        const blob = image.slice(from, to);

        reader.onload = async (e) => {
            const data = e.target.result;
            await axios
                .post(
                    'https://chat-app-production-2663.up.railway.app/uploadFile',
                    { file: data },
                    {
                        headers: {
                            accesstoken: accessToken,
                            name: encodeURIComponent(fileName),
                            type: image.type,
                            currentChunk: currentChunk,
                            totalchunks: totalChunks,
                        },
                    }
                )
                .then((response) => {
                    const isLastChunk = currentChunk === totalChunks - 1;
                    const progress = Math.round((currentChunk / totalChunks) * 100);
                    setUploadProgress(progress);
                    if (isLastChunk) {
                        setFilePath(response.data.finalFileName);
                        setUploadProgress(100);
                    } else uploadFile(currentChunk + 1);
                })
                .catch((error) => {
                    console.error('Error uploading chunk:', error);
                });
        };
        reader.readAsDataURL(blob);
    };


    const sendData = async (e) => {
        e.preventDefault();
        setIsSendingFile(true)
        uploadFile();
        const data = { name: group, image: filePath }
        try {
            const response = await fetch("https://chat-app-production-2663.up.railway.app/create-group", {
                headers: {
                    'Content-Type': 'application/json',
                    'accessToken': ` ${accessToken}`
                },
                method: "POST",
                body: JSON.stringify(data)
            })
            if (response.ok) navigate('/group');
            else if (response.status === 400) navigate('/group');
            else if (response.status === 401) {
                const newToken = await response.json();
                Cookies.set("accessToken", newToken.newToken);
            } else if (response.status === 403) {
                Cookies.remove('accessToken')
                navigate("/login")
            } else console.log("Something went wrong");
        } catch (error) { navigate('/error') }
    };


    const handleCancel = () => {
        setImagePreview('')
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    }
    const handleDragOver = e => e.preventDefault()
    const handleClick = () => fileInputRef.current.click()

    return (
        <div className='bg-white h-screen pl-12 py-12 flex'>
            <form className='flex flex-col h-full justify-evenly text-black w-2/3 mx-10 form-control' onSubmit={sendData}>
                <h1 className='font-bold text-2xl my-5'>Create Group</h1>
                <label className="input input-bordered flex items-center gap-2 validate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                    </svg>
                    <input className='grow' name="names" id='names' type="text" placeholder="Group name" autoComplete="true" onChange={handleChange} />
                </label>
                <label htmlFor="image">Photo</label>
                <input type="file" name='image' onChange={handleChange} value={image.fileName} className='file-input' />
                {isSendingFile ? (
                    <div
                        className='btn btn-success m-5'>
                        <ClipLoader />
                        {uploadProgress}%
                    </div>
                ) : (
                    <button
                        type="submit"
                        className='btn btn-success m-5'
                    >
                        Create
                    </button>)}

            </form>

            {!isMobile && (
                <div className='w-1/3 flex flex-col items-center' onDrop={handleDrop} onDragOver={handleDragOver}>
                    <div className='border-2 border-dashed border-gray-400 p-4 w-full text-center' onClick={handleClick}>
                        {imagePreview ? (
                            <div className='w-full h-50'>
                                <img src={imagePreview} alt="Image Preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <p className='text-gray-500'>Drag and drop an image here, or click to select a file</p>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="image"
                        id="image"
                        className="hidden"
                        onChange={handleChange} />
                </div>)}
        </div>
    );
}