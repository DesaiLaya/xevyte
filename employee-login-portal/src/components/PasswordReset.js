// File: PasswordReset.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordReset.css";

function PasswordReset() {
  const navigate = useNavigate();

  return (
    <div className="password-changed-container">
      <div className="left-side">
        <div className="logo-container">
          <img
            src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
            alt="Xevyte Logo"
            className="xevyte-logo"
          />
        </div>
        <img
          src={require("../assets/password.jpg")}
          alt="Password Visual"
          className="office-img"
        />
      </div>

      <div className="right-section">
        <img
          src={require("../assets/image.jpg")}
          alt="Success"
          className="check-image"
        />
        <div className="content">
          <h2>Password changed</h2>
          <p>
            Your password has been reset successfully. Please wait for 15 minutes before sign in with your new password.
          </p>
          <button onClick={() => navigate("/login")}>Back To Sign In</button>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;