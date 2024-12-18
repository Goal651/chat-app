import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.css';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SocketConfig from './config/SocketConfig';
import LoadingPage from './main/LoadingPage';
const Dashboard = lazy(() => import('./main/Dashboard'));
const Auth = lazy(() => import('./auth/Auth'));
const NetworkChecker = lazy(() => import('./error/NetworkChecker'));
const LoginPage = lazy(() => import('./auth/Login'));
const SignUpPage = lazy(() => import('./auth/Signup'));
const FileUploaderTest = lazy(() => import('./test/Tester'));
const PageNotFound = lazy(() => import('./error/PageNotFound'));
export default function App() {
    const serverUrl = 'http://localhost:3001';
    const socket = SocketConfig();
    return (_jsx(Router, { children: _jsx(Suspense, { fallback: _jsx("div", { children: _jsx(LoadingPage, {}) }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Auth, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, { socket: socket }) }), _jsx(Route, { path: "/no-internet", element: _jsx(NetworkChecker, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, { serverUrl: serverUrl }) }), _jsx(Route, { path: '/signup', element: _jsx(SignUpPage, { serverUrl: serverUrl }) }), _jsx(Route, { path: '/test', element: _jsx(FileUploaderTest, {}) }), _jsx(Route, { path: '*', element: _jsx(PageNotFound, {}) })] }) }) }));
}
