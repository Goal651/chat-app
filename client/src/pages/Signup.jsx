/* eslint-disable react/prop-types */
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";
import { ClipLoader } from 'react-spinners';

export default function SignUp() {
    const [formData, setFormData] = useState({});
    const [isPasswordMatch, setIsPasswordMatch] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isEmailAlreadyUsed, setIsEmailAlreadyUsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormReadyToSubmit, setIsFormReadyToSubmit] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    useEffect(() => {
        const validateEmail = () => {
            setIsEmailValid(emailRegex.test(formData.email));
        };

        const validatePasswordMatch = () => {
            setIsPasswordMatch(formData.password === formData.re_password);
        };

        validateEmail();
        validatePasswordMatch();
    }, [formData]);

    useEffect(() => {
        const checkFormValidity = () => {
            setIsFormReadyToSubmit(
                formData.names &&
                formData.username &&
                formData.email &&
                formData.password &&
                formData.re_password &&
                isPasswordMatch &&
                isEmailValid
            );
        };

        checkFormValidity();
    }, [formData, isPasswordMatch, isEmailValid]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleImageUploadClick = () => fileInputRef.current.click();

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!isFormReadyToSubmit) return;
        
        setIsLoading(true);
        
        try {
            const response = await fetch("https://chat-app-production-2663.up.railway.app/signup", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                navigate('/login');
            } else if (response.status === 400) {
                setIsEmailAlreadyUsed(true);
            } else {
                navigate('/error');
            }
        } catch (error) {
            navigate('/error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white h-screen py-12 flex">
            <form
                className="flex flex-col h-full justify-evenly text-black w-2/3 mx-10 form-control"
                onSubmit={handleFormSubmit}
            >
                <Link to="/" className="btn btn-link">Return Home</Link>
                <h1 className="text-transparent bg-clip-text font-bold text-3xl gradient">Sign Up</h1>

                {/* Full Name */}
                <InputField
                    name="names"
                    label="Full Name"
                    icon={<UserIcon />}
                    value={formData.names}
                    onChange={handleInputChange}
                />

                {/* Username */}
                <InputField
                    name="username"
                    label="Username"
                    icon={<UserIcon />}
                    value={formData.username}
                    onChange={handleInputChange}
                />

                {/* Email */}
                <EmailInput
                    value={formData.email}
                    onChange={handleInputChange}
                    isValid={isEmailValid}
                    isEmailAlreadyUsed={isEmailAlreadyUsed}
                />

                {/* Password */}
                <InputField
                    name="password"
                    label="Password"
                    type="password"
                    icon={<LockIcon />}
                    value={formData.password}
                    onChange={handleInputChange}
                />

                {/* Re-enter Password */}
                <InputField
                    name="re_password"
                    label="Re-enter Password"
                    type="password"
                    icon={<LockIcon />}
                    value={formData.re_password}
                    onChange={handleInputChange}
                />

                {/* Buttons */}
                <div className="flex justify-between">
                    <button
                        type="submit"
                        className={`btn btn-primary w-1/2 ${isFormReadyToSubmit ? '' : 'btn-disabled'}`}
                        disabled={!isFormReadyToSubmit}
                    >
                        {isLoading ? <ClipLoader color="white" size={15} /> : 'Sign Up'}
                    </button>
                    <button
                        type="button"
                        onClick={handleImageUploadClick}
                        className="btn btn-outline"
                    >
                        Upload Image
                    </button>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    name="image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
}

function InputField({ name, label, icon, type = "text", value, onChange }) {
    return (
        <label className="input input-bordered flex items-center gap-2">
            {icon}
            <input
                className="grow"
                name={name}
                type={type}
                placeholder={label}
                autoComplete="true"
                value={value}
                onChange={onChange}
            />
        </label>
    );
}

function EmailInput({ value, onChange, isValid, isEmailAlreadyUsed }) {
    return (
        <label className="input input-bordered flex items-center gap-2">
            <EmailIcon />
            <input
                className="grow"
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="true"
                value={value}
                onChange={onChange}
            />
            {isEmailAlreadyUsed && (
                <ErrorIcon />
            )}
            {!isValid && (
                <div className="text-orange-600 text-xs">Enter valid email</div>
            )}
        </label>
    );
}

function UserIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
        </svg>
    );
}

function EmailIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
            <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
        </svg>
    );
}

function ErrorIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-red-600 opacity-70">
            <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM7 7.5h2v2H7v-2ZM7 10h2v2H7v-2Z" clipRule="evenodd" />
        </svg>
    );
}
