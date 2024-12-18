import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const NetworkChecker = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [serverStatus, setServerStatus] = useState("unknown");
    const checkServerStatus = async () => {
        try {
            await axios.get("http://localhost:3001/api/ping", { timeout: 5000 });
            setServerStatus("up");
        }
        catch {
            setServerStatus("down");
        }
    };
    useEffect(() => {
        const checkInternetStatus = () => {
            if (navigator.onLine) {
                setIsOnline(true);
                checkServerStatus();
            }
            else {
                setIsOnline(false);
                setServerStatus("unknown");
            }
        };
        // Initial check
        checkInternetStatus();
        // Set up a continuous ping every 5 seconds
        const interval = setInterval(() => {
            if (navigator.onLine) {
                checkServerStatus();
            }
            else {
                setServerStatus("unknown");
            }
        }, 5000); // Adjust the interval time (in milliseconds) as needed
        // Handle online/offline events
        window.addEventListener("online", checkInternetStatus);
        window.addEventListener("offline", checkInternetStatus);
        return () => {
            clearInterval(interval); // Cleanup on unmount
            window.removeEventListener("online", checkInternetStatus);
            window.removeEventListener("offline", checkInternetStatus);
        };
    }, []); // Empty dependency array ensures this effect runs only once when the component is mounted
    useEffect(() => {
        if (isOnline && serverStatus === "up") {
            // Both internet and server are online, navigate to '/'
            navigate("/");
        }
    }, [isOnline, serverStatus, navigate]); // React to changes in internet and server status
    return (_jsxs("div", { className: "min-h-screen flex flex-col justify-center items-center bg-slate-950 text-white text-center", children: [_jsx("h1", { className: "text-4xl font-bold", children: isOnline ? "Internet Connected" : "No Internet Connection" }), _jsx("p", { className: "mt-4 text-gray-400", children: isOnline
                    ? serverStatus === "up"
                        ? "Server is running"
                        : "Server is down"
                    : "Unable to check the server while offline." }), _jsx("div", { className: "mt-8", children: _jsx("span", { className: `px-4 py-2 rounded-md ${isOnline
                        ? serverStatus === "up"
                            ? "bg-green-500"
                            : "bg-red-500"
                        : "bg-gray-500"}`, children: isOnline
                        ? serverStatus === "up"
                            ? "Server Status: Up"
                            : "Server Status: Down"
                        : "Offline" }) })] }));
};
export default NetworkChecker;
