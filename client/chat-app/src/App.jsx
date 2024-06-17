/* eslint-disable no-unused-vars */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/login';
import Chat from './pages/dms';
import Signup from './pages/signup';
import GroupArea from './pages/groups';
import Dashboard from './pages/dashboard';
import NotFound from './pages/construction';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/' element={<Dashboard />} />
          <Route path='/chat/:params' element={<Dashboard/>} />
          <Route path='/group' element={<GroupArea />} />
          <Route path='*' element={<NotFound/>}></Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
