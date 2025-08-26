import React, { useState, useEffect, useRef } from 'react';
import './Saveddrafts.css';
import { Link, useNavigate } from 'react-router-dom';
import "./Dashboard.css";
 
function Saveddrafts() {
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState(null);
  const [role, setRole] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
 
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
 
  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    const empName = localStorage.getItem("employeeName");

    setEmployeeId(empId);
    setEmployeeName(empName);
    setRole(localStorage.getItem("role"));

    // Load saved drafts and sort them
    const savedDrafts = localStorage.getItem('expenseClaimDrafts');
    if (savedDrafts) {
      const loadedDrafts = JSON.parse(savedDrafts);
      
      // Sort drafts by their unique ID in descending order to show the latest at the top
      // We assume a higher expenseId means a more recent draft, as they are likely generated sequentially.
      const sortedDrafts = loadedDrafts.sort((a, b) => b.expenseId - a.expenseId);
      setDrafts(sortedDrafts);
      setMessage('Drafts loaded from previous session!');
    }

    // Fetch profile info
    fetch(`http://localhost:8082/profile/${empId}`)
      .then(res => res.json())
      .then(data => {
        setProfilePic(data.profilePic);
        setEmployeeName(data.name); // Optional: update name if backend changed
      });
  }, []);
  const handleDelete = (expenseId) => {
  // Show confirmation dialog
  const confirmDelete = window.confirm("Are you sure you want to delete this draft?");
  
  if (confirmDelete) {
    const updatedDrafts = drafts.filter((draft) => draft.expenseId !== expenseId);
    localStorage.setItem('expenseClaimDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    setMessage('Draft deleted successfully!');
  }
};

  const handleEdit = (draft) => {
    navigate('/claims/new', { state: { draftData: draft } });
  };
 
  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };
 
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };
 
  // === NEW: Open file input on Edit click ===
  const handleEditProfile = () => {
    setShowProfileMenu(false);
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
 
      // Log the response status and body for debugging
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
 
      if (!res.ok) {
        // If status not 2xx, throw an error to catch block
        throw new Error(`HTTP error! status: ${res.status}`);
      }
 
      if (data.profilePic) {
        setProfilePic(data.profilePic);
        alert("Profile picture updated!");
        localStorage.setItem("employeeProfilePic", data.profilePic);
      } else {
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    }
  };
 
  // 🔍 Logic to filter drafts based on the search term
  const filteredDrafts = drafts.filter(draft => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    // Check all relevant fields for a match
    return (
      String(draft.expenseId).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.description.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.category.toLowerCase().includes(lowercasedSearchTerm) ||
      String(draft.amount).toLowerCase().includes(lowercasedSearchTerm) ||
      draft.date.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.businessPurpose.toLowerCase().includes(lowercasedSearchTerm) ||
      draft.additionalNotes.toLowerCase().includes(lowercasedSearchTerm)
    );
  });
 
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
            <h3><Link to="/hom" className="hom" style={{ textDecoration: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Favourites
                <img src={require("../assets/star4.png")} alt="star" style={{ width: '22px', height: '22px' }} />
              </span>
            </Link></h3>
 
            <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none', color: 'white' }}>Claims</Link></h3>
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
      <div className="manager-dashboard">
        <div className="dashboard-header">
          <div className="top-header">
            <h2>Welcome, {employeeName} ({employeeId})</h2>
 
            <div className="header-right">
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
              />
 
              <div className="profile-wrapper">
                <img
                  // Show profilePic with full URL if needed
                src={profilePic ? profilePic : require('../assets/SKKKK.JPG.jpg')}
 
                  alt="Profile"
                  className="profile-pic"
                  onClick={handleProfileClick}
                />
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <button onClick={handleEditProfile}>Edit</button>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
              {/* Hidden file input triggered by Edit button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>
          <hr className="divider-line" />
        </div>
 
        <div className="form-container">
          <h1>Saved Drafts</h1>
          {message && <div style={{ color: 'green' }}>{message}</div>}
          <div className="table-scroll">
          <table className="drafts-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Business Purpose</th>
                <th>Additional Notes</th>
                <th>Receipts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    {drafts.length === 0 ? "No drafts saved." : "No matching drafts found."}
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((draft) => (
                  <tr key={draft.expenseId}>
                    <td>{draft.expenseId}</td>
                    <td>{draft.description}</td>
                    <td>{draft.category}</td>
                    <td>₹{draft.amount}</td>
                    <td>{draft.date}</td>
                    <td>{draft.businessPurpose}</td>
                    <td>{draft.additionalNotes}</td>
                    <td>{draft.receipts || '—'}</td>
                    <td>
                    <div className="action-buttons">
                         <button  className="approve-btn" onClick={() => handleEdit(draft)}>Edit</button>
                       <button className="reject-btn" onClick={() => handleDelete(draft.expenseId)}>Delete</button>
                     
                       </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
          </div>
          <Link to="/claims/new" className="add-new-link">+ Add New Claim</Link>
        </div>
      </div>
    </div>
  );
}
 
export default Saveddrafts;