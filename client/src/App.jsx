import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Login = lazy(() => import('./pages/login'));
const Signup = lazy(() => import('./pages/signup'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const NotFound = lazy(() => import('./pages/construction'));

function App() {
  return (
    <div className="App">
      <Router>
        <Suspense fallback={<div className='h-screen flex justify-center bg-slate-900'>
          <span className='loading loading-spinner h-screen bg-white'></span>
        </div>}>
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/' element={<Dashboard />} />
            <Route path='/chat/:user' element={<Dashboard />} />
            <Route path='/group/:name' element={<Dashboard />} />
            <Route path='/:type' element={<Dashboard />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
