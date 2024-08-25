// src/components/500ErrorPage.jsx
import { } from 'react';
import { Link } from 'react-router-dom';
const ErrorPage = () => {

    return (
        <div className="flex flex-col items-center justify-center align-middle min-h-screen bg-red-100 text-gray-800">
            <h1 className="text-9xl font-bold">500</h1>
            <p className="text-2xl mt-4">Internal Server Error</p>
            <p className="mt-2 text-lg">Something went wrong on our end. Please try again later.</p>
            <Link to={'/'} className='link link-primary'>Return home</Link>
        </div>
    );
};

export default ErrorPage;
