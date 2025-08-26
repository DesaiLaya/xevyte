import React, { useState, useEffect, useRef } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import ManagerDashBoard from "./ManagerDashBoard";
import FinanceDashboard from "./FinanceDashboard";
import HRDashboard from "./HRDashboard";
import "./ManagerDashboard.css";
import "./Dashboard.css";

function MyTasks() {
  const employeeId = localStorage.getItem("employeeId");
  const role = localStorage.getItem("role");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");  // <-- NEW
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null); // <-- NEW: ref for dropdown container
  const navigate = useNavigate();

  // Fetch profile info on mount to update profilePic and employeeName if needed
  useEffect(() => {
    if (employeeId) {
      fetch(`http://localhost:8082/profile/${employeeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem("employeeProfilePic", data.profilePic);
          }
          if (data.name) {
            setEmployeeName(data.name);
            localStorage.setItem("employeeName", data.name);
          }
        })
        .catch(err => {
          console.error("Failed to fetch profile info:", err);
        });
    }
  }, [employeeId]);

  // NEW: Close profile dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login"); // Adjust this path as per your app routing
  };

  // Open file dialog for profile pic update
  const handleEditProfile = () => {
    setProfileOpen(false);
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("name", employeeName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`http://localhost:8082/profile/update/${employeeId}`, {
        method: "PUT",
        body: formData,
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);

        // Show success message instead of alert
        setSuccessMessage("Profile picture updated successfully!");

        // Hide message and close dropdown after 2 seconds
        setTimeout(() => {
          setSuccessMessage("");
          setProfileOpen(false);
        }, 2000);

      } else {
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };

  if (role === "Manager") {
    return <ManagerDashBoard employeeId={employeeId} />;
  } else if (role === "Finance") {
    return <FinanceDashboard employeeId={employeeId} />;
  } else if (role === "Hr") {
    return <HRDashboard employeeId={employeeId} />;
  } else {
    return (
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          {!isCollapsed ? (
            <>
              <img
                src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
                alt="office"
                className="office-vng"
              />
              <img
                src={require("../assets/gg_move-left.png")}
                alt="collapse"
                className="toggle-btn"
                onClick={toggleSidebar}
                style={{ width: '35px', height: '35px', top:'76px', marginLeft:"200px" }}
              />
              <h3>
                <Link to="/hom" className="hom" style={{ textDecoration: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Favourites
                    <img
                      src={require("../assets/star4.png")}
                      alt="star"
                      style={{ width: '22px', height: '22px' }}
                    />
                  </span>
                </Link>
              </h3>
              <h3><Link to="/home0" className="hom" style={{ textDecoration:'none', color:'white' }}>Claims</Link></h3>
              <h3><Link to="/home1" className="side" style={{ textDecoration:'none' }}>Attendance</Link></h3>
              <h3><Link to="/home2" className="side" style={{ textDecoration:'none' }}>Employee Handbook</Link></h3>
              <h3><Link to="/home3" className="side" style={{ textDecoration:'none' }}>Employee Directory</Link></h3>
              <h3><Link to="/home4" className="side" style={{ textDecoration:'none' }}>Exit Management</Link></h3>
              <h3><Link to="/home5" className="side" style={{ textDecoration:'none' }}>Holiday Calendar</Link></h3>
              <h3><Link to="/home6" className="side" style={{ textDecoration:'none' }}>Helpdesk</Link></h3>
              <h3><Link to="/home7" className="side" style={{ textDecoration:'none' }}>Leaves</Link></h3>
              <h3><Link to="/home8" className="side" style={{ textDecoration:'none' }}>Notifications</Link></h3>
              <h3><Link to="/home9" className="side" style={{ textDecoration:'none' }}>Pay slips</Link></h3>
              <h3><Link to="/home10" className="side" style={{ textDecoration:'none' }}>Performance</Link></h3>
              <h3><Link to="/home11" className="side" style={{ textDecoration:'none' }}>Training</Link></h3>
              <h3><Link to="/home12" className="side" style={{ textDecoration:'none' }}>Travel</Link></h3>
            </>
          ) : (
            <div className="collapsed-wrapper">
              <img
                src={require("../assets/Group.png")} // replace with your actual right-arrow image
                alt="expand"
                className="collapsed-toggle"
                onClick={toggleSidebar}
              />
            </div>
          )}
        </div>

        <div className="manager-dashboard">
          <div className="dashboard-header">
            <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Welcome, {employeeName} ({employeeId})</h2>

              <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <img
                  src={require('../assets/Vector.png')}
                  alt="Notifications"
                  className="icon"
                  style={{ cursor: 'pointer' }}
                />

                {/* Profile picture with dropdown */}
                <div className="profile-wrapper" style={{ position: 'relative' }}>
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="profile-pic"
                    onClick={toggleProfileMenu}
                    style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {profileOpen && (
                    <div
                      ref={profileDropdownRef} // <-- assign ref here
                      className="profile-dropdown"
                      style={{
                        position: 'absolute',
                        top: '50px',
                        right: '0',
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        borderRadius: '4px',
                        zIndex: 1000,
                        width: '150px',
                      }}
                    >
                      <button
                        onClick={handleEditProfile}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}

                  {/* Success message */}
                  {successMessage && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '5px',
                      backgroundColor: '#4BB543',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      zIndex: 1100,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {successMessage}
                    </div>
                  )}

                </div>

                {/* Hidden file input for profile pic upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <hr className="divider-line" />
          </div>

          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>You do not have any pending actions.</h2>
          </div>
        </div>
      </div>
    );
  }
}

export default MyTasks;
