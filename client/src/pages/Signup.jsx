/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
            setIsEmailValid(emailRegex.test(formData.email || ''));
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
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleImageUploadClick = () => fileInputRef.current.click();

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!isFormReadyToSubmit) return;

        setIsLoading(true);

        try {
            const response = await fetch(
                'https://chat-app-production-2663.up.railway.app/signup',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                }
            );

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
        <div className="flex items-center justify-center min-h-screen bg-gray-800">
            <form
                className="w-full max-w-md p-8 space-y-6 bg-gray-700 rounded-lg shadow-md"
                onSubmit={handleFormSubmit}
            >
                <h2 className="text-2xl font-bold text-center text-white">Sign Up</h2>

                {/* Already have an account? */}
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full py-2 px-4 text-blue-500 hover:text-blue-700 text-sm underline focus:outline-none"
                >
                    Already have an account? Sign In
                </button>

                <InputField
                    name="names"
                    label="Full Name"
                    value={formData.names}
                    onChange={handleInputChange}
                />
                <InputField
                    name="username"
                    label="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                />
                <EmailInput
                    value={formData.email}
                    onChange={handleInputChange}
                    isValid={isEmailValid}
                    isEmailAlreadyUsed={isEmailAlreadyUsed}
                />
                <InputField
                    name="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                />
                <InputField
                    name="re_password"
                    label="Re-enter Password"
                    type="password"
                    value={formData.re_password}
                    onChange={handleInputChange}
                />

                <div className="flex justify-between space-x-4">
                    <button
                        type="submit"
                        className={`w-1/2 py-2 px-4 text-white bg-blue-600 rounded-md ${isFormReadyToSubmit ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'
                            }`}
                        disabled={!isFormReadyToSubmit}
                    >
                        {isLoading ? <ClipLoader color="white" size={20} /> : 'Sign Up'}
                    </button>
                    <button
                        type="button"
                        onClick={handleImageUploadClick}
                        className="w-1/2 py-2 px-4 text-white bg-gray-600 rounded-md hover:bg-gray-700"
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
function InputField({ name, label, type = 'text', value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-200">{label}</label>
            <input
                className="w-full px-3 py-2 mt-1 bg-gray-600 text-white border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                name={name}
                type={type}
                value={value || ''}
                onChange={onChange}
                required
            />
        </div>
    );
}

function EmailInput({ value, onChange, isValid, isEmailAlreadyUsed }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-200">Email</label>
            <input
                className={`w-full px-3 py-2 mt-1 bg-gray-600 text-white border rounded focus:outline-none ${isValid ? 'border-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'border-orange-400 focus:ring-orange-500'
                    }`}
                name="email"
                type="email"
                value={value || ''}
                onChange={onChange}
                required
            />
            {!isValid && <p className="mt-1 text-sm text-orange-400">Enter a valid email</p>}
            {isEmailAlreadyUsed && <p className="mt-1 text-sm text-red-400">Email is already in use</p>}
        </div>
    );
}
