import { } from 'react';
import { Link } from 'react-router-dom';


export default function ErrorPage() {
    const theme = localStorage.getItem('theme')
    return (
        <div className={`${theme === 'dark' ? 'bg-gray-900 text-gray-600' : 'bg-gray-100 text-gray-800'} flex flex-col text-center text-2xl h-screen justify-center `}>
            <h1 className="text-9xl font-bold">500</h1>
            <p className="text-2xl mt-4">Internal Server Error</p>
            <p className="mt-2 text-lg">Something went wrong on our end. Please try again later.</p>
            <Link to={'/'} className='link link-primary'>Return home</Link>
        </div>
    );
}
