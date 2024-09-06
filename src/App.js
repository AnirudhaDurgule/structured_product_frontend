import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
import Maker from './Maker';
import Checker from './Checker';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState('');
  const [user_id, setUser_id] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storeuser_id = localStorage.getItem('user_id');

    if (token && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
      setUser_id(storeuser_id);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'Maker') {
        navigate('/maker');
      } else if (role === 'Checker') {
        navigate('/checker');
      }
    } else {
      navigate('/signin');
    }
  }, [isAuthenticated, role]);

  return (
    <div className="App">
      <Routes>
        <Route path="/signin" element={<SignIn setIsAuthenticated={setIsAuthenticated} setRole={setRole} />} />
        <Route
          path="/maker"
          element={isAuthenticated && role === 'Maker' ? <Maker /> : <Navigate to="/signin" />}
        />
        <Route
          path="/checker"
          element={isAuthenticated && role === 'Checker' ? <Checker /> : <Navigate to="/signin" />}
        />
        <Route path="/" element={<Navigate to="/signin" />} />
      </Routes>
    </div>
  );
}

export default App;
