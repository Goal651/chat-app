import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';
export default function SignUp({ serverUrl }) {
    const [formData, setFormData] = useState({
        names: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isPasswordMatch, setIsPasswordMatch] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isEmailAlreadyUsed, setIsEmailAlreadyUsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormReadyToSubmit, setIsFormReadyToSubmit] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const namesRef = useRef(null);
    const usernameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);
    const refMap = {
        names: namesRef,
        username: usernameRef,
        email: emailRef,
        password: passwordRef,
        confirmPassword: confirmPasswordRef
    };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    useEffect(() => {
        const validateEmail = () => setIsEmailValid(emailRegex.test(formData.email || ''));
        const validatePasswordMatch = () => setIsPasswordMatch(formData.password === formData.confirmPassword);
        validateEmail();
        validatePasswordMatch();
    }, [formData]);
    useEffect(() => {
        setIsFormReadyToSubmit(formData.names === "" &&
            formData.username === "" &&
            formData.email === "" &&
            formData.password === "" &&
            formData.confirmPassword === "" &&
            isPasswordMatch &&
            isEmailValid);
    }, [formData, isPasswordMatch, isEmailValid]);
    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file' && files) {
            setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
            setImagePreview(URL.createObjectURL(files[0]));
        }
        else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
        // Remove red border when input starts getting valid
        if (value.trim()) {
            refMap[name]?.current?.classList.remove("border-red-500", "focus:ring-red-500");
        }
    };
    const handleImageUploadClick = () => fileInputRef.current?.click();
    const handleBlur = (e) => {
        const { name, value } = e.target;
        const ref = refMap[name];
        if (!value.trim()) {
            ref?.current?.classList.add("border-red-500", "focus:ring-red-500");
        }
    };
    const handleFocus = (e) => {
        const { name } = e.target;
        const ref = refMap[name];
        ref?.current?.classList.remove("border-red-500", "focus:ring-red-500");
    };
    const validateInputs = () => {
        let isValid = true;
        // Check if all required fields are filled in
        Object.keys(refMap).forEach((key) => {
            const ref = refMap[key];
            const value = formData[key];
            if (!value?.trim()) {
                ref?.current?.classList.add("border-red-500", "focus:ring-red-500");
                isValid = false;
            }
        });
        return isValid;
    };
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateInputs())
            return;
        setIsLoading(true);
        try {
            const response = await axios.post(`${serverUrl}/api/signUp`, formData);
            if (response.status === 200)
                navigate('/login');
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (!error.response) {
                    navigate('/no-internet');
                    return;
                }
                if (error.response.status === 400)
                    setIsEmailAlreadyUsed(true);
                else
                    navigate('/error');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 via-gray-900 to-black m-0 p-0", children: _jsxs("form", { className: "h-screen sm:h-full w-full max-w-lg p-10 bg-gray-700 sm:rounded-lg shadow-lg space-y-6  ", onSubmit: handleFormSubmit, children: [_jsx("h2", { className: "text-3xl font-bold text-center text-white", children: "Sign Up" }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/login", className: "text-blue-400 hover:text-blue-600", children: "Already have an account? Sign In" }) }), imagePreview && (_jsx("div", { className: "flex justify-center mb-6", children: _jsx("img", { src: imagePreview, alt: "Profile Preview", className: "w-32 h-32 rounded-full object-cover" }) })), _jsx(InputField, { name: "names", label: "Full Name", value: formData.names, onChange: handleInputChange, onBlur: handleBlur, onFocus: handleFocus, ref: namesRef }), _jsx(InputField, { name: "username", label: "Username", value: formData.username, onChange: handleInputChange, onBlur: handleBlur, onFocus: handleFocus, ref: usernameRef }), _jsx(EmailInput, { value: formData.email, onChange: handleInputChange, isValid: isEmailValid, isEmailAlreadyUsed: isEmailAlreadyUsed, onBlur: handleBlur, onFocus: handleFocus, ref: emailRef }), _jsx(InputField, { name: "password", label: "Password", type: "password", value: formData.password, onChange: handleInputChange, onBlur: handleBlur, onFocus: handleFocus, ref: passwordRef }), _jsx(InputField, { name: "confirmPassword", label: "Confirm Password", type: "password", value: formData.confirmPassword, onChange: handleInputChange, onBlur: handleBlur, onFocus: handleFocus, ref: confirmPasswordRef }), _jsx("button", { type: "submit", disabled: !isFormReadyToSubmit, className: `w-full py-3 px-5 text-lg font-medium text-white bg-blue-600 rounded-lg ${isFormReadyToSubmit ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}`, children: isLoading ? _jsx(ClipLoader, { color: "white", size: 24 }) : 'Sign Up' }), _jsx("button", { type: "button", onClick: handleImageUploadClick, className: "w-full py-3 px-5 mt-2 text-lg font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700", children: "Upload Profile Image" }), _jsx("input", { type: "file", ref: fileInputRef, name: "image", accept: "image/*", className: "hidden", onChange: handleInputChange })] }) }));
}
function InputField({ name, label, type = 'text', value, onChange, onBlur, onFocus, ref }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium text-gray-300", children: label }), _jsx("input", { ref: ref, className: "w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", name: name, type: type, value: value || '', onChange: onChange, onBlur: onBlur, onFocus: onFocus, required: true })] }));
}
function EmailInput({ value, onChange, isValid, isEmailAlreadyUsed, onBlur, onFocus, ref }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium text-gray-300", children: "Email" }), _jsx("input", { ref: ref, className: `w-full px-4 py-2 bg-gray-800 text-white border rounded-lg focus:outline-none ${isValid
                    ? 'border-gray-600 focus:ring-blue-500'
                    : 'border-red-500 focus:ring-red-500'}`, name: "email", type: "email", value: value || '', onChange: onChange, onBlur: onBlur, onFocus: onFocus, required: true }), !isValid && _jsx("p", { className: "mt-1 text-sm text-red-400", children: "Please enter a valid email" }), isEmailAlreadyUsed && (_jsx("p", { className: "mt-1 text-sm text-red-400", children: "This email is already in use" }))] }));
}
