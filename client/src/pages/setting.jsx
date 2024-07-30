/* eslint-disable no-unused-vars */
// client/src/pages/settings.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Disclosure } from '@headlessui/react';

const Settings = () => {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState('light'); // Default theme

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const username = Cookies.get('username');
                const response = await axios.get(`/api/users/${username}`);
                setUser(response.data);
            } catch (err) {
                setError('Failed to fetch user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/users/${user.username}`, user);
            alert('Profile updated successfully');
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    const handleThemeChange = (e) => {
        setTheme(e.target.value);
        document.documentElement.setAttribute('data-theme', e.target.value);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="settings-page">
            <h2>Settings</h2>
            <div className="space-y-4">
                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="w-full py-2 text-left text-lg font-semibold border-b">
                                Profile Information
                            </Disclosure.Button>
                            <Disclosure.Panel className="p-4">
                                <form onSubmit={handleSubmit}>
                                    <label>
                                        First Name:
                                        <input type="text" name="f_name" value={user.f_name || ''} onChange={handleChange} />
                                    </label>
                                    <label>
                                        Last Name:
                                        <input type="text" name="l_name" value={user.l_name || ''} onChange={handleChange} />
                                    </label>
                                    <label>
                                        Email:
                                        <input type="email" name="email" value={user.email || ''} onChange={handleChange} />
                                    </label>
                                    <label>
                                        Username:
                                        <input type="text" name="username" value={user.username || ''} onChange={handleChange} readOnly />
                                    </label>
                                    <label>
                                        Password:
                                        <input type="password" name="password" value={user.password || ''} onChange={handleChange} />
                                    </label>
                                    <button type="submit">Update Profile</button>
                                </form>
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
                                <label>
                                    Select Theme:
                                    <select value={theme} onChange={handleThemeChange}>
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="blue">Blue</option>
                                        {/* Add more themes as needed */}
                                    </select>
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
};

export default Settings;
