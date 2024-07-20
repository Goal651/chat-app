/* eslint-disable no-unused-vars */
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';

function App() {
  useEffect(() => {
    const username = Cookies.get('username');
    if (username) {
      window.location.href = '/';
    }
  }, []);
  const [wrongEmail, setWrongEmail] = useState(false);
  const [wrongPass, setWrongPass] = useState(false);


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
    element.style.borderColor = 'red';
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
        document.getElementById('password').style.borderColor = "red";
        document.getElementById('email').style.borderColor = "blue";
        document.getElementById('password').focus()
        let pass = document.getElementById('password')
        shake(pass)
        setWrongPass(true)
        setWrongEmail(false);
      }
      else if (response.status === 404) {
        document.getElementById('email').style.borderColor = "red";
        document.getElementById('email').focus();
        document.getElementById('password').style.borderColor = "red";
        setWrongEmail(true);
      }
      else { throw new Error("Something went wrong"); }
    } catch (error) { console.error("Error submitting data:", error); }
  };

  return (
    <div className="flex h-screen max-w-screen overflow-hidden">
      <div className='w-full'>
        <img src="/welcome.jpg" alt="" />
      </div>
      <div className='w-full justify-center form h-full overflow-hidden'>
        <form onSubmit={handleSubmit} className='flex flex-col h-1/2 w-72 justify-evenly ' autoComplete='false'>
          <h1 className='gradient bg-clip-text text-transparent font-bold text-3xl'>Log In</h1>
          {wrongEmail && <div className='text-red-500'>Invalid email or password</div>}
          <label htmlFor="email" className=''>Email address:</label>
          <input type="email" name="email" id='email' value={formData.email} onChange={handleChange} className='input bg-transparent border-blue-700 focus:bg-transparent ' />
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className='input bg-transparent border-blue-700' />
          {wrongPass && <div className='text-red-500 relative bottom-3'>Incorrect Password</div>}
          <button type="submit" id="login" className='btn btn-info  w-1/2 text-white '  >Login</button>
        </form>
        <Link to="/signup" className="link link-error link-hover">Create New Account</Link>
      </div>

    </div>
  );
}

export default App;
