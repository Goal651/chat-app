/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';



const Login = ({ isMobile }) => {
  const navigate = useNavigate();
  const [wrongEmail, setWrongEmail] = useState(false);
  const [wrongPass, setWrongPass] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" })


  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken) navigate('/')
  }, [navigate]);

  const shake = (element) => {
    const duration = 200
    const distance = 20
    const startTime = Date.now()
    const updatePosition = () => {
      const elapsedTime = Date.now() - startTime
      const progress = elapsedTime / duration
      const offset = distance * Math.sin(progress * Math.PI * 2)
      element.style.transform = `translateX(${offset}px)`
      if (elapsedTime < duration) requestAnimationFrame(updatePosition)
      else element.style.transform = 'translateX(0)'
    }
    updatePosition()
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) })
      if (response.status === 200) {
        const data = await response.json();
        Cookies.set('accessToken', data.accessToken)
        Cookies.set('user', data.email)
        navigate("/home");
      } else if (response.status === 401) {
        document.getElementById('password').focus();
        setWrongPass(true)
        shake(document.getElementById('pass'))
        setWrongEmail(false);
      } else if (response.status === 404) {
        document.getElementById('email').focus();
        setWrongEmail(true);
      } else navigate('/error')
    } catch (error) { navigate('/error') }
  };

  return (
    <div className="flex h-screen max-w-screen overflow-hidden">
      {isMobile ? (null) : (<div className='w-2/4'>
        < img src="/welcome.jpg" alt="welcome" />
      </div>
      )}
      <div className={`form ${isMobile ? 'w-4/5 justify-evenly' : 'w-1/3 justify-center h-full overflow-hidden'} `}>
        <form onSubmit={handleSubmit} className='flex flex-col h-1/2 max-w-min justify-evenly m-4' autoComplete='off'>
          <h1 className='gradient bg-clip-text text-transparent font-bold text-3xl'>Log In</h1>
          {wrongEmail && <div className='text-red-500'>Invalid email or password</div>}
          <label className="input input-bordered flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
              <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
              <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
            </svg>
            <input type="text" className="grow" placeholder="Email" id='email' name="email" value={formData.email} onChange={handleChange} />
          </label>
          <label className="input input-bordered flex items-center gap-2" id='pass'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
              <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                clipRule="evenodd" />
            </svg>
            <input type="password" className="grow" id='password' name="password" value={formData.password} onChange={handleChange} />
          </label>
          {wrongPass && <div className='font-serif text-red-500 relative bottom-3'>Incorrect Password</div>}
          <button type="submit" id="login" className='btn btn-info w-1/2 text-white'>Login</button>
        </form>
        <Link to="/signup" className="link text-green-500 link-hover">Create New Account</Link>
      </div>
    </div >
  );
}

export default Login;
