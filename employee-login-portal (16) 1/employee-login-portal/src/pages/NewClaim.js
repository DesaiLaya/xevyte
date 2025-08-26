import "./Newclaim.css";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";

function NewClaim() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const [searchTerm, setSearchTerm] = useState("");

  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  // Store the original draft's ID
  const [originalDraftId, setOriginalDraftId] = useState(null);

  const employeeId = localStorage.getItem("employeeId");
  const employeeName = localStorage.getItem("employeeName");
  const allowedCategories = ["Food", "Accomodation", "Travel", "Medical", "Mobile", "Office", "Others"];
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));

  const [successMessage, setSuccessMessage] = useState("");

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    expenseDescription: "",
    category: "",
    amount: "",
    expenseDate: getTodayDate(),
    businessPurpose: "",
    additionalNotes: ""
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const id = localStorage.getItem("employeeId") || "";
    const name = localStorage.getItem("employeeName") || "";
    setFormData((prev) => ({ ...prev, employeeId: id, name }));

    if (id) {
      fetch(`http://localhost:8082/profile/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem("employeeProfilePic", data.profilePic);
          }
          if (data.name) {
            localStorage.setItem("employeeName", data.name);
          }
        })
        .catch(err => console.error("Profile fetch failed:", err));
    }

    if (location.state && location.state.draftData) {
      const draft = location.state.draftData;
      setFormData((prev) => ({
        ...prev,
        employeeId: id,
        name,
        expenseDescription: draft.description || "",
        category: draft.category || "",
        amount: draft.amount || "",
        expenseDate: draft.date || "",
        businessPurpose: draft.businessPurpose || "",
        additionalNotes: draft.additionalNotes || ""
      }));
      setReceiptFile(null); // User must re-upload
      setDraftLoaded(true);
      // Store the ID of the draft we are editing
      setOriginalDraftId(draft.expenseId);
    } else {
      // If no draft is loaded, default the date to today's date
      setFormData((prev) => ({ ...prev, expenseDate: getTodayDate() }));
    }
  }, [location.state]);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target) &&
        !profileInputRef.current?.contains(e.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
        setSuccessMessage("Profile picture updated!");
        setTimeout(() => setSuccessMessage(""), 2000);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload profile image");
    }
  };

  const handleEditProfile = () => {
    setIsProfileMenuOpen(false);
    profileInputRef.current.click();
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const getMaxDate = () => new Date().toISOString().split("T")[0];
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split("T")[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        setError("Unsupported file type. Allowed: JPG, PNG, PDF");
        setReceiptFile(null);
        e.target.value = null;
        return;
      }
      if (file.size > maxFileSize) {
        setError("File size exceeds 5MB limit.");
        setReceiptFile(null);
        e.target.value = null;
        return;
      }
      setError("");
      setReceiptFile(file);
    } else {
      setReceiptFile(null);
    }
  };

  const validateRequired = () => {
    const errors = {};
    if (!formData.expenseDescription.trim()) errors.expenseDescription = "Required";
    if (!formData.category || formData.category === "Select category") errors.category = "Required";
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = "Amount must be > 0";

    if (!formData.expenseDate) {
      errors.expenseDate = "Required";
    } else {
      const selectedDate = new Date(formData.expenseDate);
      const today = new Date();

      // Set both dates to the start of the day to ignore time for comparison
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const ninetyDaysAgoStart = new Date(todayStart);
      ninetyDaysAgoStart.setDate(todayStart.getDate() - 90);

      const selectedDateStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

      if (selectedDateStart > todayStart) {
        errors.expenseDate = "Date cannot be in the future.";
      } else if (selectedDateStart < ninetyDaysAgoStart) {
        errors.expenseDate = "Date must be within the last 90 days.";
      }
    }

    if (!formData.businessPurpose.trim()) errors.businessPurpose = "Required";
    if (!receiptFile) errors.receiptFile = "Required";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fill in all required fields correctly.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateRequired()) return;

    const data = new FormData();
    data.append("claim", JSON.stringify(formData));
    data.append("receiptFile", receiptFile);

    try {
      const res = await axios.post("http://localhost:8082/claims/submit", data);
      setMessage("Expense claim submitted successfully!");
      setError("");

      // Delete the draft from local storage if one was loaded
      if (originalDraftId) {
        const savedDrafts = JSON.parse(localStorage.getItem('expenseClaimDrafts')) || [];
        const updatedDrafts = savedDrafts.filter(d => d.expenseId !== originalDraftId);
        localStorage.setItem('expenseClaimDrafts', JSON.stringify(updatedDrafts));
      }

      setFormData((prev) => ({
        ...prev,
        category: "",
        amount: "",
        expenseDescription: "",
        expenseDate: getTodayDate(),
        businessPurpose: "",
        additionalNotes: ""
      }));
      setReceiptFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      setTimeout(() => setMessage(""), 2000);

    } catch (err) {
      console.error(err);
      setError("Submission failed. Try again.");
      setMessage("");
    }
  };

  const handleSaveDraft = () => {
    const savedDrafts = JSON.parse(localStorage.getItem('expenseClaimDrafts')) || [];
    let newDraftId = originalDraftId || Date.now();

    const newDraft = {
      expenseId: newDraftId,
      description: formData.expenseDescription,
      category: formData.category,
      amount: formData.amount,
      date: formData.expenseDate,
      status: 'pending',
      receipts: receiptFile ? receiptFile.name : '0 file',
      businessPurpose: formData.businessPurpose,
      additionalNotes: formData.additionalNotes
    };

    // If we're editing an existing draft, filter out the old one first
    const draftsToSave = originalDraftId
      ? savedDrafts.filter(d => d.expenseId !== originalDraftId)
      : savedDrafts;
      
    draftsToSave.push(newDraft);
    localStorage.setItem('expenseClaimDrafts', JSON.stringify(draftsToSave));
    setMessage("Draft saved successfully!");
    setError("");
    setTimeout(() => setMessage(""), 2000);

    // Clear the form fields after saving
    setFormData((prev) => ({
      ...prev,
      category: "",
      amount: "",
      expenseDescription: "",
      expenseDate: getTodayDate(),
      businessPurpose: "",
      additionalNotes: ""
    }));
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return (
    <div className="claims-container">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
            <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="logo" className="office-vng" />
            <img src={require("../assets/gg_move-left.png")} alt="collapse" className="toggle-btn" onClick={toggleSidebar} style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }} />
            <h3><Link to="/hom" className="hom" style={{ textDecoration: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                Favourites
                <img
                  src={require("../assets/star4.png")}
                  alt="office"
                  style={{ width: '22px', height: '22px' }}
                />
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
            <img src={require("../assets/Group.png")} alt="expand" className="collapsed-toggle" onClick={toggleSidebar} />
          </div>
        )}
      </div>

      <div className="main-area">

        <div className="dashboard-header">
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

              {/* Profile picture with dropdown */}
              <div className="profile-wrapper" style={{ position: 'relative' }}>
                <img
                  src={profilePic}
                  alt="Profile"
                  className="profile-pic"
                  onClick={toggleProfileMenu}
                  style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                {isProfileMenuOpen && (
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

                {/* Success message */}
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

              </div>

              {/* Hidden file input for profile pic upload */}
              <input
                type="file"
                ref={profileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </div>
          </div>

          <hr className="divider-line" />
        </div>

        <div className="new-claim-wrapper">
          <Link to="/home0" className="back-link">← Back</Link>
          <h2 className="page-title">New Expense Claim</h2>
          <p className="page-subtitle">Submit a new expense claim for reimbursement</p>

          <div className="form-main-layout">
            <div className="expense-details">
              <h3>Expense Details</h3>
              <div className="form-group">
                <label>Employee ID</label>
                <input type="text" value={formData.employeeId} readOnly />
              </div>
              <div className="form-group">
                <label>Employee Name</label>
                <input type="text" value={formData.name} readOnly />
              </div>
              <div className="form-group">
                <label>Expense Description *</label>
                <input
                  name="expenseDescription"
                  value={formData.expenseDescription}
                  onChange={handleChange}
                  placeholder="Enter a brief description of the expense (max 255 characters)"
                  maxLength={255}
                />
                {fieldErrors.expenseDescription && (
                  <p className="error-text">{fieldErrors.expenseDescription}</p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option>Select category</option>
                    {allowedCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <p className="error-text">{fieldErrors.category}</p>}
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                  />
                  {fieldErrors.amount && <p className="error-text">{fieldErrors.amount}</p>}
                </div>
              </div>
              <div className="form-group">
                <label>Expense Date *</label>
                <input
                  type="date"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleChange}
                  onKeyDown={(e) => e.preventDefault()}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
                {fieldErrors.expenseDate && <p className="error-text">{fieldErrors.expenseDate}</p>}
              </div>
              <div className="form-group">
                <label>Business Purpose *</label>
                <textarea name="businessPurpose" value={formData.businessPurpose} onChange={handleChange} />
                {fieldErrors.businessPurpose && <p className="error-text">{fieldErrors.businessPurpose}</p>}
              </div>
              <div className="form-group">
                <label><h3>Receipt Upload *</h3></label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
                
                <p className="receipt-hint">Supported: JPG, PNG, PDF (Max 5MB)</p>

                {fieldErrors.receiptFile && (
                  <p className="error-text">{fieldErrors.receiptFile}</p>
                )}

                {draftLoaded && !receiptFile && (
                  <p style={{ color: 'red', fontSize: '12px' }}>
                    Please re-upload your receipt to submit the claim.
                  </p>
                )}

              </div>
            </div>

            <div className="side-widgets">
              <div className="summary-box">
                <h3>Expense Summary</h3>
                <div className="summary-item"><span>Amount:</span> <strong>₹{formData.amount || '0.00'}</strong></div>
                <div className="summary-item"><span>Category:</span> <strong>{formData.category || 'Not selected'}</strong></div>
                <div className="summary-item"><span>Date:</span> <strong>{formData.expenseDate || 'Not selected'}</strong></div>
                <div className="summary-item"><span>Receipts:</span> <strong>{receiptFile ? '1 file' : '0 file'}</strong></div>
              </div>
              <div className="actions-box">
                <button className="btn primary" onClick={handleSubmit}>Submit for Approval</button>
                <button className="btn secondary" onClick={handleSaveDraft}>Save as Draft</button>
                <Link to="/home0" className="btn secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewClaim;