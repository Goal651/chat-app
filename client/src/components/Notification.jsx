/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBanner ({ details })  {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (Object.keys(details).length > 0) {
            setVisible(true); 
            const timer = setTimeout(() => {
                setVisible(false); 
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [details]);

    if (!visible || !details) return null;

    const seeMessage = () => {
        if (details.type === 'dm') {
            localStorage.setItem('selectedFriend', details.from);
            navigate('/chat');
        }
        setVisible(false);
    };

    return (
        <div className={`fixed top-10 z-50 right-0 p-4 text-center w-64  text-white transition-transform transform ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div role="alert" className="alert shadow-lg flex items-center justify-between">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-info h-6 w-6 shrink-0 mr-2">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                    <h3 className="font-bold">{details.from}</h3>
                    <div className="text-xs">{details.message}</div>
                </div>
                <button className="btn btn-sm ml-4" onClick={seeMessage}>See</button>
            </div>
        </div>
    );
}