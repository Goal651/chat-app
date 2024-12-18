import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const LoadingPage = () => {
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-slate-800", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "animate-spin rounded-full h-24 w-24 border-t-4 border-blue-500 border-opacity-75" }), _jsx("p", { className: "text-gray-500 mt-6 text-lg font-semibold", children: "Loading, please wait..." })] }) }));
};
export default LoadingPage;
