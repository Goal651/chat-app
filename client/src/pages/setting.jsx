/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Disclosure } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';  // Import the useTheme hook

export default function Settings({ isMobile }) {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { theme, toggleTheme } = useTheme(); 
    const navigate = useNavigate();
    const accessToken = Cookies.get('accessToken');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('http://localhost:3001/getUserProfile', {
                    headers: { accessToken: `${accessToken}` },
                });
                const data = await response.json();
                if (response.status === 401) Cookies.set('accessToken', data);
                else if (response.status === 403) navigate('/login');
                else if (response.ok) setUser(data.user);
            } catch (err) {
                setError('An error occurred while fetching the user profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate, accessToken]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/updateProfile', {
                headers: { 'accessToken': `${accessToken}` },
                method: 'PUT',
                body: JSON.stringify(user),
            });
            if (response.ok) {
                alert('Profile updated successfully');
            }
        } catch (err) {
            setError('Failed to update profile');
            console.error(err);
        }
    };

    const handleThemeChange = () => {
        toggleTheme(); 
    };

    if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner"></span></div>;
    if (error) return <div className="flex justify-center mt-20 text-red-500">{error}</div>;

    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend');
        navigate('/');
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'} p-6`}>
            {isMobile && (
                <button
                    onClick={navigateBackward}
                    className="text-lg text-gray-500 hover:text-gray-800"
                >
                    ← Back
                </button>
            )}

            <div className="max-w-2xl mx-auto space-y-8">
                <h2 className="text-3xl font-semibold">Settings</h2>

                {/* Profile Information */}
                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-3 text-lg font-semibold border-b flex justify-between items-center">
                                Profile Information
                                <span>{open ? '-' : '+'}</span>
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                <div className="space-y-2">
                                    <div>
                                        <label className="block font-medium">Name:</label>
                                        <input
                                            name="names"
                                            value={user.names || ''}
                                            onChange={handleChange}
                                            className="input input-bordered w-full"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium">Username:</label>
                                        <input
                                            name="username"
                                            value={user.username || ''}
                                            onChange={handleChange}
                                            className="input input-bordered w-full"
                                            placeholder="Enter your username"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium">Email:</label>
                                        <input
                                            name="email"
                                            value={user.email || ''}
                                            onChange={handleChange}
                                            className="input input-bordered w-full"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="mt-4 btn btn-primary w-full"
                                    >
                                        Update Profile
                                    </button>
                                </div>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>

                {/* Theme Settings */}
                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-3 text-lg font-semibold border-b flex justify-between items-center">
                                Theme Settings
                                <span>{open ? '-' : '+'}</span>
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                <label className="flex items-center space-x-4">
                                    <span>Light</span>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={theme === 'dark'}
                                        onChange={handleThemeChange}
                                    />
                                    <span>Dark</span>
                                </label>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>

                {/* Other Settings */}
                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-3 text-lg font-semibold border-b flex justify-between items-center">
                                Other Settings
                                <span>{open ? '-' : '+'}</span>
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                <p>More settings will be added here in the future.</p>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>
            </div>
        </div>
    );
}
