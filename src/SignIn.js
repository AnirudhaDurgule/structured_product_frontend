import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css';
import logo from "../src/arathi-logo.png";

const SignIn = ({ setIsAuthenticated, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    const response = await fetch('http://172.16.47.87:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("1999", data.message);

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.data.user.role);
      localStorage.setItem('user_id', data.user_id);
      setIsAuthenticated(true);
      setRole(data.data.user.role);

      if (data.data.user.role === 'Maker') {
        navigate('/maker');
      } else if (data.data.user.role === 'Checker') {
        navigate('/checker');
      }
    } else {
      window.alert(data.message);
    }
  };

  return (
    <div className="login-main-page">
      <div className="login-wrapper">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img style={{ height: "100px", width: "400px" }} src={logo}></img>

      <h1>Structured Product Master App</h1>
      <br/>
      <div className="App">
        <form className="form-container" onSubmit={handleSignIn}>
          <h2>Sign In</h2>
          <br/>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit">Sign In</button>
          <div>
            {/* <p>Don't have an account? <Link to="">Contact To Admin</Link></p>  */}
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default SignIn;
