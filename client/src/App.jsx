import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import './App.css';
const Test = lazy(() => import('./pages/Testing'))
const ErrorPage = lazy(() => import('./pages/Error'))
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NotFound = lazy(() => import('./pages/Build'));

export default function App() {
  const isMobile = useMediaQuery({ query: '(max-width: 800px)' });
  return (
    <div className="h-screen overflow-hidden">
      <Router>
        <Suspense fallback={
          <div className='h-screen flex justify-center bg-slate-900'>
            <span className='loading loading-infinity h-screen bg-white'></span>
          </div>
        }>
          <Routes>
            <Route path='/login' element={<Login isMobile={isMobile} />} />
            <Route path='/signup' element={<Signup isMobile={isMobile} />} />
            <Route path='/' element={<Dashboard isMobile={isMobile} />} />
            <Route path='/chat/:friend_name' element={<Dashboard isMobile={isMobile} />} />
            <Route path='/group/:group_name' element={<Dashboard isMobile={isMobile} />} />
            <Route path='/:type' element={<Dashboard isMobile={isMobile} />} />
            <Route path='*' element={<NotFound />} />
            <Route path='/testing' element={<Test />} />
            <Route path='/error' element={<ErrorPage />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}


