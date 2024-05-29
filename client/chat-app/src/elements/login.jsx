/* eslint-disable no-unused-vars */
import { Link, useNavigate } from 'react-router-dom';
import React, { useState,useEffect } from "react";
import '../css/login.css';
import Cookies from 'js-cookie';


function App() {

  useEffect(() => {
    const username = Cookies.get('username');
    if (username) {
        window.location.href = '/';
    }
}, []);



  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();

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




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.status === 200) {
        const data = await response.json();
        Cookies.set('username', data)
        navigate("/home");
      }
      else if (response.status === 401) {
        let password = document.getElementById('password');
        shake(password);
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
  };

  return (
    <div className="login-page">
      <h1>Chat App</h1>
      <div className='login-form'>
        <h1  >Log In</h1>
        <form onSubmit={handleSubmit} >
          <label htmlFor="email" className=''>Email address:</label>
          <input type="email" name="email" id="email" autoComplete="true" value={formData.email} onChange={handleChange} />
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" id="password" autoComplete="true" value={formData.password} onChange={handleChange} />
          <Link to="/forgot-password" >Forgot Password?</Link><br />
          <button type="submit" id="login"  >Login</button>
        </form>
        <Link to="/signup" className="create">Create New Account</Link>
      </div>

    </div>
  );
}

export default App;
