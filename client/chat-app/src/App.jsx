/* eslint-disable no-unused-vars */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import DMArea from './elements/dm';
import Dashboard from './elements/homePage';
import Login from './elements/login';
import CreateGroup from './components/createGroup';
import JoinGroup from './components/joinGroup';
import Signup from './elements/signup';
import GroupArea from './elements/groupArea';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/home' element={<Dashboard />} />
          <Route path='/chat/:receiver' element={<DMArea />} />
          <Route path='/joinGroup' element={<JoinGroup />} />
          <Route path='/createGroup' element={<CreateGroup />} />
          <Route path='/group' element={<GroupArea />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
