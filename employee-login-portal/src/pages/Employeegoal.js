

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';


const SummaryCard = ({ title, count, color, text, onClick }) => (
  <div
    onClick={onClick}
    style={{
      flex: '1 1 150px',
      backgroundColor: color,
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <h4>{title}</h4>
    <p
      style={{
        fontSize: '2rem',
        margin: '0.5rem 0',
        color: text,
        fontWeight: 'bold',
      }}
    >
      {count}
    </p>
    <p>{title.includes('Goals') ? 'Goals' : 'Items'}</p>
  </div>
);

const EmployeeGoals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
    // ✅ Logged-in employee (from localStorage)
    const loggedInEmployeeId = localStorage.getItem("employeeId");
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');
    const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  
    // ✅ Selected employee (from navigation or localStorage)
    const initialSelectedEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId') || '';
    const initialSelectedEmployeeName = location.state?.employeeName || localStorage.getItem('selectedEmployeeName') || '';
  
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);

  const reviewerId = location.state?.reviewerId;
  const [expandedGoals, setExpandedGoals] = useState({});
  const [comments, setComments] = useState({});
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const getCurrentQuarter = () => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  };
  const currentQuarter = getCurrentQuarter();

  const fetchGoals = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8082/api/goals/employee/${selectedEmployeeId}`)
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Fetch failed: ${res.status} ${res.statusText} – ${msg}`);
        }
        if (!ct.includes('application/json')) {
          throw new Error('Non‑JSON response from server');
        }
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((g) => g.quarter === currentQuarter);
        setGoals(filtered);
        if (filtered.every((g) => g.status.toLowerCase() === 'reviewed')) {
          setReviewed(true);
        } else {
          setReviewed(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  }, [selectedEmployeeId, currentQuarter]);

  // Fetch goals on mount
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchGoals();
    } else {
      setError('Employee ID missing in navigation state.');
      setLoading(false);
    }
  }, [selectedEmployeeId, fetchGoals]);

  // Fetch updated profile info on mount
  useEffect(() => {
    if (loggedInEmployeeId) {
      fetch(`http://localhost:8082/profile/${loggedInEmployeeId}`)
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
  }, [loggedInEmployeeId]);

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
      const res = await fetch(`http://localhost:8082/profile/update/${loggedInEmployeeId}`, {
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

  const toggleComments = async (goalId) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));

    if (!comments[goalId]) {
      try {
        const res = await fetch(`http://localhost:8082/api/goals/${goalId}/comments`);
        if (!res.ok) throw new Error("Failed to fetch comments");
        const data = await res.json();
        setComments((prev) => ({ ...prev, [goalId]: data }));
      } catch (err) {
        console.error(err);
        setComments((prev) => ({ ...prev, [goalId]: [] }));
      }
    }
  };

  const handleReview = async () => {
    try {
      const goalIds = goals.map(goal => goal.goalId);
      const response = await fetch('http://localhost:8082/api/goals/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds, status: 'reviewed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to review goals');
      }

      const data = await response.json();
      console.log('Goals reviewed:', data);
      // Re-fetch goals to update the UI
      fetchGoals();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitFeedback = () => {
    navigate('/submitfeedback', {
      state: {
        selectedEmployeeId,
        reviewerId,
        goals,
      },
    });
  };
  

  const validStatuses = ['submitted'];
  const submitFeedbackCount = goals.filter((g) => g.status?.toLowerCase() === 'submitted').length;
  const inProgressCount = goals.filter((g) =>
    ['inprogress', 'in progress'].includes(g.status?.toLowerCase())
  ).length;
  const rejectedCount = goals.filter((g) => g.status?.toLowerCase() === 'rejected').length;
  const pendingCount = goals.filter((g) => g.status?.toLowerCase() === 'pending').length;
  const filteredGoals = goals.filter((g) => validStatuses.includes(g.status?.toLowerCase()));

  const thStyle = {
    textAlign: 'left',
    padding: '8px',
    borderBottom: '2px solid #007bff',
    color: 'white',
    backgroundColor:'darkblue'
  };

  const tdStyle = {
    padding: '8px',
  };

  const buttonStyle = {
    padding: '0.4rem 1rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

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
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({loggedInEmployeeId})</h2>

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
                  ref={profileDropdownRef}
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

        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <main
            style={{
              padding: '1rem',
              overflowY: 'auto',
              flexGrow: 1,
              backgroundColor: '#f4f4f4',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                border: '1px dashed #007bff',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              <h3>🎯 Set a New Team Goal</h3>
              <p style={{ color: '#555' }}>Define a new goal for your team</p>
              <button
                onClick={() => navigate('/myteam/newgoal')}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                + Add Goal
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {/* <SummaryCard title="Submit Feedback" count={submitFeedbackCount} color="#e3f2fd" text="#2196f3" /> */}
              <SummaryCard title="In Progress Goals" count={inProgressCount} color="#fff3e0" text="#fb8c00" onClick={() => navigate('/inprogressgoals')} />
              <SummaryCard title="Rejected Goals" count={rejectedCount} color="#ffebee" text="#e53935" onClick={() => navigate('/rejectedgoals')} />
              <SummaryCard title="Pending Goals" count={pendingCount} color="#fffde7" text="#fbc02d" />
              {/* <SummaryCard title="Submitted Goals" count={submitFeedbackCount} color="#e8f5e9" text="#388e3c" /> */}
            </div>

            {loading ? (
              <p style={{ textAlign: 'center' }}>Loading goals...</p>
            ) : (
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                <h3>Goals</h3>
                   <div
    style={{
      maxHeight: '200px',       // Adjust to fit that white space
      overflowY: 'auto',        // Vertical scroll
      
      border: '1px solid #ddd', // Optional border
    }}
  >
  
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                
                  <thead>
                    <tr>
                      <th style={thStyle}>Goal Title</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Goal ID</th>
                      <th style={thStyle}>Goal Description</th>
                      <th style={thStyle}>Quarter</th>
                      <th style={thStyle}>Target</th>
                      <th style={thStyle}>Metric</th>
                      <th style={thStyle}>Rating</th>
                      <th style={thStyle}>Self Assessment</th>
                      <th style={thStyle}>Additional Notes</th>
                      <th style={thStyle}>Comments By Employee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((g) => (
                      <tr key={g.goalId} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={tdStyle}>{g.goalTitle}</td>
                        <td style={tdStyle}><em>{g.status}</em></td>
                        <td style={tdStyle}>{g.goalId}</td>
                        <td style={tdStyle}>{g.goalDescription}</td>
                        <td style={tdStyle}>{g.quarter}</td>
                        <td style={tdStyle}>{g.target}</td>
                        <td style={tdStyle}>{g.metric}</td>
                        <td style={tdStyle}>{g.rating ?? '-'}</td>
                        <td style={tdStyle}>{g.selfAssessment ?? '-'}</td>
                        <td style={tdStyle}>{g.additionalNotes ?? '-'}</td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => toggleComments(g.goalId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' ,color:'black'}}
                            title="Toggle Comments"
                          >
                            {expandedGoals[g.goalId] ? '⬆️ Hide' : '⬇️ Show'}
                          </button>

                          {expandedGoals[g.goalId] && (
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
                              {comments[g.goalId]?.length ? (
                                comments[g.goalId].map((c, index) => (
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
                                    <small style={{ color: '#777' }}>{new Date(c.commentedAt).toLocaleString()}</small>
                                  </div>
                                ))
                              ) : (
                                <p style={{ fontStyle: 'italic', color: '#666' }}>No comments.</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
</div>
                {!reviewed && (
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'flex-end',
                    }}
                  >
                    
                    <button onClick={handleSubmitFeedback} style={buttonStyle}>
                      Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default EmployeeGoals;