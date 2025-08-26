import React, { useState } from 'react';
import axios from 'axios';
import "./Login.css";
import { Link, useNavigate } from 'react-router-dom';
 
function ForgotPassword() {
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear old errors
 
    try {
      const res = await axios.post('http://localhost:8082/api/auth/forgot-password', {
        employeeId: employeeId.trim(),
      });
 
      if (res.status === 200) {
        navigate('/reset-link-sent');
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("❌ Invalid Employee ID. Please try again.");
      } else {
        setError("❌ Server error. Try again later.");
      }
    }
  };
 
  return (
    <div className="login-page">
      <div className="container">
        <div className="left-side">
          <div className="logo-container">
            <img
              src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
              alt="Xevyte Logo"
              className="xevyte-logo"
            />
          </div>
          <img
            src={require("../assets/forgot.jpg")}
            alt="office"
            className="office-img"
          />
        </div>
 
        <div className="right-side">
          <div className="for-container1">
            <h3>Forgot Password</h3>
            <p className="single-line">
              Forgot your password? Let's reset and help you remember it.
            </p>
           
            <form onSubmit={handleSubmit}>
              <label htmlFor="EmployeeId">Employee ID</label>
              <input type="text"
                value={employeeId}
                placeholder="Enter Id"
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
             
              <button className="cor" type="submit">Send Reset Link</button>
              <Link to="/login" className="back-link">
                <u>Back to Sign in</u>
              </Link>
            </form>
            {error && <p className="error-msg">{error}</p>}
          </div>
         
        </div>
      </div>
    </div>
  );
}
 
export default ForgotPassword;