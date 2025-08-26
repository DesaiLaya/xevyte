// ResetLinkSent.js
import React from "react";
import { Link } from "react-router-dom";
import "./ResetLinkSent.css";

const ResetLinkSent = () => {
  return (
    <div className="reset-link-container">
      <div className="left-side">
      <div className="logo-container">
          <img
            src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
            alt="Xevyte Logo"
            className="xevyte-logo"
          />
        </div>
        
        <img src={require("../assets/email.jpg")}
        alt="Check Email"
        className="office-image" />
    
      </div>

      <div className="message-section">
        <img src={require("../assets/image10.jpg")} alt="Mail Icon" className="mail-icon" />
        <h2>Check your email</h2>
        <p>
          A password reset link has been sent to your registered email address.
          Please check your inbox to proceed.
        </p>
        <Link to="/login" className="back-link">
          <u>Back to Sign In</u>
        </Link>
      </div>
    </div>
    
  );
};

export default ResetLinkSent;