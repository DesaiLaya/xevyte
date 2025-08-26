import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

function Rejectedgoals() {
  // ===== Sidebar + Topbar (from Performance) =====
  const employeeIdLocal = localStorage.getItem("employeeId");
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
    if (employeeIdLocal) {
      fetch(`http://localhost:8082/profile/${employeeIdLocal}`)
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
  }, [employeeIdLocal]);

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
      const res = await fetch(`http://localhost:8082/profile/update/${employeeIdLocal}`, {
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

  // ===== Original Rejectedgoals Logic =====
  const location = useLocation();
  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reassignedGoalId = location.state?.reassignedGoalId;

  useEffect(() => {
    if (reassignedGoalId) {
      setGoals(prevGoals => prevGoals.filter(goal => goal.goalId !== reassignedGoalId));
      const newState = { ...location.state };
      delete newState.reassignedGoalId;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [reassignedGoalId, location.state, navigate, location.pathname]);

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
        if (!rawToken) throw new Error('No token found in localStorage. Please login.');
        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }
        const token = `Bearer ${rawToken}`;
        const response = await fetch(`http://localhost:8082/api/goals/employee/${employeeId}`, {
          method: 'GET',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching goals: ${response.status} - ${text}`);
        }
        const data = await response.json();
        const filteredData = reassignedGoalId
          ? data.filter(goal => goal.goalId !== reassignedGoalId)
          : data;
        setGoals(filteredData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeGoals();
  }, [employeeId, reassignedGoalId]);

  const rejectedGoals = goals.filter(goal => goal.status?.toLowerCase() === 'rejected');

  // ✨ NEW: Filter the goals based on the search term
  const filteredGoals = rejectedGoals.filter(goal => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (goal.quarter && goal.quarter.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalId && String(goal.goalId).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.metric && goal.metric.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.target && String(goal.target).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (goal.rejectionReason && goal.rejectionReason.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });

  const handleReassignClick = (goal) => {
    setGoals(prevGoals => prevGoals.filter(g => g.goalId !== goal.goalId));
    setTimeout(() => {
      navigate('/myteam/newgoal', {
        state: {
          employeeId,
          goalTitle: goal.goalTitle,
          goalDescription: goal.goalDescription,
          startDate: goal.startDate,
          endDate: goal.endDate,
          targetDate: goal.targetDate,
          quarter: goal.quarter,
          target: goal.target,
          metric: goal.metric,
          previousGoalId: goal.goalId,
          reassignedGoalId: goal.goalId,
        },
      });
    }, 50);
  };

  // 🆕 NEW: Function to handle goal deletion
  const handleDeleteClick = async (goalId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this goal? This action cannot be undone.");
    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8082/api/goals/delete/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete goal: ${errorText}`);
      }

      // Update the UI by filtering out the deleted goal
      setGoals(prevGoals => prevGoals.filter(goal => goal.goalId !== goalId));
      alert('Goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal: ' + error.message);
    }
  };

  return (
    <div className="dashboard-container">
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
            {/* Add all other sidebar links as in Performance */}
          </>
        ) : (
          <div className="collapsed-wrapper">
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeIdLocal})</h2>
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

        {/* ===== Original Rejectedgoals UI under divider ===== */}
        <div className="employee-goal-container">
          <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
          <h2>
            Goals for Employee ID:{" "}
            <span style={{ backgroundColor: "yellow" }}>{employeeId}</span>
          </h2>

          {loading && <p>Loading goals...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && filteredGoals.length === 0 && (
            <p>No rejected goals found for this employee matching your search criteria.</p>
          )}

          {!loading && !error && filteredGoals.length > 0 && (
            <div
              style={{
                maxHeight: "500px", // fixed table height
                overflowY: "auto",
                border: "1px solid #ddd",
              }}
            >
              <table className="goal-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Quarter</th>
                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Goal ID</th>
                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Title</th>
                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Description</th>

                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Weightage</th>
                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Target</th>

                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Rejection Reason</th>
                    <th style={{ backgroundColor: "darkblue", color: "white" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGoals.map((goal) => (
                    <tr key={goal.goalId}>
                      <td>{goal.quarter}</td>
                      <td>{goal.goalId}</td>
                      <td>{goal.goalTitle}</td>
                      <td>{goal.goalDescription}</td>

                      <td>{goal.metric}</td>
                      <td>{goal.target}</td>

                      <td>{goal.rejectionReason || "N/A"}</td>
                      <td>
                        <button
                          className="reassign-button"
                          onClick={() => handleReassignClick(goal)}
                        >
                          Reassign
                        </button>
                        {/* 🆕 NEW: Delete Button */}
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(goal.goalId)}
                          style={{
                            marginLeft: '10px',
                            backgroundColor: 'red',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
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

export default Rejectedgoals;