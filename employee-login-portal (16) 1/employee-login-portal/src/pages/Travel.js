import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Travel.css';

function Travel() {
  const employeeId = localStorage.getItem("employeeId");
  const role = localStorage.getItem("role");
  const adminId = (role === "admin") ? employeeId : null;
  const [selectedFiles, setSelectedFiles] = useState({});

  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || '');
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('New Ticket');
  
  const [newRequest, setNewRequest] = useState({
    name: '',
    fromLocation: '',
    toLocation: '',
    modeOfTravel: 'Select',
    category: 'Select',
    departureDate: '',
    returnDate: '',
    accommodationRequired: 'No',
    advanceRequired: 'No',
    remarks: '',
    employeeId: employeeId,
  });
  const [activeTickets, setActiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);

  const handleFileChange = (requestId, e) => {
  setSelectedFiles(prev => ({ ...prev, [requestId]: e.target.files[0] }));
};
const handleUpload = async (requestId) => {
  const file = selectedFiles[requestId];
  if (!file) {
    alert("Please select a PDF file before submitting.");
    return;
  }
  if (file.type !== "application/pdf") {
    alert("Only PDF files are allowed.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`http://localhost:8082/api/travel/admin/upload-pdf/${requestId}`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("PDF uploaded successfully.");

      // Remove the request from pendingRequests so it doesn't show again
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));

      // Clear the selected file for this request
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } else {
      const error = await res.text();
      alert("Upload failed: " + error);
    }
  } catch (err) {
    alert("Error uploading PDF: " + err.message);
  }
};


  // **FIX:** Initialize drafts from localStorage, or an empty array if none exist
  const [drafts, setDrafts] = useState(() => {
    try {
      const savedDrafts = localStorage.getItem(`travelDrafts_${employeeId}`);
      return savedDrafts ? JSON.parse(savedDrafts) : [];
    } catch (error) {
      console.error("Failed to parse drafts from localStorage", error);
      return [];
    }
  });

  // **FIX:** Use useEffect to save drafts to localStorage whenever the 'drafts' state changes
  useEffect(() => {
    localStorage.setItem(`travelDrafts_${employeeId}`, JSON.stringify(drafts));
  }, [drafts, employeeId]);


  // Fetch employee profile data
  useEffect(() => {
    if (employeeId) {
      fetch(`http://localhost:8082/profile/${employeeId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch profile data');
          }
          return res.json();
        })
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

  // Handle clicks outside the profile dropdown
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

  // Fetches tickets based on the endpoint and sets state
  const fetchTickets = (endpoint, setState) => {
    fetch(`http://localhost:8082/api/travel/${endpoint}/${employeeId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch ${endpoint}`);
        }
        return res.json();
      })
      .then(data => setState(data))
      .catch(err => console.error(`Error fetching ${endpoint}:`, err));
  };

  // Corrected function to fetch pending requests based on role
  const fetchPendingRequests = () => {
    if (role === "Manager") {
      // Corrected endpoint for manager pending requests
      fetch(`http://localhost:8082/api/travel/manager/pending/${employeeId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch pending requests');
          return res.json();
        })
        .then(data => setPendingRequests(data))
        .catch(err => console.error("Error fetching pending requests:", err));
    } else if (role === "admin") {
      // Corrected endpoint for admin pending requests
      fetch(`http://localhost:8082/api/travel/admin/assigned-requests/${adminId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch pending requests for admin');
          return res.json();
        })
        .then(data => setPendingRequests(data))
        .catch(err => console.error("Error fetching admin pending requests:", err));
    }
  };

  // Effect to fetch data for active and history tabs
  useEffect(() => {
    if (activeTab === 'History') {
      fetchTickets('history', setHistoryTickets);
    } else if (activeTab === 'Awaiting Approval') {
      fetchTickets('active', setActiveTickets);
    }
  }, [activeTab, employeeId]);

  // Effect to fetch data for manager's/admin's pending requests tab
  useEffect(() => {
    if (activeTab === "Pending Requests" && (role === "Manager" || role === "admin")) {
      fetchPendingRequests();
    }
  }, [activeTab, employeeId, role]);

  // Approve a travel request (Manager/Admin function)
  const handleApprove = async (id) => {
    try {
      const params = new URLSearchParams({ managerId: employeeId });
      const res = await fetch(`http://localhost:8082/api/travel/approve/${id}?${params.toString()}`, {
        method: "PUT"
      });
      if (res.ok) {
        alert("Request approved!");
        fetchPendingRequests();
      } else {
        alert("Failed to approve request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving request.");
    }
  };

  // Reject a travel request (Manager/Admin function)
const handleReject = async (id) => {
  let remarks = prompt("Enter rejection reason (minimum 10 characters):");
  if (remarks === null) return; // user cancelled
  remarks = remarks.trim();
  if (remarks.length < 10) {
    alert("Rejected reason must be at least 10 characters.");
    return;
  }

  try {
    const params = new URLSearchParams({
      managerId: employeeId,
      rejectedReason: remarks // match backend param name
    });

    const res = await fetch(`http://localhost:8082/api/travel/reject/${id}?${params.toString()}`, {
      method: "PUT"
    });

    if (res.ok) {
      alert("Request rejected!");
      fetchPendingRequests();
    } else {
      alert("Failed to reject request. Please try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Error rejecting request.");
  }
};


  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleProfileMenu = () => setProfileOpen(!profileOpen);

  const handleLogout = () => {
    
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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.profilePic) {
        setProfilePic(data.profilePic);
        localStorage.setItem("employeeProfilePic", data.profilePic);
        setSuccessMessage("Profile picture updated successfully! 🎉");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Failed to update profile picture: no profilePic returned.");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error uploading profile picture. See console for details.");
    } finally {
      setProfileOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for clearing the form fields
  const handleCancel = (e) => {
    e.preventDefault();
    setNewRequest({
      name: '',
      fromLocation: '',
      toLocation: '',
      modeOfTravel: 'Select',
      category: 'Select',
      departureDate: '',
      returnDate: '',
      accommodationRequired: 'No',
      advanceRequired: 'No',
      remarks: '',
      employeeId: employeeId,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Check ALL required fields first, before doing any date calculations.
  const requiredFields = [
    'category',
    'modeOfTravel',
    'fromLocation',
    'toLocation',
    'departureDate',
    'accommodationRequired',
    'advanceRequired',
  ];

  for (const field of requiredFields) {
    const value = newRequest[field];
    if (!value || (typeof value === 'string' && value.trim() === '') || value === 'Select') {
      // Use a custom modal or a simple alert as a placeholder
      // Do not use `window.alert()` in production code
      alert(`Please fill in the required field: ${field}`);
      return; // Stop submission if any required field is empty
    }
  }

  // 2. Now that you know all required fields are filled,
  // proceed with date validations.
  const { category, departureDate, returnDate } = newRequest;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depart = new Date(departureDate);
  depart.setHours(0, 0, 0, 0);
  const returnD = returnDate ? new Date(returnDate) : null;
  if (returnD) returnD.setHours(0, 0, 0, 0);

  if (depart < today) {
    alert("Departure date cannot be in the past.");
    return;
  }

  if (returnD && returnD < depart) {
    alert("Return date cannot be before the departure date.");
    return;
  }

  // 3. Category-specific date validation.
  // This logic is already correct, as it runs after the required fields are checked.
  if (category === 'Domestic') {
    const minDomesticDate = new Date(today);
    minDomesticDate.setDate(today.getDate() + 7);
    if (depart < minDomesticDate) {
      alert("For domestic travel, the ticket must be booked at least one week in advance.");
      return;
    }
  } else if (category === 'International') {
    const minInternationalDate = new Date(today);
    minInternationalDate.setDate(today.getDate() + 30);
    if (depart < minInternationalDate) {
      alert("For international travel, the ticket must be booked at least one month in advance.");
      return;
    }
  }

  // 4. Submit request
  const requestData = {
    ...newRequest,
    employeeId: employeeId,
    name: employeeName
  };

  console.log("Submitting request:", requestData);

  try {
    const res = await fetch("http://localhost:8082/api/travel/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (res.ok) {
      alert("Travel request submitted successfully!");
      setNewRequest({
        name: '',
        fromLocation: '',
        toLocation: '',
        modeOfTravel: 'Select',
        category: 'Select',
        departureDate: '',
        returnDate: '',
        accommodationRequired: 'No',
        advanceRequired: 'No',
        remarks: '',
        employeeId: employeeId
      });
    } else {
      const errorText = await res.text();
      alert(`Failed to submit travel request: ${errorText}`);
    }
  } catch (error) {
    console.error("Error submitting travel request:", error);
    alert("Error submitting travel request. Please check the console for details.");
  }
};

// Save Draft
const handleSaveDraft = (e) => {
  e.preventDefault();
  const newDraft = { ...newRequest, id: Date.now() }; 

  setDrafts(prevDrafts => {
    const updatedDrafts = [...prevDrafts, newDraft];
    // Save the updated list to local storage using employee-specific key
    localStorage.setItem(`travelDrafts_${employeeId}`, JSON.stringify(updatedDrafts));
    return updatedDrafts;
  });

  setNewRequest({
    name: '',
    fromLocation: '',
    toLocation: '',
    modeOfTravel: 'Select',
    category: 'Select',
    departureDate: '',
    returnDate: '',
    accommodationRequired: 'No',
    advanceRequired: 'No',
    remarks: '',
    employeeId: employeeId,
  });

  alert("Draft saved successfully!");
};

// Edit Draft
const handleEditDraft = (draft) => {
  setNewRequest(draft);
  setActiveTab('New Ticket');
  handleDeleteDraft(draft.id, false); // Skip alert when editing
};

// Delete Draft
const handleDeleteDraft = (id, showAlert = true) => {
  setDrafts(prevDrafts => {
    const updatedDrafts = prevDrafts.filter(draft => draft.id !== id);
    localStorage.setItem(`travelDrafts_${employeeId}`, JSON.stringify(updatedDrafts));
    return updatedDrafts;
  });

  if (showAlert) {
    alert("Draft deleted successfully!");
  }
};


  // ------------------------------------------------------
// This is the line that needs to be updated.
// Change 'search.toLowerCase()' to 'searchTerm.toLowerCase()'.
const filteredHistory = historyTickets.filter(ticket =>
  Object.values(ticket).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);

const filteredDrafts = drafts.filter(draft =>
  Object.values(draft).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);

const filteredActiveTickets = activeTickets.filter(ticket =>
  Object.values(ticket).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);


const filteredPendingRequests = pendingRequests.filter(req =>
  Object.values(req).some(value =>
    value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )
);
  const thStyle = { backgroundColor: '#131212ff' };

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
          <h2 >Welcome, {employeeName} ({employeeId})</h2>
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

        <div className="travel-management">
          <div className="tabs">
            {['New Ticket', 'Awaiting Approval', 'History', 'Drafts', ...(role === "Manager" || role === "admin" ? ['Pending Requests'] : [])].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'tab active' : 'tab'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="travel-content">
{activeTab === 'New Ticket' && (
  <>
    <p className="warning-text">
      {newRequest.category === 'Domestic'
        ? 'Kindly book the ticket at least one week before the travel date.'
        : newRequest.category === 'International'
        ? 'Kindly book the ticket at least one month before the travel date.'
        : 'Welcome! Please fill out the form to create a new travel ticket.' // New default message
      }
    </p>
<form>
  <div
    className="travelform-container"
    style={{
      display: 'flex',
      gap: '40px',         // space between columns
      justifyContent: 'space-between',
      flexWrap: 'wrap',    // wrap on small screens
    }}
  >
    <div
      className="travelform-column"

    >
      <label style={{ display: 'block', marginBottom: '7px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          Category <span style={{ color: 'red' }}>*</span>
        </span>
        <select
          name="category"
          value={newRequest.category}
          onChange={(e) => {
            handleInputChange(e);
            if (e.target.value === 'International') {
              handleInputChange({
                target: { name: 'modeOfTravel', value: 'Flight' },
              });
            }
          }}
          required
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        >
          <option value="">Select</option>
          <option value="Domestic">Domestic</option>
          <option value="International">International</option>
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: '7px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          Mode of Travel <span style={{ color: 'red' }}>*</span>
        </span>
        <select
          name="modeOfTravel"
          value={newRequest.modeOfTravel}
          onChange={handleInputChange}
          required
          disabled={newRequest.category === 'International'}
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        >
          {newRequest.category === 'International' ? (
            <option value="Flight">Flight</option>
          ) : (
            <>
              <option value="">Select</option>
              <option value="Flight">Flight</option>
              <option value="Bus">Bus</option>
              <option value="Train">Train</option>
            </>
          )}
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: '0px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          From <span style={{ color: 'red' }}>*</span>
        </span>
        <input
          name="fromLocation"
          value={newRequest.fromLocation}
          onChange={handleInputChange}
          required
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '0' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          To <span style={{ color: 'red' }}>*</span>
        </span>
        <input
          name="toLocation"
          value={newRequest.toLocation}
          onChange={handleInputChange}
          required
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        />
      </label>
    </div>

    <div
      className="travelform-column"
  
    >
      <label style={{ display: 'block', marginBottom: '-7px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          Depart Date <span style={{ color: 'red' }}>*</span>
        </span>
        <input
          type="date"
          name="departureDate"
          value={newRequest.departureDate}
          onChange={handleInputChange}
          required
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '-9px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          Return Date
        </span>
        <input
          type="date"
          name="returnDate"
          value={newRequest.returnDate}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '15px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          Accommodation Required <span style={{ color: 'red' }}>*</span>
        </span>
        <select
          name="accommodationRequired"
          value={newRequest.accommodationRequired}
          onChange={handleInputChange}
          required
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: '15px' }}>
        <span style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
          Advance Required <span style={{ color: 'red' }}>*</span>
        </span>
        <select
          name="advanceRequired"
          value={newRequest.advanceRequired}
          onChange={handleInputChange}
          required
          style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </label>
    </div>
  </div>

  <label style={{ display: 'block', marginTop: '0', fontWeight: '600' }}>
    Remarks
    <textarea
      name="remarks"
      value={newRequest.remarks}
      onChange={handleInputChange}
      rows="4"
      placeholder="Add any additional remarks here..."
      style={{
        width: '100%',
        marginTop: '8px',
        padding: '0px',
        fontSize: '1rem',
        resize: 'vertical',
      }}
    ></textarea>
  </label>

  <div
    className="submit-button-container"
  >
    <button className="submit-button" onClick={handleSaveDraft} type="button">
      Save Draft
    </button>
    <button className="submit-button" type="submit" onClick={handleSubmit}>
      Submit Request
    </button>
    <button className="submit-button" type="button" onClick={handleCancel}>
      Cancel
    </button>
  </div>
</form>

  </>
)}

{activeTab === 'Awaiting Approval' && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Active Travel Requests</h3>
    {/* Use filteredActiveTickets here */}
    {filteredActiveTickets.length === 0 ? (
      <p>No active requests found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}
      >
        <thead
          className="columns-header"
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Mode of Travel</th>
            <th style={thStyle}>Depart Date</th>
            <th style={thStyle}>Return Date</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={thStyle}>Accommodation Required</th>
            <th style={thStyle}>Advance Required</th>
            <th style={thStyle}>Remarks</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Download Ticket</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredActiveTickets for the map function */}
          {filteredActiveTickets.map((ticket) => (
            <tr key={ticket.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {new Date(ticket.departureDate).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.returnDate}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.advanceRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.remarks}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.status}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {ticket.pdfFileName ? (
                  <span
                    style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={async () => {
                      try {
                        // 1. Fetch PDF as blob
                        const response = await fetch(`http://localhost:8082/api/travel/download-pdf/${ticket.id}`);
                        if (!response.ok) throw new Error('Failed to download file');
                        const blob = await response.blob();
                        // 2. Trigger browser download
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = ticket.pdfFileName;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                        // 3. Call API to mark as downloaded
                        await fetch(`http://localhost:8082/api/travel/mark-downloaded/${ticket.id}`, {
                          method: 'PUT',
                        });
                        // 4. Update activeTickets state - you must implement this part to remove the ticket from list
                        setActiveTickets((prev) => prev.filter(t => t.id !== ticket.id));
                      } catch (error) {
                        alert('Error downloading ticket: ' + error.message);
                      }
                    }}
                  >
                    {ticket.pdfFileName}
                  </span>
                ) : (
                  ' - '
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

{activeTab === 'History' && (
  <div
    style={{
      height: 'calc(100vh - 200px)',  // fixed height like Drafts for scrolling
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Booking History</h3>
    {/* <div style={{ marginBottom: '10px' }}>
      <input
        type="text"
        placeholder="Search history..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '8px' }}
      />
    </div> */}
    {filteredHistory.length === 0 ? (
      <p>No bookings found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{
          width: '100%',
          textAlign: 'left',
          borderCollapse: 'collapse',
        }}
      >
<thead
  style={{
    position: 'sticky',
    top: 0,
    backgroundColor: '#f2f2f2',
    zIndex: 1,
  }}
>
  <tr>
    <th className="table-header-cell">
      
        Category 
      
    </th>
    <th className="table-header-cell">

        Mode of Travel 
     
    </th>
    <th className="table-header-cell">
    
        Depart Date
    </th>
    <th className="table-header-cell">

        Return Date 
      
    </th>
    <th className="table-header-cell">
      From
      
    </th>
    <th className="table-header-cell">
      To
      
    </th>
    <th className="table-header-cell">
      Accommodation
      
    </th>
    <th className="table-header-cell">
      Advance
      
    </th>
    <th className="table-header-cell">
      Remarks
      
    </th>
    <th className="table-header-cell">
    
        Status
      
    </th>
 <th className="table-header-cell">
  Rejected Reason

</th>

    <th className="table-header-cell">
      Download Ticket
      
    </th>
  </tr>
</thead>
 <tbody>
  {filteredHistory.map((ticket) => (
    <tr key={ticket.id}>
      {/* <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.id}</td> */}
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.category}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.modeOfTravel}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
        {new Date(ticket.departureDate).toLocaleDateString()}
      </td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.returnDate}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.fromLocation}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.toLocation}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.accommodationRequired}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.advanceRequired}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.remarks}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.status}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{ticket.rejectedReason}</td>
      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
        {ticket.pdfFileName ? (
          <a
            href={`http://localhost:8082/api/travel/download-pdf/${ticket.id}`}
            target="_blank"
            rel="noopener noreferrer"
            download={ticket.pdfFileName}
          >
            {ticket.pdfFileName}
          </a>
        ) : (
          ' - '
        )}
      </td>
    </tr>
  ))}
</tbody>
      </table>
    )}
  </div>
)}

{activeTab === 'Pending Requests' && (role === "Manager" ) && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Pending Travel Requests</h3>
    {/* Use filteredPendingRequests for the length check */}
    {filteredPendingRequests.length === 0 ? (
      <p>No pending requests found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            <th style={thStyle}>Employee ID</th>
            <th style={thStyle}>Employee Name</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Mode of Travel</th>
            <th style={thStyle}>Depart Date</th>
            <th style={thStyle}>Return Date</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={thStyle}>Accommodation Required</th>
            <th style={thStyle}>Advance Required</th>
            <th style={thStyle}>Remarks</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredPendingRequests for the map function */}
          {filteredPendingRequests.map((req) => (
            <tr key={req.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeId}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeName}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {new Date(req.departureDate).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.returnDate}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.advanceRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.remarks}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <button
                  onClick={() => handleApprove(req.id)}
                  style={{
                    marginRight: '10px',
                    backgroundColor: 'green',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  style={{
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
{activeTab === 'Pending Requests' && (role === "admin") && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Pending Travel Requests</h3>
    {/* Use filteredPendingRequests for the length check */}
    {filteredPendingRequests.length === 0 ? (
      <p>No pending requests found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            <th style={thStyle}>Employee ID</th>
            <th style={thStyle}>Employee Name</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Mode of Travel</th>
            <th style={thStyle}>Depart Date</th>
            <th style={thStyle}>Return Date</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={thStyle}>Accommodation Required</th>
            <th style={thStyle}>Advance Required</th>
            <th style={thStyle}>Remarks</th>
            <th style={thStyle}>Upload Ticket (PDF)*</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredPendingRequests for the map function */}
          {filteredPendingRequests.map((req) => (
            <tr key={req.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeId}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.employeeName}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {new Date(req.departureDate).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.returnDate}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.advanceRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{req.remarks}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <label
                  htmlFor={`file-upload-${req.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: '#6e7073ff',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    userSelect: 'none',
                  }}
                >
                  Choose File
                </label>
                <input
                  id={`file-upload-${req.id}`}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(req.id, e)}
                />
                <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#333' }}>
                  {selectedFiles[req.id] ? selectedFiles[req.id].name : 'No file selected'}
                </div>
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <button
                  onClick={() => handleUpload(req.id)}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  Confirm
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}


{activeTab === 'Drafts' && (
  <div
    style={{
      height: 'calc(100vh - 200px)',
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: '0px',
    }}
  >
    <h3>Saved Drafts</h3>
    {/* Use filteredDrafts for the length check */}
    {filteredDrafts.length === 0 ? (
      <p>No drafts found.</p>
    ) : (
      <table
        border="1"
        cellPadding="10"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#f2f2f2',
            zIndex: 1,
          }}
        >
          <tr>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Mode of Travel</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={thStyle}>Depart Date</th>
            <th style={thStyle}>Return Date</th>
            <th style={thStyle}>Accommodation Required</th>
            <th style={thStyle}>Advance Required</th>
            <th style={thStyle}>Remarks</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Use filteredDrafts for the map function */}
          {filteredDrafts.map((draft) => (
            <tr key={draft.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.category}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.modeOfTravel}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.fromLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.toLocation}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.departureDate}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.returnDate}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.accommodationRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.advanceRequired}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{draft.remarks}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <button
                  onClick={() => handleEditDraft(draft)}
                  style={{
                    marginRight: '5px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    margin: '2px'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
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
    )}
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Travel;