import './index.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import SocketConfig from './config/SocketConfig'
import LoadingPage from './main/LoadingPage'

const Dashboard = lazy(() => import('./main/Dashboard'))
const Auth = lazy(() => import('./auth/Auth'))
const NetworkChecker = lazy(() => import('./error/NetworkChecker'))
const LoginPage = lazy(() => import('./auth/Login'))
const SignUpPage = lazy(() => import('./auth/Signup'))
const FileUploaderTest = lazy(() => import('./test/Tester'))
const PageNotFound = lazy(() => import('./error/PageNotFound'))

export default function App() {
  const serverUrl = 'http://localhost:3001'
  const socket = SocketConfig()
  return (
    <Router>
      <Suspense fallback={<div><LoadingPage /></div>}>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard socket={socket} />} />
          <Route path="/no-internet" element={<NetworkChecker />} />
          <Route path="/login" element={<LoginPage serverUrl={serverUrl} />} />
          <Route path='/signup' element={<SignUpPage serverUrl={serverUrl} />} />
          <Route path='/test' element={<FileUploaderTest />} />
          <Route path='*' element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}