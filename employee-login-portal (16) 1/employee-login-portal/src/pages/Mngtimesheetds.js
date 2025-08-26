import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Managergoals.css';

function ManagerGoals() {
  const [subordinates, setSubordinates] = useState([]);
  const [filteredSubordinates, setFilteredSubordinates] = useState([]); // New state for filtered list
  const [errorMessage, setErrorMessage] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const navigate = useNavigate();
  const employeeId = localStorage.getItem('employeeId'); // Logged-in user's ID
  const role = localStorage.getItem('role');

  // Fetch employee profile info
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

  // Close dropdown when clicking outside
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

  // Load subordinates for manager
  useEffect(() => {
    if (!role || role.toLowerCase() !== 'manager') {
      setErrorMessage('You are not a manager. No subordinates to display.');
      setIsManager(false);
      return;
    }
    if (!employeeId) {
      setErrorMessage('User ID not found. Please log in.');
      setIsManager(false);
      return;
    }

    setIsManager(true);

    fetch(`http://localhost:8082/api/goals/manager/${employeeId}/employees`)
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        setSubordinates(data);
        setErrorMessage('');
      })
      .catch((error) => {
        console.error('Error fetching subordinates:', error);
        setErrorMessage('Failed to fetch subordinates.');
        setSubordinates([]);
      });
  }, [employeeId, role]);

  // NEW: Filtering logic
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    if (subordinates.length > 0) {
      const tempFiltered = subordinates.filter(sub => {
        const id = sub.employeeId ? String(sub.employeeId).toLowerCase() : '';
        const name = sub.name ? sub.name.toLowerCase() : '';
        const email = sub.email ? sub.email.toLowerCase() : '';

        return (
          id.includes(lowercasedSearchTerm) ||
          name.includes(lowercasedSearchTerm) ||
          email.includes(lowercasedSearchTerm)
        );
      });
      setFilteredSubordinates(tempFiltered);
    } else {
      setFilteredSubordinates([]);
    }
  }, [searchTerm, subordinates]);

const handleEmployeeClick = (empId) => {
  // save selected emp in localStorage (optional, if you want persistence)
  localStorage.setItem("selectedEmployeeId", empId);

  // pass employeeId via state when navigating
  navigate("/mngreq", { state: { employeeId: empId } });
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

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header with Profile */}
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
                  <button onClick={handleEditProfile} style={{ padding: '10px', width: '100%', border: 'none', background: 'none', textAlign: 'left', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                  <button onClick={handleLogout} style={{ padding: '10px', width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>Logout</button>
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

        {/* Divider */}
        <hr className="divider-line" />

        {/* Original ManagerGoals Content */}
        {!isManager ? (
          <div className="emp-container">
            <h2 className="emp-title">Access Denied</h2>
            <p className="emp-error">{errorMessage}</p>
          </div>
        ) : (
          <div className="emp-container">
            <h2 className="emp-title">Subordinates for Manager {employeeId}</h2>
            {errorMessage && <p className="emp-error">{errorMessage}</p>}
            {!errorMessage && filteredSubordinates.length === 0 && (
              <p className="emp-empty">No subordinates found matching your search.</p>
            )}
            {filteredSubordinates.length > 0 && (
              <div className="table-wrapper">
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubordinates.map((emp) => (
                      <tr key={emp.id || emp.employeeId}>
                        <td>
                          <button
                            type="button"
                            style={{
                              color: 'blue',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              font: 'inherit',
                            }}
                            onClick={() => handleEmployeeClick(emp.employeeId)}
                          >
                            {emp.employeeId}
                          </button>
                        </td>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerGoals;