import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Newgoal.css';

const NewGoals = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Logged-in employee (from localStorage)
  const loggedInEmployeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || 'User');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  // ✅ Selected employee (from navigation or localStorage)
  const initialSelectedEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId') || '';
  const initialSelectedEmployeeName = location.state?.employeeName || localStorage.getItem('selectedEmployeeName') || '';

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialSelectedEmployeeId);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(initialSelectedEmployeeName);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [goals, setGoals] = useState([]);

  // ✅ Fetch logged-in employee profile
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
        alert("Failed to update profile picture.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture.");
    }
  };

  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };

  // ✅ Goals setup for selected employee
  useEffect(() => {
    if (selectedEmployeeId) {
      localStorage.setItem('selectedEmployeeId', selectedEmployeeId);
      localStorage.setItem('selectedEmployeeName', selectedEmployeeName);

      const quarter = location.state?.quarter || getCurrentQuarter();

      setGoals([
        {
          goalId: '',
          employeeId: selectedEmployeeId,
          employeeName: selectedEmployeeName,
          quarter,
          goalTitle: location.state?.goalTitle || '',
          goalDescription: location.state?.goalDescription || '',
          target: location.state?.target || '',
          metric: location.state?.metric || '',
          acknowledgedBy: '',
          acknowledgedAt: '',
          startDate: location.state?.startDate || '',
          endDate: location.state?.endDate || '',
          targetDate: location.state?.targetDate || '',
          previousGoalId: location.state?.previousGoalId || null,
        },
      ]);
    }
  }, [selectedEmployeeId, selectedEmployeeName, location.state]);

  const handleChange = (index, field, value) => {
    const updatedGoals = [...goals];
    updatedGoals[index][field] = value;
    setGoals(updatedGoals);
  };

  const addGoal = () => {
    setGoals([
      ...goals,
      {
        goalId: '',
        employeeId: selectedEmployeeId,
        employeeName: selectedEmployeeName,
        quarter: getCurrentQuarter(),
        goalTitle: '',
        goalDescription: '',
        target: '',
        metric: '',
        acknowledgedBy: '',
        acknowledgedAt: '',
      },
    ]);
  };

  const removeGoal = (index) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    setGoals(updatedGoals);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      alert('Selected Employee ID is missing. Cannot submit goals.');
      return;
    }

    try {
      const previousGoalId = goals[0]?.previousGoalId;

      // Submit all new goals
      for (const goal of goals) {
        goal.employeeId = selectedEmployeeId;
        const response = await fetch('http://localhost:8082/api/goals/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goal),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save goal: ${errorText}`);
        }
      }

      // Delete previous goal if reassign
      if (previousGoalId) {
        await fetch(`http://localhost:8082/api/goals/delete/${previousGoalId}`, { method: 'DELETE' });
      }

      alert('Goals submitted successfully!');
      navigate(-1);

    } catch (error) {
      alert('Error submitting goals: ' + error.message);
      console.error('Detailed error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar (unchanged) */}
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
        {/* ✅ Topbar - Logged-in employee info */}
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
                <div ref={profileDropdownRef} className="profile-dropdown">
                  <button onClick={handleEditProfile}>Edit Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
              {successMessage && <div className="success-msg">{successMessage}</div>}
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {/* ✅ Below divider - Selected employee workflow */}
        <div className="goal-container3">
          <h2>Working on Goals for {selectedEmployeeName || 'Employee'} ({selectedEmployeeId || 'N/A'})</h2>
          <h2>🎯 Set Quarterly Goals</h2>

          <form onSubmit={handleSubmit}>
            <div className="table-wrapper">
              <table className="goals-table1 goals-style">
                <thead>
                  <tr>
                    <th>Quarter</th>
                    <th>Goal Title</th>
                    <th>Goal Description</th>
                    <th>Weightage</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal, index) => (
                    <tr key={index}>
                      <td><input type="text" value={goal.quarter} readOnly /></td>
                      <td><input type="text" value={goal.goalTitle} onChange={(e) => handleChange(index, 'goalTitle', e.target.value)} required /></td>
                      <td><textarea rows="2" value={goal.goalDescription} onChange={(e) => handleChange(index, 'goalDescription', e.target.value)} required /></td>
                      <td><input type="text" value={goal.metric} onChange={(e) => handleChange(index, 'metric', e.target.value)} required /></td>
<td>
  <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "flex-end" }}>
    <input
      type="text"
      value={goal.target || ""}
      onChange={(e) => handleChange(index, "target", e.target.value)}
      required
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginBottom: "3px"   // small gap between input and minus
      }}
    />
    {goals.length > 1 && (
      <button
        type="button"
        onClick={() => removeGoal(index)}
        style={{
          background: "transparent",
          border: "none",
          color: "black",
          fontSize: "18px",
          cursor: "pointer",
          padding: 0,
          margin: 0,
          lineHeight: 1
        }}
      >
        &minus;
      </button>
    )}
  </div>
</td>



                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="goal-actions">
              <button type="button" onClick={addGoal} className="add-btn">+ Add Another Goal</button>
              <button type="submit" className="save-btn">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewGoals;
