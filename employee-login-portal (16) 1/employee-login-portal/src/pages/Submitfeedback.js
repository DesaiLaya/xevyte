import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

const EmployeeGoals = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ====== PERFORMANCE HEADER/SIDEBAR STATE ======

  // ---- Logged-in Employee (from login) ----
  // ✅ Logged-in employee (from localStorage)
  const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  // ---- Selected Employee (from navigation or localStorage) ----
  const initialSelectedEmployeeId =
    location.state?.employeeId || localStorage.getItem("selectedEmployeeId") || "";
  const initialSelectedEmployeeName =
    location.state?.employeeName || localStorage.getItem("selectedEmployeeName") || "User";

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);

  const reviewerId = location.state?.reviewerId;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // ====== EMPLOYEE GOALS STATE ======
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [goalInputs, setGoalInputs] = useState({});

  // ====== PERFORMANCE HEADER DATA FETCH ======
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

  // ====== CLICK OUTSIDE TO CLOSE PROFILE MENU ======
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
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

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

  // ====== EMPLOYEE GOALS FETCH ======
  const getCurrentQuarter = () => {
    const m = new Date().getMonth() + 1;
    return m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
  };
  const currentQuarter = getCurrentQuarter();

  const fetchGoals = () => {
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
          throw new Error('Non-JSON response from server');
        }
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((g) => {
          const status = g.status?.toLowerCase() || '';
          return g.quarter === currentQuarter && status !== 'reviewed';
        });

        setGoals(filtered);
        const inputsInit = {};
        filtered.forEach(g => {
          inputsInit[g.goalId] = {
            achievedTarget: '',
            managerComments: '',
            managerRating: '',
          };
        });
        setGoalInputs(inputsInit);
        setReviewed(filtered.length === 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedEmployeeId) fetchGoals();
    else {
      setError('Employee ID missing in navigation state.');
      setLoading(false);
    }
  }, [selectedEmployeeId]);

  // **VALIDATION AND CHANGE HANDLER FOR MANAGER RATING**
  const handleManagerRatingChange = (e, goalId) => {
    const value = e.target.value;
    // Allow only empty string or a single digit from 1 to 5
    if (value === "" || /^[1-5]$/.test(value)) {
      setGoalInputs((prev) => ({
        ...prev,
        [goalId]: { ...prev[goalId], managerRating: value },
      }));
    }
  };
  
  const handleInputChange = (e, goalId, field) => {
    setGoalInputs((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: e.target.value },
    }));
  };

  const handleSubmitFeedback = async () => {
    try {
      const feedbackArray = filteredGoals
        .map(goal => ({
          goalId: goal.goalId,
          achievedTarget: goalInputs[goal.goalId]?.achievedTarget?.trim() || '',
          managerComments: goalInputs[goal.goalId]?.managerComments?.trim() || '',
          managerRating: goalInputs[goal.goalId]?.managerRating
            ? parseInt(goalInputs[goal.goalId].managerRating.trim())
            : null
        }));

      if (feedbackArray.length === 0) {
        alert('No goals to submit feedback for.');
        return;
      }
      
      // **MANDATORY FIELD VALIDATION**
      for (const feedback of feedbackArray) {
        if (!feedback.achievedTarget) {
          alert(`Achieved Target for Goal ID ${feedback.goalId} is mandatory.`);
          return;
        }
        if (!feedback.managerComments) {
          alert(`Manager Comments for Goal ID ${feedback.goalId} are mandatory.`);
          return;
        }
        if (!feedback.managerRating) {
          alert(`Manager Rating for Goal ID ${feedback.goalId} is mandatory.`);
          return;
        }
      }

      const feedbackResponse = await fetch('http://localhost:8082/api/goals/manager-feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackArray),
      });
      if (!feedbackResponse.ok) throw new Error(await feedbackResponse.text());

      const reviewedGoalIds = feedbackArray.map(goal => goal.goalId);
      const reviewResponse = await fetch('http://localhost:8082/api/goals/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds: reviewedGoalIds, status: 'reviewed' }),
      });
      if (!reviewResponse.ok) throw new Error(await reviewResponse.text());

      const remainingGoals = goals.filter(g => !reviewedGoalIds.includes(g.goalId));
      setGoals(remainingGoals);
      alert('Feedback submitted and goals marked as reviewed!');
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
  };

  // ===== FILTERING LOGIC (UPDATED) =====
  const validStatuses = ['submitted'];
  const filteredGoals = useMemo(() => {
    const statusFiltered = goals.filter((g) =>
      validStatuses.includes(g.status?.toLowerCase())
    );

    if (!searchTerm.trim()) {
      return statusFiltered;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    return statusFiltered.filter((goal) => {
      const searchableText = [
        goal.quarter,
        goal.goalId,
        goal.goalTitle,
        goal.goalDescription,
        goal.metric, // weightage
        goal.target,
        goal.rating,
        goal.selfAssessment,
        goal.additionalNotes,
        goalInputs[goal.goalId]?.achievedTarget,
        goalInputs[goal.goalId]?.managerComments,
        goalInputs[goal.goalId]?.managerRating,
      ]
        .map((item) => (item ? String(item).toLowerCase() : ''))
        .join(' ');

      return searchableText.includes(lowerCaseSearchTerm);
    });
  }, [goals, searchTerm, goalInputs]);

  const thStyle = { textAlign: 'left', padding: '8px', borderBottom: '2px solid #007bff', color: '#007bff' };
  const tdStyle = { padding: '8px' };
  const buttonStyle = { padding: '0.4rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };

  return (
    <div className="dashboard-container">
      {/* ===== Sidebar from Performance ===== */}
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

      {/* ===== Main Content ===== */}
      <div className="main-content">
        {/* ===== Top Header from Performance ===== */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({loggedInEmployeeId})</h2>
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
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100 }}>
                  {successMessage}
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {/* ===== EmployeeGoals content below divider ===== */}
        <main style={{ padding: '1rem', flexGrow: 1, backgroundColor: '#f4f4f4' }}>
          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading goals...</p>
          ) : (
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <h3>Goals</h3>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Quarter</th>
                      <th style={thStyle}>Goal ID</th>
                      <th style={thStyle}>Goal Title</th>
                      <th style={thStyle}>Goal Description</th>
                      <th style={thStyle}>Weightage</th>
                      <th style={thStyle}>Target</th>
                      <th style={thStyle}>EMP Rating</th>
                      <th style={thStyle}>EMP Selfassessment</th>
                      <th style={thStyle}> EMP Additional Notes</th>
                      <th style={thStyle}>MNG Achieved Target <span style={{ color: 'red' }}>*</span></th>
                      <th style={thStyle}>MNG Comments <span style={{ color: 'red' }}>*</span></th>
                      <th style={thStyle}>MNG Rating <span style={{ color: 'red' }}>*</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.length > 0 ? (
                      filteredGoals.map((g) => (
                        <tr key={g.goalId} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={tdStyle}>{g.quarter}</td>
                          <td style={tdStyle}>{g.goalId}</td>
                          <td style={tdStyle}>{g.goalTitle}</td>
                          <td style={tdStyle}>{g.goalDescription}</td>
                          <td style={tdStyle}>{g.metric}</td>
                          <td style={tdStyle}>{g.target}</td>
                          <td style={tdStyle}>{g.rating ?? '-'}</td>
                          <td style={tdStyle}>{g.selfAssessment}</td>
                          <td style={tdStyle}>{g.additionalNotes}</td>
                          <td style={tdStyle}>
                            <textarea
                              value={goalInputs[g.goalId]?.achievedTarget || ''}
                              onChange={(e) => handleInputChange(e, g.goalId, 'achievedTarget')}
                              style={{ width: '100%' }}
                              rows={3}
                              placeholder="Achieved Target"
                              required
                            />
                          </td>
                          <td style={tdStyle}>
                            <textarea
                              value={goalInputs[g.goalId]?.managerComments || ''}
                              onChange={(e) => handleInputChange(e, g.goalId, 'managerComments')}
                              style={{ width: '100%' }}
                              rows={3}
                              placeholder="Manager Comments"
                              required
                            />
                          </td>
                          <td style={tdStyle}>
                            <input
                              type="text"
                              maxLength="1"
                              value={goalInputs[g.goalId]?.managerRating || ''}
                              onChange={(e) => handleManagerRatingChange(e, g.goalId)}
                              style={{ width: '100%' }}
                              placeholder="Rating (1-5)"
                              required
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>
                          {searchTerm.trim() ? 'No goals found matching your search.' : 'All goals have been reviewed.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!reviewed && filteredGoals.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={handleSubmitFeedback} style={buttonStyle}>Submit Feedback</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EmployeeGoals;