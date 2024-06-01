/* eslint-disable no-unused-vars */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Chat from './elements/chatF';
import Login from './elements/login';
import CreateGroup from './components/createGroup';
import JoinGroup from './components/joinGroup';
import Signup from './elements/signup';
import GroupArea from './elements/groupArea';
import Dashboard from './elements/dashboard';
import NotFound from './elements/construction';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/' element={<Dashboard />} />
          <Route path='/chat/:receiver' element={<Chat />} />
          <Route path='/chat/' element={<Chat />} />
          <Route path='/group' element={<GroupArea />} />
          <Route path='*' element={<NotFound/>}></Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
