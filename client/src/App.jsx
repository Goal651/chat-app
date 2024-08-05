import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import './App.css';
import Test from './pages/testing';
import ErrorPage from './pages/500_error';

const Login = lazy(() => import('./pages/login'));
const Signup = lazy(() => import('./pages/signup'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const NotFound = lazy(() => import('./pages/construction'));

function App() {
  const isMobile = useMediaQuery({ query: '(max-width: 760px)' });

  return (
    <div className="h-screen">
      <Router>
        <Suspense fallback={
          <div className='h-screen flex justify-center bg-slate-900'>
            <span className='loading loading-spinner h-screen bg-white'></span>
          </div>
        }>
          <Routes>
            <Route path='/login' element={<Login isMobile={isMobile}/>} />
            <Route path='/signup' element={<Signup isMobile={isMobile}/>} />
            <Route path='/' element={<Dashboard isMobile={isMobile} />} />
            <Route path='/chat/:user' element={<Dashboard isMobile={isMobile} />} />
            <Route path='/group/:name' element={<Dashboard isMobile={isMobile} />} />
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

export default App;
