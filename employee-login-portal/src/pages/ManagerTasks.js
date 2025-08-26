import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function ManagerTasks() {
  const managerId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");
  const [managerName, setManagerName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch updated profile info and pending leaves on mount
  useEffect(() => {
    if (!managerId || !token) {
      console.error("Manager ID or token not found. Redirecting to login.");
      navigate("/login");
      return;
    }

    const fetchLeaves = async () => {
      setLoading(true);
      setApiError("");
      try {
        const res = await fetch(`http://localhost:8082/leaves/manager/${managerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const managerData = await res.json();
        const sortedData = managerData.sort((a, b) => b.id - a.id);
        setPendingLeaves(sortedData);
      } catch (err) {
        console.error("Failed to fetch leaves:", err);
        setApiError("Failed to load leaves. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8082/profile/${managerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch profile info");
        const data = await res.json();
        if (data.profilePic) {
          setProfilePic(data.profilePic);
          localStorage.setItem("employeeProfilePic", data.profilePic);
        }
        if (data.name) {
          setManagerName(data.name);
          localStorage.setItem("employeeName", data.name);
        }
      } catch (err) {
        console.error("Failed to fetch profile info:", err);
      }
    };

    fetchLeaves();
    fetchProfile();
  }, [managerId, token, navigate]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Sidebar and Topbar Handlers
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("name", managerName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`http://localhost:8082/profile/update/${managerId}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully! ✨");
        setTimeout(() => { setSuccessMessage(""); setProfileOpen(false); }, 2000);
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setApiError("Error uploading profile picture. See console for details.");
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    let remarks = "Approved by manager.";
    if (action === 'Reject') {
      remarks = prompt("Please enter a reason for rejection:");
      if (!remarks || remarks.trim().length < 10) {
        alert("Rejection reason must be at least 10 characters long.");
        return;
      }
    }

    const actionDTO = {
      leaveRequestId: leaveId,
      approverId: managerId,
      action: action,
      role: "Manager",
      remarks: remarks,
    };

    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("http://localhost:8082/leaves/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(actionDTO),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      const updatedLeave = await res.json();

      if (updatedLeave.status !== 'Pending') {
        setPendingLeaves(prev => prev.filter(l => l.id !== updatedLeave.id));
      } else {
        setPendingLeaves(prev => prev.map(l => l.id === updatedLeave.id ? updatedLeave : l));
      }

      setSuccessMessage(`Leave request ${action.toLowerCase()}ed successfully! ✅`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error taking action on leave:", error);
      setApiError(`Failed to ${action.toLowerCase()} leave: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
      case 'Approved by Manager': return '#4BB543';
      case 'Pending': return '#FFC107';
      case 'Rejected': return '#FF4136';
      case 'Cancelled': return '#6c757d'; // added cancelled color
      default: return '#000';
    }
  };

  const filteredLeaves = useMemo(() => {
    if (!searchTerm) {
      return pendingLeaves;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    return pendingLeaves.filter(leave => {
      return (
        String(leave.employeeId).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.id).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.type).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.startDate).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.endDate).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.totalDays).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.reason).toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.fileName || '').toLowerCase().includes(lowercasedSearchTerm) ||
        String(leave.status).toLowerCase().includes(lowercasedSearchTerm)
      );
    });
  }, [pendingLeaves, searchTerm]);

const renderTable = (leaves, showActions = false) => (
  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
    <div style={{ overflowY: 'auto', maxHeight: '500px', width: '100%', border: '1px solid #ddd' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff',backgroundColor: '#4c82d3' }}>Employee ID</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Leave ID</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Leave Type</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>Start Date</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>End Date</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Total Days</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Reason</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>Uploaded File</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff' , backgroundColor: '#4c82d3'}}>Status</th>
            {showActions && (
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#ffffff', backgroundColor: '#4c82d3' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.employeeId}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.id}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.type}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.startDate}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.endDate}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.totalDays}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.reason}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                {leave.fileName ? (
                  <a
                    href={`http://localhost:8082/leaves/download/${leave.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                  >
                    Leave Document
                  </a>
                ) : (
                  <span>No File</span>
                )}
              </td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                <span style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    color: '#fff',
                    backgroundColor: getStatusColor(leave.status),
                    fontWeight: 'bold',
                    fontSize: '12px',
                }}>{leave.status}</span>
              </td>
              {showActions && (
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {leave.status === 'Pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button onClick={() => handleLeaveAction(leave.id, 'Approve')} style={{
                            padding: '8px 12px', fontSize: '14px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer'
                        }}>Approve</button>
                        <button onClick={() => handleLeaveAction(leave.id, 'Reject')} style={{
                            padding: '8px 12px', fontSize: '14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer'
                        }}>Reject</button>
                      </div>
                    ) : leave.status === 'Cancelled' ? (
                      <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Cancelled</span>
                    ) : null}
                  </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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
              style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }}
            />
            <h3>
              <Link to="/hom" className="hom" style={{ textDecoration: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Favourites
                  <img
                    src={require("../assets/star4.png")}
                    alt="office"
                    style={{ width: '22px', height: '22px' }}
                  />
                </span>
              </Link>
            </h3>
            <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none' }}>Claims</Link></h3>
            <h3><Link to="/home1" className="side" style={{ textDecoration: 'none' }}>Attendance</Link></h3>
            <h3><Link to="/home2" className="side" style={{ textDecoration: 'none' }}>Employee Handbook</Link></h3>
            <h3><Link to="/home3" className="side" style={{ textDecoration: 'none' }}>Employee Directory</Link></h3>
            <h3><Link to="/home4" className="side" style={{ textDecoration: 'none' }}>Exit Management</Link></h3>
            <h3><Link to="/home5" className="side" style={{ textDecoration: 'none' }}>Holiday Calendar</Link></h3>
            <h3><Link to="/home6" className="side" style={{ textDecoration: 'none' }}>Helpdesk</Link></h3>
            <h3><Link to="/home7" className="side" style={{ textDecoration: 'none' }}>Leaves</Link></h3>
            <h3><Link to="/home8" className="side" style={{ textDecoration: 'none' }}>Notifications</Link></h3>
            <h3><Link to="/home9" className="side" style={{ textDecoration: 'none' }}>Pay slips</Link></h3>
            <h3><Link to="/home10" className="side" style={{ textDecoration: 'none' }}>Performance</Link></h3>
            <h3><Link to="/home11" className="side" style={{ textDecoration: 'none' }}>Training</Link></h3>
            <h3><Link to="/home12" className="side" style={{ textDecoration: 'none' }}>Travel</Link></h3>
          </>
        ) : (
          <div className="collapsed-wrapper">
            <img
              src={require("../assets/Group.png")}
              alt="expand"
              className="collapsed-toggle"
              onClick={toggleSidebar}
            />
          </div>
        )}
      </div>
      <div className="main-content">
        {/* Top Header */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {managerName} ({managerId})</h2>
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
            <div className="profile-wrapper" ref={profileDropdownRef} style={{ position: 'relative' }}>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-pic"
                onClick={toggleProfileMenu}
                style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              {profileOpen && (
                <div
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
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {/* Manager Tasks Content */}
        <div style={{ padding: '20px' }}>
          <h2>Manager Leave Requests</h2>
          {loading && <div>Loading...</div>}
          {apiError && <div className="error-message" style={{ color: 'red' }}>{apiError}</div>}
          {successMessage && <div className="success-message" style={{ color: 'green' }}>{successMessage}</div>}

          {filteredLeaves.length > 0 ? (
            renderTable(filteredLeaves, true)
          ) : (
            <p>No leave requests found.</p>
          )}
        </div>
      </div>

    </div>
  );
}

export default ManagerTasks;