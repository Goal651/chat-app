import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaCamera, FaLink, FaMicrophone } from "react-icons/fa";
import { FaFaceLaugh } from "react-icons/fa6";
export default function Sender() {
    return (_jsxs("div", { className: "flex w-full space-x-4", children: [_jsxs("div", { className: "flex space-x-4 bg-slate-700 w-full p-4 rounded-lg", children: [_jsx("div", { className: "", children: _jsx(FaLink, { className: "text-white w-4 h-4" }) }), _jsx("input", { type: 'text', placeholder: "message...", className: "bg-transparent w-full placeholder:text-gray-400 outline-0 text-white" }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(FaFaceLaugh, { className: "text-white" }), _jsx(FaCamera, { className: "text-white" })] })] }), _jsx("div", { className: "", children: _jsx("button", { className: "btn bg-blue-500 border-0 flex items-center", children: _jsx(FaMicrophone, { className: " text-xl text-black" }) }) })] }));
}
