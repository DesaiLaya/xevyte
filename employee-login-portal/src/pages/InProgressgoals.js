import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

function EmployeeGoalDetails() {
  // ===== Sidebar / Topbar state & logic (from Performance) =====
  const employeeIdFromStorage = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (employeeIdFromStorage) {
      fetch(`http://localhost:8082/profile/${employeeIdFromStorage}`)
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
        .catch(err => console.error("Failed to fetch profile info:", err));
    }
  }, [employeeIdFromStorage]);

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
    formData.append("name", employeeName);
    formData.append("profilePic", file);

    try {
      const res = await fetch(`http://localhost:8082/profile/update/${employeeIdFromStorage}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully!");
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

  // ===== Original EmployeeGoalDetails state & logic =====
  const location = useLocation();
  const thStyle = { padding: '8px',backgroundColor:"darkblue" };
  const tdStyle = { padding: '8px' };

  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});

  const toggleComments = async (goalId) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));

    if (comments[goalId]) return;

    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found');

      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }

      const token = `Bearer ${rawToken}`;
      const response = await fetch(`http://localhost:8082/api/goals/${goalId}/comments`, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch comments: ${response.status} - ${text}`);
      }

      const data = await response.json();
      setComments(prev => ({ ...prev, [goalId]: data }));
    } catch (error) {
      console.error(error.message);
      setComments(prev => ({ ...prev, [goalId]: [] }));
    }
  };

  useEffect(() => {
    if (location.state?.employeeId && location.state.employeeId !== employeeId) {
      setEmployeeId(location.state.employeeId);
    }
  }, [location.state?.employeeId, employeeId]);

  useEffect(() => {
    if (employeeId) {
      localStorage.setItem('selectedEmployeeId', employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) {
      setError('Selected employee ID not found.');
      setLoading(false);
      return;
    }

    const fetchEmployeeGoals = async () => {
      try {
        let rawToken = localStorage.getItem('token');

        if (!rawToken) {
          throw new Error('No token found in localStorage. Please login.');
        }

        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;
        const response = await fetch(`http://localhost:8082/api/goals/employee/${employeeId}`, {
          method: 'GET',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching goals: ${response.status} - ${text}`);
        }

        const data = await response.json();
        setGoals(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeGoals();
  }, [employeeId]);

  const pendingGoals = goals.filter(goal => goal.status?.toLowerCase() === 'in progress');

  // New: Filter goals based on the search term
  const filteredGoals = pendingGoals.filter(goal => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (goal.goalId && String(goal.goalId).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.status && goal.status.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.startDate && goal.startDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.endDate && goal.endDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.targetDate && goal.targetDate.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.quarter && goal.quarter.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.metric && String(goal.metric).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.target && String(goal.target).toLowerCase().includes(lowerCaseSearchTerm)) ||
      // Check for comments if they exist
      (comments[goal.goalId]?.some(comment => comment.commentText.toLowerCase().includes(lowerCaseSearchTerm)))
    );
  });

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
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
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeIdFromStorage})</h2>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" style={{ cursor: 'pointer' }} />

            <div className="profile-wrapper" style={{ position: 'relative' }}>
              <img src={profilePic} alt="Profile" className="profile-pic" onClick={toggleProfileMenu} style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              {profileOpen && (
                <div ref={profileDropdownRef} className="profile-dropdown" style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', zIndex: 1000, width: '150px' }}>
                  <button onClick={handleEditProfile} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Logout</button>
                </div>
              )}
              {successMessage && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  {successMessage}
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {/* Original EmployeeGoalDetails workflow */}
        <div style={{ padding: '20px' }}>
          <div
            className="header"
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2>
              Goals for Employee ID:{' '}
              <span style={{ backgroundColor: 'yellow' }}>{employeeId}</span>
            </h2>
            <button
              className="back-button"
              onClick={() => navigate(-1)}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                backgroundColor: '#007BFF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
          </div>

          {loading && <p>Loading goals...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!loading && !error && filteredGoals.length === 0 && (
            <p>No pending goals found for this employee matching your search criteria.</p>
          )}

          {!loading && !error && filteredGoals.length > 0 && (
            <div
              style={{
                maxHeight: '500px', // fixed table height
                overflowY: 'auto',
                border: '1px solid #ddd',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                }}
              >
                <thead
                  style={{
                    backgroundColor: '#007BFF',
                    color: 'black',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    <th style={thStyle}>Quarter</th>
                    <th style={thStyle}>Goal ID</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Weightage</th>
                    <th style={thStyle}>Target</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Start Date</th>
                    <th style={thStyle}>End Date</th>
                    <th style={thStyle}>Comments By Employee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal) => (
                    <tr
                      key={goal.goalId}
                      style={{
                        borderBottom: '1px solid #ddd',
                        textAlign: 'center',
                      }}
                    >
                      <td style={tdStyle}>{goal.quarter}</td>
                      <td style={tdStyle}>{goal.goalId}</td>
                      <td style={tdStyle}>{goal.goalTitle}</td>
                      <td style={tdStyle}>{goal.goalDescription}</td>
                      <td style={tdStyle}>{goal.metric}</td>
                      <td style={tdStyle}>{goal.target}</td>
                      <td
                        style={{
                          ...tdStyle,
                          color: '#FF8C00',
                          fontWeight: 'bold',
                        }}
                      >
                        {goal.status}
                      </td>
                      <td style={tdStyle}>{goal.startDate}</td>
                      <td style={tdStyle}>{goal.endDate}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => toggleComments(goal.goalId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color:"black",
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                        >
                          {expandedGoals[goal.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                        </button>
                        {expandedGoals[goal.goalId] && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              backgroundColor: '#f9f9f9',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              maxHeight: '150px',
                              overflowY: 'auto',
                            }}
                          >
                            {comments[goal.goalId]?.length ? (
                              comments[goal.goalId].map((c, index) => (
                                <div
                                  key={index}
                                  style={{
                                    padding: '0.3rem 0',
                                    borderBottom: '1px solid #eee',
                                    fontSize: '0.9rem',
                                    color: '#333',
                                  }}
                                >
                                  <strong>{index + 1}.</strong> {c.commentText}
                                  <br />
                                  <small style={{ color: '#777' }}>
                                    {new Date(c.commentedAt).toLocaleString()}
                                  </small>
                                </div>
                              ))
                            ) : (
                              <p
                                style={{
                                  fontStyle: 'italic',
                                  color: '#666',
                                }}
                              >
                                No comments.
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeGoalDetails;