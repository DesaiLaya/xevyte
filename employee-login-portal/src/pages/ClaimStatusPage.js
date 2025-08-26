import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import './ClaimStatusPage.css';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Correct way for mjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function ClaimStatusPage() {
  const [claims, setClaims] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const employeeId = localStorage.getItem("employeeId");
  const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
  const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [employeeId]);

useEffect(() => {
    fetch(`http://localhost:8082/claims/history/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        const filteredClaims = data.filter(
          claim => claim.status !== "Rejected" && claim.status !== "Paid"
        );
        
        // Sort claims in descending order based on submittedDate
        const sortedClaims = filteredClaims.sort((a, b) => {
          const dateA = new Date(a.submittedDate);
          const dateB = new Date(b.submittedDate);
          return dateB - dateA; // For descending order
        });
        
        setClaims(sortedClaims);
      })
      .catch(err => console.error("Error fetching status:", err));
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

      if (res.ok && data.profilePic) {
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
      console.error("Upload error:", error);
      alert("Error uploading profile picture.");
    }
  };

  // --- UPDATED PREVIEW LOGIC ---
  const handleViewReceipt = async (claimId, fileName) => {
    try {
      const response = await axios.get(
        `http://localhost:8082/claims/receipt/${claimId}`,
        { responseType: "blob" }
      );
      
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const fileUrl = URL.createObjectURL(response.data);
      
      setPreviewFile(fileUrl);
      if (fileExtension === 'pdf') {
        setFileType('pdf');
      } else {
        setFileType('image');
      }
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching receipt:", error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on load
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPreviewFile(null);
    setFileType(null);
    setNumPages(null);
    setPageNumber(1);
    URL.revokeObjectURL(previewFile); // Clean up the object URL
  };

  const goToPrevPage = () => setPageNumber(prevPageNumber => prevPageNumber - 1);
  const goToNextPage = () => setPageNumber(prevPageNumber => prevPageNumber + 1);

  // Filter the claims based on the search term.
  // We use useMemo to optimize and prevent re-calculation on every render.
  const filteredClaims = useMemo(() => {
    if (!searchTerm) {
      return claims;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return claims.filter(claim => {
      // Create an array of values from the claim object to search through.
      // This includes all the fields in your table.
      const searchableFields = [
        String(claim.id),
        String(claim.employeeId),
        claim.name,
        claim.category,
        String(claim.amount),
        claim.expenseDescription,
        claim.businessPurpose,
        claim.additionalNotes,
        claim.expenseDate,
        claim.receiptName,
        claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString() : "N/A",
        claim.status,
        claim.nextApprover,
      ];

      // Check if any of the fields contain the search term.
      return searchableFields.some(field =>
        field && field.toLowerCase().includes(lowercasedSearchTerm)
      );
    });
  }, [claims, searchTerm]);
  
  return (
    <div className="dashboard-container">
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

      <div className="manager-dashboard">
        <div className="dashboard-header">
          <div className="top-header">
            <h2>Welcome, {employeeName} ({employeeId})</h2>

            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
              <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <img src={require('../assets/Vector.png')} alt="Notifications" className="icon" />

              <div className="profile-wrapper" style={{ position: 'relative' }}>
                <img
                  src={profilePic}
                  alt="Profile"
                  className="profile-pic"
                  onClick={toggleProfileMenu}
                  style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                {profileOpen && (
                  <div ref={profileDropdownRef} className="profile-dropdown"
                    style={{
                      position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: '4px', zIndex: 1000, width: '150px'
                    }}>
                    <button onClick={handleEditProfile} style={{ padding: '10px', width: '100%', borderBottom: '1px solid #eee' }}>Edit Profile</button>
                    <button onClick={handleLogout} style={{ padding: '10px', width: '100%' }}>Logout</button>
                  </div>
                )}
                {successMessage && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, backgroundColor: '#4BB543',
                    color: 'white', padding: '8px 12px', borderRadius: '4px',
                    fontSize: '14px', marginTop: '5px'
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
        </div>

        <div style={{ padding: "0" }}>
          <h2>Your Claim Status</h2>

          {filteredClaims.length === 0 ? (
            <p>No claims submitted yet.</p>
          ) : (
            <div className="table">
              <table className="status-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Purpose</th>
                    <th>Additional Info</th>
                    <th>Expense Date</th>
                    <th>Receipt</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th>Next Approver</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>{claim.id}</td>
                      <td>{claim.employeeId}</td>
                      <td>{claim.name}</td>
                      <td>{claim.category}</td>
                      <td>{claim.amount}</td>
                      <td>{claim.expenseDescription}</td>
                      <td>{claim.businessPurpose}</td>
                      <td>{claim.additionalNotes}</td>
                      <td>{claim.expenseDate}</td>
                      <td>
                        {claim.receiptName ? (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleViewReceipt(claim.id, claim.receiptName);
                            }}
                            style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                          >
                            {claim.receiptName}
                          </a>
                        ) : "No Receipt"}
                      </td>
                      <td>{claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString() : "N/A"}</td>
                      <td>{claim.status}</td>
                      <td>{claim.nextApprover || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isModalOpen && previewFile && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
              justifyContent: "center", zIndex: 1000
            }}>
              <div style={{
                backgroundColor: "#fff", padding: "20px", borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0,0,0,0.25)", maxWidth: "90%", maxHeight: "90%", textAlign: "center"
              }}>
                <h3>Receipt Preview</h3>
                {fileType === 'pdf' ? (
                  <>
                    <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                      <Document file={previewFile} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} />
                      </Document>
                      </div>
                      <div className="pdf-controls">
                        <p>Page {pageNumber} of {numPages}</p>
                        <button onClick={goToPrevPage} disabled={pageNumber <= 1}>Previous</button>
                        <button onClick={goToNextPage} disabled={pageNumber >= numPages}>Next</button>
                      </div>
                  </>
                ) : (
                  <img
                    src={previewFile}
                    alt="Receipt"
                    style={{ maxWidth: "100%", maxHeight: "70vh", marginBottom: "20px" }}
                  />
                )}
                <br />
                <button onClick={handleCloseModal} style={{
                  padding: "10px 20px", border: "none", backgroundColor: "#f44336",
                  color: "#fff", borderRadius: "5px", cursor: "pointer", marginTop: '0'
                }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClaimStatusPage;