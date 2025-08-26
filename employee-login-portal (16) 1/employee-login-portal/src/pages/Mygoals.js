import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Mygoals';

function Performance() {
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

  // State for goals functionality
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingGoalIds, setUpdatingGoalIds] = useState([]);
  const [rejectedGoalId, setRejectedGoalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [goalComments, setGoalComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [commentingGoalId, setCommentingGoalId] = useState(null);
  const commentCountersRef = useRef({});

  const [expandedCommentGoals, setExpandedCommentGoals] = useState([]);

  // Correct placement: Declare activeGoals and historyGoals before the useEffect that uses them.
  const historyGoals = goals.filter(goal => {
    const status = (goal.status || "").toLowerCase();
    return ["rejected", "submitted", "approved", "reviewed"].includes(status);
  });

  const activeGoals = goals.filter(goal => {
    const s = (goal.status || "").toLowerCase();
    return s === "pending" || s === "in progress";
  });

  // This useEffect hook will run whenever the searchTerm or activeGoals change.
  // It applies the filtering logic and updates the filteredGoals state.
  const [filteredGoals, setFilteredGoals] = useState([]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const tempFilteredGoals = activeGoals.filter(goal => {
      // Check if the search term exists in any of the following fields
      // You can add or remove fields here based on what you want to be searchable.
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
  }, [searchTerm, activeGoals]);

  // Fetch updated profile info on mount (optional but recommended)
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
      const res = await fetch(`http://localhost:8082/profile/update/${employeeId}`, {
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

  // Goals related functions
  const normalizeGoal = (g) => {
    const goalId = g.goalId ?? g.id ?? g.goalID ?? g.goal_id;
    return { ...g, goalId };
  };

  const fetchGoals = () => {
    if (!employeeId) {
      setError("No employee logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:8082/api/goals/employee/${employeeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch goals (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Data is not an array");
        console.log("Fetched goals:", data);
        const normalized = data.map(normalizeGoal);
        setGoals(normalized);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("fetchGoals error:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  const toggleComments = (goalId) => {
    fetchComments(goalId);
    setExpandedCommentGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const submitComment = async (goalId) => {
    if (!newComment.trim()) return;

    if (!commentCountersRef.current[goalId]) {
      commentCountersRef.current[goalId] = (goalComments[goalId]?.length || 0) + 1;
    } else {
      commentCountersRef.current[goalId] += 1;
    }

    const generatedCommenterId = `${commentCountersRef.current[goalId]}`;

    const payload = {
      commenterId: generatedCommenterId,
      commenterRole: "EMPLOYEE",
      commentText: newComment
    };

    try {
      const res = await fetch(`http://localhost:8082/api/goals/${goalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to post comment");

      setNewComment("");
      fetchComments(goalId);
      setCommentingGoalId(null);
    } catch (err) {
      console.error("submitComment error:", err);
    }
  };

  const fetchComments = (goalId) => {
    fetch(`http://localhost:8082/api/goals/${goalId}/comments`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch comments (${res.status})`);
        return res.json();
      })
      .then(data => {
        setGoalComments(prev => ({ ...prev, [goalId]: data }));
        commentCountersRef.current[goalId] = data.length;
      })
      .catch(err => {
        console.error("fetchComments error:", err);
      });
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const updateGoalStatus = async (goalId, newStatus, feedback = "") => {
    if (updatingGoalIds.includes(goalId)) return false;
    setUpdatingGoalIds((prev) => [...prev, goalId]);

    try {
      let rawToken = localStorage.getItem("token");
      if (typeof rawToken === "string") {
        rawToken = rawToken.replace(/^"|"$/g, "");
      }
      const headers = { "Content-Type": "application/json" };
      if (rawToken) headers["Authorization"] = `Bearer ${rawToken}`;

      const payload = { status: newStatus };
      if (feedback && feedback.trim() !== "") payload.selfAssessment = feedback;

      console.log("Sending update:", goalId, payload);

      const response = await fetch(`http://localhost:8082/api/goals/${goalId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let updated;
      try {
        updated = text ? JSON.parse(text) : null;
      } catch (e) {
        updated = null;
      }

      if (!response.ok) {
        console.error("Update failed:", response.status, text);
        throw new Error(text || `Failed to update goal status (${response.status})`);
      }

      if (updated && (updated.goalId ?? updated.id)) {
        const updatedNormalized = normalizeGoal(updated);
        setGoals((prev) =>
          prev.map((g) => (String(g.goalId) === String(updatedNormalized.goalId) ? { ...g, ...updatedNormalized } : g))
        );
      } else {
        await fetchGoals();
      }

      return true;
    } catch (err) {
      console.error("updateGoalStatus error:", err);
      setError(err.message || String(err));
      return false;
    } finally {
      setUpdatingGoalIds((prev) => prev.filter((id) => id !== goalId));
    }
  };

  const handleAccept = async (goalId) => {
    if (updatingGoalIds.includes(goalId)) return;

    const prevGoals = goals;
    setGoals((prev) =>
      prev.map((g) =>
        String(g.goalId) === String(goalId)
          ? { ...g, status: "in progress" }
          : g
      )
    );

    const success = await updateGoalStatus(goalId, "in progress");

    if (!success) {
      setGoals(prevGoals);
      alert("Failed to accept goal — check console/server logs.");
    }
  };

  const handleReject = (goalId) => {
    setRejectedGoalId(goalId);
    setRejectionReason("");
  };

  const submitRejectionReason = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const goalId = rejectedGoalId;
    if (!goalId) return;

    const prevGoals = goals;
    setGoals((prev) => prev.map(g => (String(g.goalId) === String(goalId) ? { ...g, status: "rejected", selfAssessment: rejectionReason } : g)));

    const success = await updateGoalStatus(goalId, "rejected", rejectionReason.trim());
    if (success) {
      setRejectedGoalId(null);
      setRejectionReason("");
    } else {
      setGoals(prevGoals);
      alert("Failed to reject goal — check console/server logs.");
    }
  };

  // Styles from the second component
  const cardStyle = {
    backgroundColor: "#f9f9f9",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "30px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const thStyle = {
    padding: "4px 6px", // smaller top-bottom padding
    fontSize: "13px", // smaller font
    lineHeight: "1.2", // tighter vertical spacing
    border: "1px solid #ddd",
    textAlign: "left",
    backgroundColor: "#f2f2f2",
    color: "black",
  };

  const tdStyle = {
    border: "1px solid #ddd",
    padding: "10px",
    verticalAlign: "top",
  };

  const buttonStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    color: "white",
    backgroundColor: "#007bff",
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
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

        {/* Start of Merged Performance Content */}
        <div
          className="performce-content"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            gap: "0", // space between tables
            padding: "10px"
          }}
        >
          {/* Active Goals Section */}
          <div
            style={{
              ...cardStyle,
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              maxHeight: "calc(100vh - 200px)"
            }}
          >
            <h3>Active Goals</h3>
            {loading ? (
              <p>Loading...</p>
            ) : activeGoals.length === 0 ? (
              <p>No active goals to display.</p>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: "calc(100vh - 200px)", // ✅ height applied to scroll area
                  overflowY: "auto", // ✅ scroll inside
                  border: "1px solid #ddd",
                  borderRadius: "6px"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f2f2f2",
                        color: "black",
                        position: "sticky",
                        top: 0,
                        zIndex: 1
                      }}
                    >
                      <th style={thStyle}>Quarter</th>
                      <th style={thStyle}>Goal ID</th>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>Weightage</th>
                      <th style={thStyle}>Target</th>


                      <th style={thStyle}>Comments</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((goal) => {
                      const isUpdating = updatingGoalIds.includes(goal.goalId);
                      const isAccepted = (goal.status || "").toLowerCase() === "in progress";

                      return (
                        <tr
                          key={String(goal.goalId)}
                          style={{
                            fontSize: "14px", // compact text
                            padding: "6px 8px" // compact row height
                          }}
                        >
                          <td style={tdStyle}>{goal.quarter}</td>
                          <td style={tdStyle}>{goal.goalId}</td>
                          <td style={tdStyle}>{goal.goalTitle}</td>
                          <td style={tdStyle}>{goal.goalDescription}</td>
                          <td style={tdStyle}>{goal.metric}</td>
                          <td style={tdStyle}>{goal.target}</td>


                          <td style={tdStyle}>
                            <button
                              onClick={() => {
                                fetchComments(goal.goalId);
                                setExpandedCommentGoals((prev) =>
                                  prev.includes(goal.goalId)
                                    ? prev.filter((id) => id !== goal.goalId)
                                    : [...prev, goal.goalId]
                                );
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                marginBottom: "5px",
                                color: "black"
                              }}
                            >
                              {expandedCommentGoals.includes(goal.goalId)
                                ? "⬆️ Hide Comments"
                                : "⬇️ Show Comments"}
                            </button>
                            {expandedCommentGoals.includes(goal.goalId) && (
                              <div
                                style={{
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                  border: "1px solid #ccc",
                                  padding: "6px",
                                  marginBottom: "10px",
                                  borderRadius: "4px",
                                  background: "#fff"
                                }}
                              >
                                {(goalComments[goal.goalId] || []).length === 0 ? (
                                  <div style={{ fontStyle: "italic", color: "#888" }}>
                                    No previous comments.
                                  </div>
                                ) : (
                                  goalComments[goal.goalId].map((c, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        padding: "6px 0",
                                        borderBottom: "1px solid #eee"
                                      }}
                                    >
                                      <strong>{index + 1}.</strong> {c.commentText}
                                      <div
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#666"
                                        }}
                                      >
                                        {new Date(c.commentedAt).toLocaleString()}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                fetchComments(goal.goalId);
                                setCommentingGoalId(
                                  commentingGoalId === goal.goalId ? null : goal.goalId
                                );
                              }}
                            >
                              {commentingGoalId === goal.goalId
                                ? "Cancel"
                                : "Add Comment"}
                            </button>
                            {commentingGoalId === goal.goalId && (
                              <div style={{ marginTop: "8px" }}>
                                <textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Enter your comment..."
                                  rows={3}
                                  style={{ width: "100%" }}
                                />
                                <button
                                  type="button"
                                  style={{ marginTop: "5px" }}
                                  onClick={() => submitComment(goal.goalId)}
                                  disabled={!newComment.trim()}
                                >
                                  Submit
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={tdStyle}>
                            {isAccepted ? (
                              <button
                                style={{
                                  ...buttonStyle,
                                  backgroundColor: "#6c757d"
                                }}
                                disabled
                              >
                                🔒 Locked
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAccept(goal.goalId)}
                                  style={{
                                    ...buttonStyle,
                                    backgroundColor: "#28a745",
                                    marginRight: "8px"
                                  }}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "Please wait..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleReject(goal.goalId)}
                                  style={{
                                    ...buttonStyle,
                                    backgroundColor: "#dc3545"
                                  }}
                                  disabled={isUpdating}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {rejectedGoalId && (
            <div style={modalOverlayStyle}>
              <div style={modalStyle}>
                <h3>Reject Goal ID: {rejectedGoalId}</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  rows={4}
                  style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={submitRejectionReason} style={buttonStyle}>Submit</button>
                  <button onClick={() => setRejectedGoalId(null)} style={buttonStyle}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Performance;