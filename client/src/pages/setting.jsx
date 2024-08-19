/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Disclosure } from '@headlessui/react';
import { useNavigate } from 'react-router-dom'

const Settings = () => {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState('light'); // Default theme
    const navigate = useNavigate()
    const accessToken = Cookies.get('accessToken')

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUserProfile`, { headers: { accessToken: `${accessToken}` }, });
                const data = await response.json();
                if (response.status === 401) {
                    Cookies.set("accessToken", data);
                    window.location.reload();
                } else if (response.status === 403) navigate("/login");
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
        setTheme(e.target.value);
        document.documentElement.setAttribute('data-theme', e.target.value);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="">
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
                                <label>
                                    Select Theme:
                                    <select value={theme} onChange={handleThemeChange}>
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="blue">Blue</option>

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
