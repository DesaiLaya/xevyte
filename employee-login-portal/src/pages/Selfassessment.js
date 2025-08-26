import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Dashboard.css';

// Style constants
const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f2f2f2",
  color: "black"
};
const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px"
};

const MyGoals = () => {
  // Profile/Sidebar states
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  // MyGoals logic
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [goalInputs, setGoalInputs] = useState({});

  const [filteredGoals, setFilteredGoals] = useState([]); // State for filtered goals

  const fetchGoals = () => {
    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8082/api/goals/employee/${employeeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch goals");
        return res.json();
      })
      .then((data) => {
        setGoals(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGoals();
  }, [employeeId]);

  const inProgressGoals = goals.filter(goal => goal.status.toLowerCase() === "in progress");
  const activeGoals = goals.filter(goal =>
    goal.status.toLowerCase() === "pending" || goal.status.toLowerCase() === "new"
  );
  
  // **NEW FILTER LOGIC**
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    // Filter goals based on the search term
    const tempFilteredGoals = inProgressGoals.filter(goal => {
      // Check if the search term exists in any of the following fields
      return (
        (goal.goalTitle && goal.goalTitle.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.goalDescription && goal.goalDescription.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.quarter && goal.quarter.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.metric && goal.metric.toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.target && String(goal.target).toLowerCase().includes(lowercasedSearchTerm)) ||
        (goal.goalId && String(goal.goalId).toLowerCase().includes(lowercasedSearchTerm))
      );
    });

    setFilteredGoals(tempFilteredGoals);
  }, [searchTerm, inProgressGoals]);

  useEffect(() => {
    if (inProgressGoals.length > 0) {
      setGoalInputs(prevInputs => {
        const newInputs = { ...prevInputs };
        inProgressGoals.forEach(g => {
          if (!newInputs[g.goalId]) {
            newInputs[g.goalId] = {
              rating: g.rating || "",
              selfAssessment: g.selfAssessment || "",
              additionalInfo: g.additionalInfo || "",
            };
          }
        });
        return newInputs;
      });
    }
  }, [inProgressGoals]);

  // **NEW VALIDATION LOGIC**
  const handleRatingChange = (e, goalId) => {
    const val = e.target.value;
    // Check if the value is a single digit, a number, and between 1 and 5
    if (val === "" || (/^[1-5]$/).test(val)) {
      setGoalInputs((prev) => ({
        ...prev,
        [goalId]: { ...prev[goalId], rating: val }
      }));
    }
  };

  const handleSubmitAll = async () => {
    setUpdating(true);
    let rawToken = localStorage.getItem("token");
    if (rawToken?.startsWith('"')) rawToken = rawToken.slice(1, -1);
    const token = `Bearer ${rawToken}`;
    try {
      for (const goal of inProgressGoals) {
        const data = goalInputs[goal.goalId];

        // **UPDATED VALIDATION FOR SUBMISSION**
        const ratingAsNumber = Number(data.rating);
        if (!data || !data.rating || isNaN(ratingAsNumber) || ratingAsNumber < 1 || ratingAsNumber > 5 || !data.selfAssessment.trim()) {
          alert(`Please enter a valid rating (1-5) and a self-assessment for goal ID ${goal.goalId}`);
          setUpdating(false);
          return;
        }

        const response = await fetch(`http://localhost:8082/api/goals/${goal.goalId}/employee-feedback`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            status: "submitted",
            rating: data.rating,
            selfAssessment: data.selfAssessment,
            additionalNotes: data.additionalInfo,
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to update goal ID ${goal.goalId}`);
        }
      }
      alert("Self-assessment submitted for all goals!");
      fetchGoals();
      setGoalInputs({});
    } catch (err) {
      alert("Error submitting goals: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Profile/Sidebar logic (unchanged)
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
        .catch(err => console.error("Failed to fetch profile info:", err));
    }
  }, [employeeId]);

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
      const res = await fetch(`http://localhost:8082/profile/update/${employeeId}`, {
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

  return (
    <div className="dashboard-container" style={{ display: "flex" }}>
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

      {/* Main Content */}
      <div className="main-content" style={{ flexGrow: 1, padding: "20px" }}>
        {/* Header */}
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome, {employeeName} ({employeeId})</h2>
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
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '5px', backgroundColor: '#4BB543', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', whiteSpace: 'nowrap', zIndex: 1100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{successMessage}</div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {/* MyGoals Table (Below Divider) */}
        <div
          className="assessment-container"
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "6px",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)"
          }}
        >
          <h3>Submit Self Assessment for In Progress Goals</h3>
          {filteredGoals.length === 0 ? (
            <p>No in progress goals found.</p>
          ) : (
            <>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "12px"
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f2f2f2" }}>
                      <th style={thStyle}>Quarter</th>
                      <th style={thStyle}>Goal ID</th>
                      <th style={thStyle}>Goal Title</th>
                      <th style={thStyle}>Goal Description</th>
                      <th style={thStyle}>Weightage</th>
                      <th style={thStyle}>Target</th>
                      <th style={thStyle}>
                        Rating <span style={{ color: "red" }}>*</span>
                      </th>
                      <th style={thStyle}>
                        Self Assessment <span style={{ color: "red" }}>*</span>
                      </th>
                      <th style={thStyle}>Additional Notes</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((g) => {
                      const inputs =
                        goalInputs[g.goalId] || {
                          rating: "",
                          selfAssessment: "",
                          additionalInfo: ""
                        };
                      return (
                        <tr key={g.goalId}>
                          <td style={tdStyle}>{g.quarter}</td>
                          <td style={tdStyle}>{g.goalId}</td>
                          <td style={tdStyle}>{g.goalTitle}</td>
                          <td style={tdStyle}>{g.goalDescription || "-"}</td>
                          <td style={tdStyle}>{g.metric}</td>
                          <td style={tdStyle}>{g.target}</td>
                          <td style={tdStyle}>
                            <input
                              type="text"
                              pattern="[1-5]"
                              maxLength="1"
                              value={inputs.rating}
                              onChange={(e) => handleRatingChange(e, g.goalId)}
                              style={{ width: "100%" }}
                              placeholder="Rating (1-5)"
                            />
                          </td>
                          <td style={tdStyle}>
                            <textarea
                              value={inputs.selfAssessment}
                              onChange={(e) => {
                                setGoalInputs((prev) => ({
                                  ...prev,
                                  [g.goalId]: {
                                    ...prev[g.goalId],
                                    selfAssessment: e.target.value
                                  }
                                }));
                              }}
                              style={{ width: "100%" }}
                              rows={3}
                              placeholder="Self Assessment"
                            />
                          </td>
                          <td style={tdStyle}>
                            <textarea
                              value={inputs.additionalInfo}
                              onChange={(e) => {
                                setGoalInputs((prev) => ({
                                  ...prev,
                                  [g.goalId]: {
                                    ...prev[g.goalId],
                                    additionalInfo: e.target.value
                                  }
                                }));
                              }}
                              style={{ width: "100%" }}
                              rows={2}
                              placeholder="Additional Notes"
                            />
                          </td>
                          <td style={tdStyle}>
                            <em>{g.status}</em>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleSubmitAll}
                disabled={updating}
                style={{
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {updating ? "Submitting..." : "Submit Self Assessment for All"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGoals;