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
      if (response.status == 200) {
        const data = await response.json();
        Cookies.set('accessToken', data.accessToken);
        Cookies.set('user', data.email);
        navigate("/chat");
      } else if (response.status == 401) {
        document.getElementById('password').focus();
        setWrongPass(true);
        setWrongEmail(false);
      } else if (response.status == 404) {
        document.getElementById('email').focus();
        setWrongEmail(true);
        setWrongPass(false);
      } 
    } catch (error) {
      console.log(error)
      navigate('/error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-700 rounded-lg">
        <h2 className="text-2xl font-bold text-center text-white">Login</h2>
        {wrongEmail && (
          <div className="p-4 text-red-400 bg-gray-800 border border-red-600 rounded">
            Invalid email address
          </div>
        )}
        {wrongPass && (
          <div className="p-4 text-red-400 bg-gray-800 border border-red-600 rounded">
            Incorrect password
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Login
            </button>
          )}
        </form>
        <div className="flex justify-center mt-4">
          <Link to="/signup">
            <button className="w-full py-2 px-4 text-white bg-slate-600 hover:bg-slate-700 rounded-md">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
