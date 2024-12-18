import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
const PageNotFound = () => {
    const navigate = useNavigate();
    const goToHome = () => {
        navigate('/');
    };
    return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center", children: [_jsx("h1", { className: "text-9xl font-bold text-gray-400", children: "404" }), _jsx("h2", { className: "text-4xl font-semibold text-gray-600 mt-4", children: "Page Not Found" }), _jsx("p", { className: "text-gray-500 mt-2", children: "Sorry, the page you're looking for doesn't exist or has been moved." }), _jsx("button", { onClick: goToHome, className: "mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition", children: "Go to Home" })] }));
};
export default PageNotFound;
