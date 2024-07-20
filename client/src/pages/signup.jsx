/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */

import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from "react";

const SignUp = () => {
    const [formData, setFormData] = useState({ fname: "", lname: "", username: "", email: "", password: "", image: null, re_password: "" });
    const [imagePreview, setImagePreview] = useState(null);
    const navigate = useNavigate();
    const [match, setMatch] = useState(false);
    const [toBeSubmitted, setToBeSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    }

    function shake(element) {
        const duration = 200; // in milliseconds
        const distance = 20; // in pixels
        const startTime = Date.now();
        function updatePosition() {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / duration;
            const offset = distance * Math.sin(progress * Math.PI * 2);
            element.style.transform = `translateX(${offset}px) `;
            if (elapsedTime < duration) setTimeout(updatePosition, 1000 / 60); // Update roughly 60 times per second
            else element.style.transform = 'translateX(0)'; // Reset transform when animation ends
        }
        updatePosition();
    }

    useEffect(() => {
        const check = () => {
            if (formData.password === "" && formData.re_password === '') return;
            if (formData.password !== formData.re_password) setMatch(false);
            else setMatch(true);
        };
        check();
    }, [formData]);

    const checkNull = (e) => {
        e.preventDefault();
        const toBeChecked = Object.entries(formData);
        for (let i = 0; i < toBeChecked.length; i++) {
            let Null = document.getElementById(toBeChecked[i][0]);
            if (toBeChecked[i][1] === '') {
                Null.style.borderColor = 'red';
                shake(Null);
                Null.focus();
                return;
            } else {
                Null.style.borderColor = 'blue';
                setToBeSubmitted(true);
            }
        }
        handleSubmit();
    };

    const handleSubmit = async (e) => {
        console.log(formData);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('f_name', formData.fname);
            formDataToSend.append('l_name', formData.lname);
            formDataToSend.append('username', formData.username);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('image', formData.image);

            const response = await fetch("http://localhost:3001/signup", {
                method: "POST",
                body: formDataToSend
            });

            if (response.ok) {
                navigate('/');
            } else if (response.status === 400) {
                navigate('/signup');
            } else if (response.status === 404) {
                let email = document.getElementById('email');
                shake(email);
            } else {
                throw new Error("Something went wrong");
            }
        } catch (error) {
            console.error("Error submitting data:", error);
        }
    };

    return (
        <div className='bg-white min-h-screen py-12 flex'>
            <form className='flex flex-col h-full justify-evenly text-black w-2/3 mx-10' onSubmit={checkNull}>
                <Link to="/" className="btn btn-link">Return Home</Link>
                <h1 className='text-transparent bg-clip-text font-bold text-3xl gradient'>Sign Up</h1>
                <label htmlFor="fname">First Name</label>
                <input className='input input-bordered bg-transparent border-blue-700 w' name="fname" id='fname' type="text" autoComplete="true" onChange={handleChange} />
                <label htmlFor="lname">Last Name</label>
                <input className='input input-bordered bg-transparent border-blue-700' name="lname" id='lname' type="text" autoComplete="true" onChange={handleChange} />
                <label htmlFor="username">Username:</label>
                <input className='input input-bordered bg-transparent border-blue-700' name="username" id='username' type="text" autoComplete="true" onChange={handleChange} />
                <label htmlFor="email">Email address:</label>
                <input className='bg-transparent input input-bordered border-blue-700' name="email" id='email' type="email" autoComplete="true" onChange={handleChange} />
                <input type="file" name="image" id="image" className="file-input bg-info file-input-info" onChange={handleChange} />
                <label htmlFor="password">Password:</label>
                <input name="password" id='password' type="password" onChange={handleChange} className='bg-transparent input input-bordered border-blue-700' />
                <label htmlFor="re_password">Re-enter Password:</label>
                <input name="re_password" id='re_password' type="password" onChange={handleChange} className='bg-transparent input input-bordered border-blue-700' />
                <button type="submit" className={`btn btn-info text-white`}>Submit</button>
            </form>
            <div className='w-1/3 flex justify-center ' htmlFor='image'>
                {imagePreview && <img src={imagePreview} alt="Image Preview" className=" flex m-4 w-72 h-96 justify-center" />}
            </div>
        </div>
    );
};

export default SignUp;
