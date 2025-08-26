import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';
 
 
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
 
  const [newPassword, setnewPassword] = useState('');
 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
 
  const handleReset = async (e) => {
    e.preventDefault();
 
    if (!newPassword || !confirmPassword) {
      setMessage("❌ Please fill in all fields.");
      return;
    }
 
    if (newPassword !== confirmPassword) {
      setMessage("❌ The passwords you entered do not match. Please re-enter them.");
      return;
    }
 
    try {
      const response = await axios.post('http://localhost:8082/api/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
 
      // ✅ Only redirect if response is success (status 200)
      if (response.status === 200) {
        setMessage("✅ " + response.data.message);
 
        setTimeout(() => {
          navigate('/password-reset-success');
        }, 2000);
      } else {
        setMessage("❌ " + response.data.message);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Server error. Please try again.";
      setMessage("❌ " + errorMsg);
    }
  };
 
  return (
    <div className="reset-page">
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
            src={require("../assets/reset.jpg")}
            alt="office"
            className="office-img"
          />
        </div>
 
        <div className="right-side">
          <div className="for-container">
            <h3 className="fon">Reset Password</h3>
            <p className="single-line">Enter your new password below.</p>
            <form onSubmit={handleReset}>
           <label htmlFor="password">New Password</label>
              <input type="password" required id="password" name="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setnewPassword(e.target.value)}
               
           
              />
             
 
              <label>Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
 
              <button className="cor" type="submit">Reset Password</button>
            </form>
            {message && <p className="error-msg">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default ResetPassword;