/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";

export default function SignUp({ isMobile }) {
    const [formData, setFormData] = useState({ names: "", username: "", email: "", password: "", image: null, re_password: "" });
    const [imagePreview, setImagePreview] = useState(null);
    const [match, setMatch] = useState(false);
    const [toBeSubmitted, setToBeSubmitted] = useState(false);
    const fileInputRef = useRef(null);
    const [emailFound, setEmailFound] = useState(false)
    const [isToBeSubmitted, setIsToBeSubmitted] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        const check = () => {
            if (formData.password === "" && formData.re_password === '') return;
            if (formData.password !== formData.re_password) setMatch(false);
            else setMatch(true);
        };
        check();
    }, [formData.re_password]);


    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setFormData({ ...formData, image: file })
            setImagePreview(URL.createObjectURL(file))
        } else setFormData({ ...formData, [name]: value })
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setFormData({ ...formData, image: file });
        setImagePreview(URL.createObjectURL(file));
    }
    const handleDragOver = e => e.preventDefault()
    const handleClick = () => fileInputRef.current.click()

    const checkNull = () => {
        let result = false;
        const toBeChecked = Object.entries(formData);
        for (let i = 0; i < toBeChecked.length; i++) {
            const emptyElement = document.getElementById(toBeChecked[i][0]);
            if (toBeChecked[i][1] === '') {
                emptyElement.focus();
                return;
            } else result = true;
        }
        return result
    };


    const validator = () => {
        console.log(checkNull())
        if (!checkNull()) return false
    }


    const handleSubmit = async (e) => {
        e.preventDefault()
        if (validator()) return
        try {
            const formDataToSend = new FormData()
            formDataToSend.append('names', formData.names)
            formDataToSend.append('username', formData.username)
            formDataToSend.append('email', formData.email)
            formDataToSend.append('password', formData.password)
            formDataToSend.append('image', formData.image)
            const response = await fetch("http://localhost:3001/signup", { method: "POST", body: formDataToSend });
            if (response.ok) navigate('/login')
            else if (response.status === 400) setEmailFound(true);
            else if (response.status === 500) navigate('/error')
        } catch (error) { navigate('/error') }
    }

    return (
        <div className='bg-white h-screen py-12 flex'>
            <form className='flex flex-col h-full justify-evenly text-black w-2/3 mx-10 form-control ' onSubmit={handleSubmit}>
                <Link to="/" className="btn btn-link">Return Home</Link>
                <h1 className='text-transparent bg-clip-text font-bold text-3xl gradient'>Sign Up</h1>
                <label className="input input-bordered flex items-center gap-2 validate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                    </svg>
                    <input className='grow' name="names" id='names' type="text" placeholder="Full Name" autoComplete="true" onChange={handleChange} />
                </label>
                <label className="input input-bordered flex items-center gap-2 validate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                    </svg>
                    <input className='grow' name="username" id='username' type="text" placeholder="Username" autoComplete="true" onChange={handleChange} />
                </label>
                <label className="input input-bordered flex items-center gap-2 validate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                        <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                    </svg>
                    <input className='grow' name="email" id='email' type="email" placeholder="Email" autoComplete="true" onChange={handleChange} />
                    {emailFound && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-6 w-5 opacity-70">
                        <path fill="red" d="M8 0L0 16h16L8 0z" />
                        <path fill="white" d="M7 4h2v6H7zM7 11h2v2H7z" />
                    </svg>
                    )}
                </label>
                <label className="input input-bordered flex items-center gap-2 validate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                        <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
                    </svg>
                    <input name="password" id='password' type="password" placeholder="Password" onChange={handleChange} className='grow' />
                </label>
                <label className="input input-bordered flex items-center gap-2 validate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                        <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
                    </svg>
                    <input name="re_password" id='re_password' type="password" placeholder="Re-enter Password" onChange={handleChange} className='grow' />
                    {!match && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-6 w-5 opacity-70">
                        <path fill="red" d="M8 0L0 16h16L8 0z" />
                        <path fill="white" d="M7 4h2v6H7zM7 11h2v2H7z" />
                    </svg>
                    )}
                </label>
                <button type="submit" className={`btn btn-info text-white ${!match && 'btn-disabled'}`} disabled={!match}>Submit</button>
            </form>

            {isMobile ? (null) : (<div className='w-1/3 flex flex-col items-center' onDrop={handleDrop} onDragOver={handleDragOver}>
                <div className='border-2 border-dashed border-gray-400 p-4 w-full text-center' onClick={handleClick}>
                    {imagePreview ? (
                        <div className='w-full h-50'>
                            <img src={imagePreview} alt="Image Preview" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <p className='text-gray-500'>Drag and drop an image here, or click to select a file</p>
                    )}
                </div>
                <input ref={fileInputRef} type="file" name="image" id="image" className="hidden" onChange={handleChange} />
            </div>)}
        </div>
    );
}