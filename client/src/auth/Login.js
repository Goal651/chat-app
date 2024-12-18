import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
export default function Login({ serverUrl }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const token = localStorage.getItem("token");
    useEffect(() => {
        if (token) {
            const checkUser = async () => {
                try {
                    const res = await axios.get(`${serverUrl}/api/auth`, {
                        headers: { accesstoken: token },
                    });
                    if (res.status === 200)
                        navigate("/chat");
                }
                catch {
                    localStorage.clear();
                    sessionStorage.clear();
                }
            };
            checkUser();
        }
    }, [token, serverUrl, navigate]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        const ref = name === "email" ? emailRef : passwordRef;
        ref.current?.classList.remove("border-red-500", "focus:ring-red-500");
    };
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
        return emailRegex.test(email);
    };
    const handleBlur = (e) => {
        const { name, value } = e.target;
        const ref = name === "email" ? emailRef : passwordRef;
        if (name === "email") {
            if (!value.trim() || !validateEmail(value)) {
                ref.current?.classList.add("border-red-500", "focus:ring-red-500");
            }
        }
        else if (!value.trim()) {
            ref.current?.classList.add("border-red-500", "focus:ring-red-500");
        }
    };
    const handleFocus = (e) => {
        const ref = e.target.name === "email" ? emailRef : passwordRef;
        ref.current?.classList.remove("border-red-500", "focus:ring-red-500");
    };
    const validateInputs = () => {
        const emailValid = formData.email.trim() !== "" && validateEmail(formData.email);
        const passwordValid = formData.password.trim() !== "";
        if (!emailValid)
            emailRef.current?.classList.add("border-red-500", "focus:ring-red-500");
        if (!passwordValid)
            passwordRef.current?.classList.add("border-red-500", "focus:ring-red-500");
        return emailValid && passwordValid;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateInputs())
            return;
        setLoading(true);
        try {
            const { data } = await axios.post(`${serverUrl}/api/login`, formData);
            localStorage.setItem("token", data.accessToken);
            navigate("/chat");
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (!error.response) {
                    navigate("/no-internet");
                    return;
                }
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "flex justify-center items-center min-h-screen bg-gray-800", children: _jsxs("div", { className: "w-full max-w-md p-8 space-y-6 bg-gray-700 rounded-lg", children: [_jsx("h2", { className: "text-2xl font-bold text-center text-white", children: "Login" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-300", children: "Email" }), _jsx("input", { type: "email", id: "email", name: "email", placeholder: "john.doe@example.com", ref: emailRef, value: formData.email, onChange: handleInputChange, onBlur: handleBlur, onFocus: handleFocus, className: "w-full p-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-300", children: "Password" }), _jsx("input", { type: "password", id: "password", name: "password", placeholder: "********", ref: passwordRef, value: formData.password, onChange: handleInputChange, onBlur: handleBlur, onFocus: handleFocus, className: "w-full p-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { type: "submit", className: `w-full py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md ${loading ? "cursor-not-allowed opacity-50" : ""}`, disabled: loading, children: loading ? "Logging in..." : "Login" })] }), _jsx(Link, { to: "/signup", className: "block mt-4 text-center text-blue-400", children: "Don\u2019t have an account? Sign Up" })] }) }));
}
