/* eslint-disable react/prop-types */
import { Link, useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { useState, useEffect } from "react";
import Cookies from 'js-cookie';

export default function Login({ isMobile }) {
  const navigate = useNavigate();
  const [wrongEmail, setWrongEmail] = useState(false);
  const [wrongPass, setWrongPass] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const accessToken = Cookies.get('accessToken');

  useEffect(() => {
    if (accessToken) return;
    Cookies.remove("accessToken");
    Cookies.remove("user");
    localStorage.removeItem('selectedFriend');
    localStorage.removeItem('selectedGroup');
  }, []);

  useEffect(() => {
    if (accessToken) navigate('/');
  }, [navigate]);

  const shake = (element) => {
    const duration = 200;
    const distance = 20;
    const startTime = Date.now();
    const updatePosition = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = elapsedTime / duration;
      const offset = distance * Math.sin(progress * Math.PI * 2);
      element.style.transform = `translateX(${offset}px)`;
      if (elapsedTime < duration) requestAnimationFrame(updatePosition);
      else element.style.transform = 'translateX(0)';
    };
    updatePosition();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("https://chat-app-production-2663.up.railway.app/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.status === 200) {
        const data = await response.json();
        Cookies.set('accessToken', data.accessToken);
        Cookies.set('user', data.email);
        navigate("/chat");
      } else if (response.status === 401) {
        document.getElementById('password').focus();
        setWrongPass(true);
        shake(document.getElementById('pass'));
        setWrongEmail(false);
      } else if (response.status === 404) {
        document.getElementById('email').focus();
        setWrongEmail(true);
        setWrongPass(false);
      } else navigate('/error');
    } catch (error) {
      navigate('/error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen max-w-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      {!isMobile && (
        <div className="w-2/4 hidden lg:flex justify-center items-center bg-gray-200">
          <img src="/welcome.jpg" alt="welcome" className="h-full object-cover opacity-75" />
        </div>
      )}
      <div className={`form ${isMobile ? 'w-4/5 mx-auto' : 'w-1/3 p-8 mx-auto'} flex flex-col items-center`}>
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4" autoComplete="off">
          <h1 className="text-4xl font-bold text-center gradient bg-clip-text text-transparent">Log In</h1>
          {wrongEmail && <div className="text-red-500 text-center">Invalid email address</div>}
          <label className="relative input input-bordered flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-lg p-2">
            <input 
              type="email" 
              placeholder="Email" 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="flex-1 bg-transparent outline-none" 
            />
          </label>
          <label className="relative input input-bordered flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-lg p-2" id="pass">
            <input 
              type="password" 
              placeholder="Password" 
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="flex-1 bg-transparent outline-none" 
            />
          </label>
          {wrongPass && <div className="text-red-500 text-center">Incorrect Password</div>}
          {loading ? (
            <div className="btn btn-primary btn-lg w-full flex justify-center items-center">
              <ClipLoader color="white" />
            </div>
          ) : (
            <button type="submit" className="btn btn-primary btn-lg w-full text-white">
              Login
            </button>
          )}
        </form>
        <Link to="/signup" className="text-center mt-4 text-blue-500 hover:underline">
          Create New Account
        </Link>
      </div>
    </div>
  );
}
