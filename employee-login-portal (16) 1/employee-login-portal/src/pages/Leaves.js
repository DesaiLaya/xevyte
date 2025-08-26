import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Leaves() {
  const employeeId = localStorage.getItem("employeeId");
  const role = localStorage.getItem("role");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);
  const [leavesData, setLeavesData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    casualTotal: 0,
    casualUsed: 0,
    sickTotal: 0,
    sickUsed: 0,
    lopUsed: 0,
  });
  const [isModalOpen, setIsModalToOpen] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState({
    id: null,
    type: 'Select',
    startDate: null,
    endDate: null,
    reason: '',
    uploadedFile: null,
    fileName: null
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [showLOPAlert, setShowLOPAlert] = useState(false);

  const isManager = role === "Manager";
  const isHR = role === "Hr";
  const today = new Date();

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`http://localhost:8082/leaves/holidays`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const holidayDates = data.map(h => new Date(h.holidayDate + 'T00:00:00'));
      setHolidays(holidayDates);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`http://localhost:8082/leaves/balance/${employeeId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLeaveBalance({
        casualTotal: data.casualTotal || 0,
        casualUsed: data.casualUsed || 0,
        sickTotal: data.sickTotal || 0,
        sickUsed: data.sickUsed || 0,
        lopUsed: data.lopUsed || 0,
      });
    } catch (err) {
      console.error("Failed to fetch leave balance:", err);
      alert("Failed to fetch leave balance. Please try again later.");
    }
  };

  const fetchLeaveHistory = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8082/leaves/employee/${employeeId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLeavesData(data);
    } catch (err) {
      console.error("Failed to fetch leave history:", err);
      alert("Failed to fetch leave history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
    fetchLeaveBalance();
    fetchHolidays();
    const loadDraft = () => {
      if (location.state && location.state.draftToEdit) {
        const draft = location.state.draftToEdit;
        setLeaveRequest({
          ...draft,
          startDate: draft.startDate ? new Date(draft.startDate + 'T00:00:00') : null,
          endDate: draft.endDate ? new Date(draft.endDate + 'T00:00:00') : null,
        });
        setIsModalToOpen(true);
        navigate(location.pathname, { replace: true });
      }
    };
    loadDraft();
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
  }, [employeeId, location.state, navigate, location.pathname]);

  useEffect(() => {
    const { startDate, endDate, type } = leaveRequest;
    if (startDate && endDate) {
      if (startDate > endDate) {
        setTotalDays(0);
        setFormError("End date must be on or after start date.");
        setShowLOPAlert(false);
        return;
      }
      let count = 0;
      let currentDate = new Date(startDate);
      const holidayDateStrings = new Set(holidays.map(h => h.toISOString().split('T')[0]));
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateStrings.has(dateString)) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setTotalDays(count);
      if (count === 0 && (startDate.toISOString().split('T')[0] !== endDate.toISOString().split('T')[0] || (startDate.getDay() === 0 || startDate.getDay() === 6 || holidayDateStrings.has(startDate.toISOString().split('T')[0])))) {
        setFormError("Selected date range contains no working days.");
      } else {
        setFormError("");
      }

      if (type === 'Casual' && (+leaveBalance.casualUsed + count) > +leaveBalance.casualTotal) {
        setShowLOPAlert(true);
      } else if (type === 'Sick' && (+leaveBalance.sickUsed + count) > +leaveBalance.sickTotal) {
        setShowLOPAlert(true);
      } else {
        setShowLOPAlert(false);
      }
    } else {
      setTotalDays(0);
      setFormError("");
      setShowLOPAlert(false);
    }
  }, [leaveRequest.startDate, leaveRequest.endDate, leaveRequest.type, leaveBalance, holidays]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModalClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) {
      setIsModalToOpen(false);
    }
  };

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
        setSuccessMessage("Profile picture updated successfully! ✅");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "type" && value === "Select") {
      setFormError("Please select a valid leave type.");
      setLeaveRequest({ ...leaveRequest, [name]: "Select" });
    } else {
      setFormError("");
      setLeaveRequest({ ...leaveRequest, [name]: value });
    }
  };

  const handleStartDateChange = (date) => {
    setLeaveRequest({ ...leaveRequest, startDate: date });
  };

  const handleEndDateChange = (date) => {
    setLeaveRequest({ ...leaveRequest, endDate: date });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setFileError("");
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError("Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.");
      setFile(null);
    } else if (selectedFile.size > maxSize) {
      setFileError("File size exceeds the 5MB limit.");
      setFile(null);
    } else {
      setFile(selectedFile);
      setFileError("");
    }
  };

  const resetForm = () => {
    setLeaveRequest({
      id: null,
      type: 'Select',
      startDate: null,
      endDate: null,
      reason: '',
      uploadedFile: null,
      fileName: null
    });
    setFile(null);
    setTotalDays(0);
    setFormError("");
    setFileError("");
    setShowLOPAlert(false);
  };

  const handleSaveDraft = () => {
    let savedDrafts = JSON.parse(localStorage.getItem("savedLeaveDrafts")) || [];
    const newDraft = {
      ...leaveRequest,
      id: leaveRequest.id || Date.now(),
      startDate: leaveRequest.startDate ? leaveRequest.startDate.toISOString().split('T')[0] : null,
      endDate: leaveRequest.endDate ? leaveRequest.endDate.toISOString().split('T')[0] : null,
      uploadedFile: file ? URL.createObjectURL(file) : null,
      fileName: file ? file.name : null,
    };

    if (leaveRequest.id) {
      const draftIndex = savedDrafts.findIndex(d => d.id === leaveRequest.id);
      if (draftIndex !== -1) {
        savedDrafts[draftIndex] = newDraft;
      }
    } else {
      savedDrafts.push(newDraft);
    }

    localStorage.setItem("savedLeaveDrafts", JSON.stringify(savedDrafts));
    setSuccessMessage("Leave request draft saved successfully! 📝");
    setIsModalToOpen(false);
    resetForm();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();

    if (leaveRequest.type === "Select") {
      setFormError("Please select a valid leave type.");
      return;
    }
    if (!leaveRequest.startDate || !leaveRequest.endDate) {
      setFormError("Start and End dates are required.");
      return;
    }
    if (leaveRequest.startDate > leaveRequest.endDate) {
      setFormError("End date must be on or after start date.");
      return;
    }
    if (!employeeId) {
      setFormError("Employee ID not found. Cannot submit request.");
      return;
    }
    if (fileError) {
      return;
    }

    // Check for document requirement for Sick Leave
    if (leaveRequest.type === "Sick" && totalDays >= 3 && !file) {
      setFileError("Document upload is mandatory for sick leave of 3 or more days.");
      return;
    }

    // Check if reason is provided
    if (!leaveRequest.reason || leaveRequest.reason.trim() === "") {
      setFormError("Reason for leave is required.");
      return;
    }

    const formData = new FormData();
    const dto = {
      employeeId: employeeId,
      type: leaveRequest.type,
      startDate: leaveRequest.startDate.toISOString().split('T')[0],
      endDate: leaveRequest.endDate.toISOString().split('T')[0],
      totalDays: totalDays,
      reason: leaveRequest.reason,
      status: "Pending" // Initial status on submission
    };

    formData.append("dto", new Blob([JSON.stringify(dto)], {
      type: "application/json"
    }));

    if (file) {
      formData.append("document", file);
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8082/leaves/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }

      setTotalDays(data.totalDays || 0);
      setLeavesData([data, ...leavesData]);
      setSuccessMessage("Leave request submitted successfully! 👍");

      // let savedDrafts = JSON.parse(localStorage.getItem("savedLeaveDrafts")) || [];
      // if (leaveRequest.id) {
      //   savedDrafts = savedDrafts.filter(d => d.id !== leaveRequest.id);
      //   localStorage.setItem("savedLeaveDrafts", JSON.stringify(savedDrafts));
      // }

    const handleSaveDraft = async () => {
  const dto = {
    id: leaveRequest.id,
    employeeId: employeeId,
    type: leaveRequest.type,
    startDate: leaveRequest.startDate ? leaveRequest.startDate.toISOString().split('T')[0] : null,
    endDate: leaveRequest.endDate ? leaveRequest.endDate.toISOString().split('T')[0] : null,
    reason: leaveRequest.reason,
    totalDays: totalDays,
    fileName: file ? file.name : leaveRequest.fileName,
  };

  const formData = new FormData();
  formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
  if (file) formData.append("document", file);

  try {
    const url = leaveRequest.id
      ? `http://localhost:8082/leaves/drafts/${leaveRequest.id}`
      : "http://localhost:8082/leaves/drafts";

    const method = leaveRequest.id ? "PUT" : "POST";

    const res = await fetch(url, { method, body: formData });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    setSuccessMessage("Draft saved successfully 📝");
    setIsModalToOpen(false);
    resetForm();
    setTimeout(() => setSuccessMessage(""), 3000);
  } catch (err) {
    console.error("Failed to save draft:", err);
    alert("Failed to save draft.");
  }
};



      setIsModalToOpen(false);
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setFormError(`Failed to submit leave request: ${error.message}`);
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleMyTasksClick = () => {
    if (isManager) {
      navigate('/manager/tasks');
    } else if (isHR) {
      navigate('/hr/tasks');
    }
  };

  const handleLeaveHistoryClick = () => {
    navigate('/leave-history');
  };

  const isButtonDisabled = !isManager && !isHR;

  // Highlight weekends in red, holidays in green
  const highlightDates = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    const isHoliday = holidays.some(
      (holiday) => holiday.toISOString().split('T')[0] === formattedDate
    );
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    if (isHoliday) {
      return "react-datepicker__day--highlighted-holiday";
    }
    if (isWeekend) {
      return "react-datepicker__day--highlighted-weekend";
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <style>
        {`
          .react-datepicker__day--highlighted-weekend {
            background-color: #ffcccc !important;
            color: #b30000 !important;
            border-radius: 50% !important;
          }
          .react-datepicker__day--highlighted-holiday {
            background-color: #ccffcc !important;
            color: #006600 !important;
            border-radius: 50% !important;
            font-weight: bold;
          }
          .date-picker-input {
            width: 100%;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #ddd;
            box-sizing: border-box; 
          }
        `}
      </style>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
            <h3><Link to="/hom" className="hom" style={{ textDecoration: 'none' }}><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Favourites <img src={require("../assets/star4.png")} alt="office" style={{ width: '22px', height: '22px' }} /></span></Link></h3>
            <h3><Link to="/home0" className="hom" style={{ textDecoration: 'none' }}>Claims</Link></h3>
            <h3><Link to="/home1" className="side" style={{ textDecoration: 'none' }}>Attendance</Link></h3>
            <h3><Link to="/home2" className="side" style={{ textDecoration: 'none' }}>Employee Handbook</Link></h3>
            <h3><Link to="/home3" className="side" style={{ textDecoration: 'none' }}>Employee Directory</Link></h3>
            <h3><Link to="/home4" className="side" style={{ textDecoration: 'none' }}>Exit Management</Link></h3>
            <h3><Link to="/home5" className="side" style={{ textDecoration: 'none' }}>Holiday Calendar</Link></h3>
            <h3><Link to="/home6" className="side" style={{ textDecoration: 'none' }}>HR Letters</Link></h3>
            <h3><Link to="/home7" className="side" style={{ textDecoration: 'none' }}>My Info</Link></h3>
            <h3><Link to="/home8" className="side" style={{ textDecoration: 'none' }}>Performance Management</Link></h3>
            <h3><Link to="/home9" className="side" style={{ textDecoration: 'none' }}>Policies</Link></h3>
            <h3><Link to="/home10" className="side" style={{ textDecoration: 'none' }}>Recruitment</Link></h3>
          </>
        ) : (
          <div className="collapsed-wrapper">
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>
      <div className="main-content">
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
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        <div style={{ flex: '1', padding: '20px', overflowY: 'auto' }}>
          {successMessage && <div style={{ textAlign: 'center', color: '#4BB543', margin: '20px', fontWeight: 'bold' }}>{successMessage}</div>}
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Leaves Dashboard </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Casual Leaves Card */}
            <div style={{ padding: '20px', backgroundColor: '#e6f7ff', borderRadius: '8px', borderLeft: '5px solid #1890ff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>Casual Leaves</h4>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1890ff' }}> {Math.max(0, (+leaveBalance.casualTotal || 0) - (+leaveBalance.casualUsed || 0))}</div>
              <p style={{ margin: '0', color: '#666' }}>
                days available
                <span style={{ display: 'block', fontSize: '12px', color: '#555' }}>
                  Used: {leaveBalance.casualUsed} / Total: {leaveBalance.casualTotal}
                </span>
              </p>
            </div>
            {/* Sick Leaves Card */}
            <div style={{ padding: '20px', backgroundColor: '#fffbe6', borderRadius: '8px', borderLeft: '5px solid #faad14', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#faad14' }}>Sick Leaves</h4>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#faad14' }}>{Math.max(0, (+leaveBalance.sickTotal || 0) - (+leaveBalance.sickUsed || 0))}
              </div>
              <p style={{ margin: '0', color: '#666' }}>
                days available
                <span style={{ display: 'block', fontSize: '12px', color: '#555' }}>
                  Used: {leaveBalance.sickUsed} / Total: {leaveBalance.sickTotal}
                </span>
              </p>
            </div>
            {/* LOP Card */}
            <div style={{ padding: '20px', backgroundColor: '#f0f9eb', borderRadius: '8px', borderLeft: '5px solid #52c41a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#52c41a' }}>LOP</h4>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#52c41a' }}>{leaveBalance.lopUsed}</div>
              <p style={{ margin: '0', color: '#666' }}>
                days used
              </p>
            </div>
          </div>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
            <button onClick={() => { setIsModalToOpen(true); resetForm(); }} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>Apply for Leave</button>
            <button onClick={() => navigate('/saved-drafts')} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#ffc107', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>Saved Drafts</button>
            <button onClick={handleLeaveHistoryClick} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>Leave History</button>
            <button onClick={handleMyTasksClick} disabled={isButtonDisabled} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: isButtonDisabled ? '#ccc' : "#1890ff", color: 'white', border: 'none', borderRadius: '5px', cursor: isButtonDisabled ? 'not-allowed' : 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>My Tasks</button>
          </div>

          {isModalOpen && (
            <div ref={modalRef} onClick={handleModalClick} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
              <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative' }}>
                <h3 style={{ marginBottom: '20px' }}>Apply for Leave</h3>
                <button onClick={() => setIsModalToOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa' }}>&times;</button>
                <form onSubmit={handleSubmitLeave}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Leave Type<span style={{ color: 'red' }}> *</span>
                    </label>
                    <select name="type" value={leaveRequest.type} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
                      <option value="Select" disabled>Select</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Paternity">Paternity Leave</option>
                      <option value="Maternity">Maternity Leave</option>
                      <option value="LOP">LOP</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Start Date<span style={{ color: 'red' }}> *</span>
                    </label>
                    <DatePicker
                      selected={leaveRequest.startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={leaveRequest.startDate}
                      endDate={leaveRequest.endDate}
                      minDate={null} // Allows any past date
                      maxDate={leaveRequest.type === 'Sick' ? new Date() : null} // Restricts future dates for Sick Leave ONLY
                      dayClassName={highlightDates}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="YYYY-MM-DD"
                      className="date-picker-input"
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      End Date<span style={{ color: 'red' }}> *</span>
                    </label>
                    <DatePicker
                      selected={leaveRequest.endDate}
                      onChange={handleEndDateChange}
                      selectsEnd
                      startDate={leaveRequest.startDate}
                      endDate={leaveRequest.endDate}
                      minDate={leaveRequest.startDate} // Ensures end date is on or after start date
                      dayClassName={highlightDates}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="YYYY-MM-DD"
                      className="date-picker-input"
                    />
                    {formError && <p style={{ color: '#FF4136', fontSize: '12px', marginTop: '5px' }}>{formError}</p>}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Total Days<span style={{ color: 'red' }}> *</span>
                    </label>
                    <input type="text" name="totalDays" value={totalDays} readOnly style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
                    {showLOPAlert && (
                      <p style={{ color: '#FF4136', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>
                        Note: You have already utilized your allocated leaves. Excess leaves will be marked as LOP.
                      </p>
                    )}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Upload Document
                      {(leaveRequest.type === 'Sick' && totalDays >= 3) && <span style={{ color: 'red' }}> *</span>}
                      <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>(PDF, JPG, JPEG, and PNG, max 5MB)</span>
                    </label>
                    <input
                      type="file"
                      name="document"
                      onChange={handleFileChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                    {fileError && <p style={{ color: '#FF4136', fontSize: '12px', marginTop: '5px' }}>{fileError}</p>}
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Reason<span style={{ color: 'red' }}> *</span>
                    </label>
                    <textarea name="reason" value={leaveRequest.reason} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '100px', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <button type="button" onClick={handleSaveDraft} style={{ flex: 1, padding: '12px', fontSize: '16px', backgroundColor: '#ffc107', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>Save Draft</button>
                    <button type="submit" disabled={loading || fileError || leaveRequest.type === "Select" || formError} style={{ flex: 1, padding: '12px', fontSize: '16px', backgroundColor: (loading || fileError || leaveRequest.type === "Select" || formError) ? '#ccc' : '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: (loading || fileError || leaveRequest.type === "Select" || formError) ? 'not-allowed' : 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>{loading ? 'Submitting...' : 'Submit Leave'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaves;