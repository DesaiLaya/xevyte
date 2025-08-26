import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SessionTimeoutHandler = ({ children }) => {
  const navigate = useNavigate();
  const timeoutDuration = 15 * 60 * 1000; // 15 minutes
  const timeoutId = useRef(null); // ✅ useRef instead of let

  // Logout function
  const logout = useCallback(() => {
    localStorage.clear();
    alert("You have been logged out due to 15 minutes of inactivity.");
    navigate("/login");
  }, [navigate]); // ✅ include navigate in dependency

  // Reset timer on user activity
  const resetTimer = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(logout, timeoutDuration);
  }, [logout, timeoutDuration]); // ✅ include logout

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    // Attach all events
    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer(); // Start timer on mount

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [resetTimer]); // ✅ use resetTimer as dependency

  return children;
};

export default SessionTimeoutHandler;
