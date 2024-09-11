/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Disclosure } from '@headlessui/react';
import { useNavigate } from 'react-router-dom'

export default function Settings  ({ isMobile }) {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('theme'))
    const navigate = useNavigate()
    const accessToken = Cookies.get('accessToken')

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUserProfile`, { headers: { accessToken: `${accessToken}` }, });
                const data = await response.json();
                if (response.status === 401) Cookies.set("accessToken", data)
                else if (response.status === 403) navigate("/login");
                else if (response.ok) setUser(data.user)
            } catch (err) {
                navigate('/error')
            } finally {
                setLoading(false);
            }
        }
        fetchUser()
    }, [navigate, accessToken]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/', { headers: { 'accessToken': `${accessToken}` }, method: 'PUT' });
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    const handleThemeChange = (e) => {
        const data = e.target.checked;
        if (data) {
            setTheme('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            setTheme('light')
            localStorage.setItem('theme', 'light')
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return navigate('/error');

    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend')
        navigate('/')
    }

    return (
        <div className={`${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800 '}`}>
            {isMobile && (
                <button onClick={navigateBackward} className="mr-4 text-gray-500 hover:text-gray-800">
                    ←
                </button>
            )}
            <h2>Settings</h2>
            <div className="space-y-4">
                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-2 text-left text-lg font-semibold border-b">
                                Profile Information
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                <div className='font-semibold'>
                                    <div>Names:{user.names}</div>
                                    <div>Username:{user.username}</div>
                                    <div>Email:{user.email}</div>
                                </div>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>

                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-2 text-left text-lg font-semibold border-b">
                                Theme Settings
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                <label className="flex cursor-pointer gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="5" />
                                        <path
                                            d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                                    </svg>
                                    <input
                                        type="checkbox"
                                        value='dark-theme'
                                        onChange={handleThemeChange}
                                        checked={theme === 'dark' ? true : false}
                                        className="toggle theme-controller" />
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                    </svg>
                                </label>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>

                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-2 text-left text-lg font-semibold border-b">
                                Other Settings
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                {/* Add other settings here */}
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>
            </div>
        </div>
    );
}