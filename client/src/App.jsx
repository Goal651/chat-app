/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/login';
import Chat from './pages/dms';
import Signup from './pages/signup';
import GroupArea from './pages/groups';
import Dashboard from './pages/dashboard';
import NotFound from './pages/construction';
import FileDisplay from './pages/test';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/' element={<Dashboard />} />
          <Route path='/chat/:params' element={<Dashboard />} />
          <Route path='/group/:name' element={<Dashboard />} />
          <Route path='/:type' element={<Dashboard />} />
          <Route path='/testing' element={<FileDisplay />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
