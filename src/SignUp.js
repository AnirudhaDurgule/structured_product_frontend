import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    const response = await signUpAPI({ email, fullname, password });
    if (response.status === 'success') {
      window.alert('Registration successful');
      navigate('/signin');
    } else {
      window.alert('Registration failed');
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSignUp}>
        <h2>Sign Up</h2>
        <div>
          <label>Full Name:</label>
          <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

const signUpAPI = async ({ email, fullname, password }) => {
  try {
    const response = await fetch('http://172.16.47.87:8000/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, fullname, password, generate_token: true }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during sign-up:', error);
    return { status: 'error', message: 'Signup failed' };
  }
};

export default SignUp;
