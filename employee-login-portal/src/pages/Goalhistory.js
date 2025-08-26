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

  // 🆕 NEW: State for individual filters
  const [filters, setFilters] = useState({
    quarter: '',
    status: '',
    empRating: '',
    mngRating: '',
    weightage: '',
    target: '',
    selfAssessment: '',
    title: '',
    description: '',
    additionalNotes: '',
    managerComments: '',
    achievedTarget: '',
    reviewerComments: '',
    empComments: ''
  });

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

  const historyGoals = goals.filter(goal => {
    const status = (goal.status || "").toLowerCase();
    return ["rejected", "submitted", "approved", "reviewed"].includes(status);
  });

  const activeGoals = goals.filter(goal => {
    const s = (goal.status || "").toLowerCase();
    return s === "pending" || s === "in progress";
  });

  // 🆕 UPDATED: Filtering logic
  const filteredHistoryGoals = historyGoals.filter(goal => {
  const goalTitle = goal.goalTitle || '';
  const goalDescription = goal.goalDescription || '';
  const goalMetric = goal.metric || '';
  const goalSelfAssessment = goal.selfAssessment || '';
  const goalAdditionalNotes = goal.additionalNotes || '';
  const goalManagerComments = goal.managerComments || '';
  const goalAchievedTarget = goal.achievedTarget || '';
  const goalReviewerComments = goal.reviewerComments || '';
  const goalId = String(goal.goalId || '');
  const goalQuarter = String(goal.quarter || '');

  // 🆕 NEW: Filter for non-empty general search term
  const generalSearchMatch = !searchTerm || (
    goalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalMetric.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalSelfAssessment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalAdditionalNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalManagerComments.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalAchievedTarget.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalReviewerComments.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goalQuarter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🆕 NEW: Filter for specific headers
  const filterMatch = (
    (!filters.quarter || String(goal.quarter).toLowerCase() === filters.quarter.toLowerCase()) &&
    (!filters.status || String(goal.status).toLowerCase() === filters.status.toLowerCase()) &&
    (!filters.empRating || String(goal.rating) === filters.empRating) &&
    (!filters.mngRating || String(goal.managerRating) === filters.mngRating) &&
    (!filters.goalId || goalId.includes(filters.goalId)) && // ADD THIS LINE
    (!filters.title || goalTitle.toLowerCase().includes(filters.title.toLowerCase())) &&
    (!filters.description || goalDescription.toLowerCase().includes(filters.description.toLowerCase())) &&
    (!filters.weightage || String(goal.metric).toLowerCase().includes(filters.weightage.toLowerCase())) &&
    (!filters.target || String(goal.target).toLowerCase().includes(filters.target.toLowerCase())) &&
    (!filters.selfAssessment || goalSelfAssessment.toLowerCase().includes(filters.selfAssessment.toLowerCase())) &&
    (!filters.additionalNotes || goalAdditionalNotes.toLowerCase().includes(filters.additionalNotes.toLowerCase())) &&
    (!filters.managerComments || goalManagerComments.toLowerCase().includes(filters.managerComments.toLowerCase())) &&
    (!filters.achievedTarget || goalAchievedTarget.toLowerCase().includes(filters.achievedTarget.toLowerCase())) &&
    (!filters.reviewerComments || goalReviewerComments.toLowerCase().includes(filters.reviewerComments.toLowerCase()))
  );

  return generalSearchMatch && filterMatch;
});

  // 🆕 NEW: Handler for filter inputs
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
              placeholder="Search all columns..."
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
          className="performance-content"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            width:"100%",
            gap: "0", // space between tables
            padding: "10px"
          }}
        >
          {/* Active Goals Section */}

          {/* Goal History */}
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
            <h3>Goal History</h3>
            {historyGoals.length === 0 ? (
              <p>No history goals yet.</p>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto", // scroll inside
                  border: "1px solid #ddd",
                  overflowX: "auto",
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
                      <th style={thStyle}>EMP Rating</th>
                      <th style={thStyle}>Self Assessment</th>
                      <th style={thStyle}>Additional Notes</th>
                      <th style={thStyle}>MNG Achieved Target</th>
                      <th style={thStyle}>MNG Comments</th>
                      <th style={thStyle}>MNG Rating</th>
                      <th style={thStyle}>Reviewer Comments</th>
                      <th style={thStyle}>Comments By Employee</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                    {/* 🆕 NEW: Filter row */}
                    <tr>
                      <th style={thStyle}>
                        <select name="quarter" onChange={handleFilterChange} value={filters.quarter} style={{ width: '100%', padding: '4px' }}>
                          <option value="">All</option>
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="goalId"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.goalId}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="title"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.title}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="description"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.description}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="weightage"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.weightage}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="target"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.target}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <select name="empRating" onChange={handleFilterChange} value={filters.empRating} style={{ width: '100%', padding: '4px' }}>
                          <option value="">All</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="selfAssessment"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.selfAssessment}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="additionalNotes"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.additionalNotes}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="achievedTarget"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.achievedTarget}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="managerComments"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.managerComments}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        <select name="mngRating" onChange={handleFilterChange} value={filters.mngRating} style={{ width: '100%', padding: '4px' }}>
                          <option value="">All</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </th>
                      <th style={thStyle}>
                        <input
                          type="text"
                          name="reviewerComments"
                          placeholder="Search..."
                          onChange={handleFilterChange}
                          value={filters.reviewerComments}
                          style={{ width: '100%', padding: '4px' }}
                        />
                      </th>
                      <th style={thStyle}>
                        {/* Note: Comments column is not easily filterable by text, so keeping it blank. */}
                      </th>
                      <th style={thStyle}>
                        <select name="status" onChange={handleFilterChange} value={filters.status} style={{ width: '100%', padding: '4px' }}>
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="in progress">In Progress</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="reviewed">Reviewed</option>
                      
                          <option value="pending_admin_approval">Pending Admin Approval</option>
                        </select>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistoryGoals
                      .sort((a, b) => b.goalId - a.goalId)
                      .map((goal) => (
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
                          <td style={tdStyle}>{goal.rating}</td>
                          <td style={tdStyle}>{goal.selfAssessment}</td>
                          <td style={tdStyle}>{goal.additionalNotes}</td>
                          <td style={tdStyle}>{goal.achievedTarget}</td>
                          <td style={tdStyle}>{goal.managerComments}</td>
                          <td style={tdStyle}>{goal.managerRating}</td>
                          <td style={tdStyle}>{goal.reviewerComments ?? "-"}</td>
                          <td style={tdStyle}>
                            <button
                              onClick={() => toggleComments(goal.goalId)}
                              style={{
                                background: "none",
                                color: "black",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1rem"
                              }}
                              title="Toggle Comments"
                            >
                              {expandedCommentGoals.includes(goal.goalId)
                                ? "⬆️ Hide"
                                : "⬇️ Show"}
                            </button>
                            {expandedCommentGoals.includes(goal.goalId) && (
                              <div
                                style={{
                                  marginTop: "0.5rem",
                                  padding: "0.5rem",
                                  backgroundColor: "#f9f9f9",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  maxHeight: "150px",
                                  overflowY: "auto"
                                }}
                              >
                                {goalComments[goal.goalId]?.length ? (
                                  goalComments[goal.goalId].map((c, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        padding: "0.3rem 0",
                                        borderBottom: "1px solid #eee",
                                        fontSize: "0.9rem",
                                        color: "#333"
                                      }}
                                    >
                                      <strong>{index + 1}.</strong> {c.commentText}
                                      <br />
                                      <small style={{ color: "#777" }}>
                                        {new Date(c.commentedAt).toLocaleString()}
                                      </small>
                                    </div>
                                  ))
                                ) : (
                                  <p
                                    style={{
                                      fontStyle: "italic",
                                      color: "#666"
                                    }}
                                  >
                                    No comments.
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={tdStyle}>{goal.status}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* End of Merged Performance Content */}
      </div>
    </div>
  );
}
export default Performance;