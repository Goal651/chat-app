/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */

import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import '../css/signup.css';

const signUp = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        image: null
    });
    const navigate = useNavigate();
    console.log(formData.image)
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setFormData({ ...formData, [name]: file });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    function shake(element) {
        const duration = 200; // in milliseconds
        const distance = 20; // in pixels
        const startTime = Date.now();
        function updatePosition() {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / duration;
            const offset = distance * Math.sin(progress * Math.PI * 2);
            element.style.transform = `translateX(${offset}px) `;

            if (elapsedTime < duration) {
                setTimeout(updatePosition, 1000 / 60); // Update roughly 60 times per second
            } else {
                element.style.transform = 'translateX(0)'; // Reset transform when animation ends
            }
        }

        updatePosition();
    }




    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);

        try {


            const response = await fetch("http://localhost:3001/signup", {
                method: "POST",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                navigate('/');
            }
            else if (response.status === 400) {
                navigate('/signup');
            }
            else if (response.status === 404) {
                let email = document.getElementById('email');
                shake(email);
            }
            else {
                throw new Error("Something went wrong");
            }

        } catch (error) {
            console.error("Error submitting data:", error);
        }
    }
    return (
        <div className='signup-page'>
            <Link to="/">Return Home</Link>
            <form className='signup-form' onSubmit={handleSubmit}>
                <h1>Sign Up</h1>
                <label htmlFor="username">Username:</label>
                <input name="username" type="text" autoComplete="true" onChange={handleChange} />
                <label htmlFor="email">Email address:</label>
                <input name="email" type="email" autoComplete="true" onChange={handleChange} />
                <label htmlFor="image">Image profile:</label>
                <input name="image" type="file" onChange={handleChange} />
                <label htmlFor="password">Password:</label>
                <input name="password" type="password" onChange={handleChange} />
                <button type="submit">Submit</button>
            </form>
        </div>)
};

export default signUp;