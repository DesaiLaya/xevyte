import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import './HRDashboard.css';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Correct way for mjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

function HRDashboard() {
    const [claims, setClaims] = useState([]);
    const [originalClaims, setOriginalClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName") || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
    const [profileOpen, setProfileOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const navigate = useNavigate();

    const employeeId = localStorage.getItem("employeeId");

    // New state for PDF preview
    const [previewFile, setPreviewFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    useEffect(() => {
        const storedName = localStorage.getItem("employeeName");
        setEmployeeName(storedName);
        if (employeeId) {
            fetchHRClaims(employeeId);
            fetchProfileInfo(employeeId);
        }
    }, [employeeId]);

    const fetchHRClaims = (hrId) => {
        axios
            .get(`http://localhost:8082/claims/hr/${hrId}`)
            .then((response) => {
                const sortedClaims = response.data.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
                setOriginalClaims(sortedClaims);
                setClaims(sortedClaims);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching HR claims:", error);
                setLoading(false);
            });
    };

    const fetchProfileInfo = (empId) => {
        fetch(`http://localhost:8082/profile/${empId}`)
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
            .catch(err => {
                console.error("Failed to fetch profile info:", err);
            });
    };

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleProfileMenu = () => setProfileOpen(!profileOpen);

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

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
    };

    const updateStatus = (claimId, status) => {
        axios
            .put(`http://localhost:8082/claims/hr/update-status/${claimId}?status=${status}`)
            .then(() => fetchHRClaims(employeeId))
            .catch((error) => console.error(`Error updating status:`, error));
    };

    // Modified handleViewReceipt to support both images and PDFs
    const handleViewReceipt = (id, receiptName) => {
        axios
            .get(`http://localhost:8082/claims/receipt/${id}`, { responseType: "blob" })
            .then((res) => {
                const fileExtension = receiptName.split('.').pop().toLowerCase();
                const fileUrl = URL.createObjectURL(res.data);
                setPreviewFile(fileUrl);
                
                if (fileExtension === 'pdf') {
                    setFileType('pdf');
                } else {
                    setFileType('image');
                }
                setIsModalOpen(true);
            })
            .catch((err) => console.error("Error fetching receipt:", err));
    };
    
    // Handlers for the modal and PDF
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPreviewFile(null);
        setFileType(null);
        setNumPages(null);
        setPageNumber(1);
        // Clean up the URL object to free up memory
        if (previewFile) {
            URL.revokeObjectURL(previewFile);
        }
    };
    
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };
    
    const changePage = (offset) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };
    
    const prevPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    // useEffect hook for filtering claims
    useEffect(() => {
        if (searchTerm.length > 0) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const filtered = originalClaims.filter(claim => {
                // Check multiple fields for the search term
                const matchesClaimId = String(claim.id).toLowerCase().includes(lowerCaseSearchTerm);
                const matchesEmployeeId = String(claim.employeeId).toLowerCase().includes(lowerCaseSearchTerm);
                const matchesEmployeeName = claim.name && claim.name.toLowerCase().includes(lowerCaseSearchTerm);
                const matchesCategory = claim.category && claim.category.toLowerCase().includes(lowerCaseSearchTerm);
                const matchesBusinessPurpose = claim.businessPurpose && claim.businessPurpose.toLowerCase().includes(lowerCaseSearchTerm);
                const matchesAdditionalNotes = claim.additionalNotes && claim.additionalNotes.toLowerCase().includes(lowerCaseSearchTerm);
                const matchesAmount = String(claim.amount).toLowerCase().includes(lowerCaseSearchTerm);
                const matchesDescription = claim.expenseDescription && claim.expenseDescription.toLowerCase().includes(lowerCaseSearchTerm);
                
                // Special check for date fields
                const matchesExpenseDate = claim.expenseDate && claim.expenseDate.includes(searchTerm);
                const matchesSubmittedDate = new Date(claim.submittedDate).toLocaleString().toLowerCase().includes(lowerCaseSearchTerm);

                return (
                    matchesClaimId || 
                    matchesEmployeeId || 
                    matchesEmployeeName || 
                    matchesCategory || 
                    matchesBusinessPurpose || 
                    matchesAdditionalNotes || 
                    matchesAmount || 
                    matchesDescription || 
                    matchesExpenseDate ||
                    matchesSubmittedDate
                );
            });
            setClaims(filtered);
        } else {
            // If search term is empty, show all claims from the original list
            setClaims(originalClaims);
        }
    }, [searchTerm, originalClaims]);

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                {!isCollapsed ? (
                    <>
                        <img src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")} alt="office" className="office-vng" />
                        <img
                            src={require("../assets/gg_move-left.png")}
                            alt="collapse"
                            className="toggle-btn"
                            onClick={toggleSidebar}
                            style={{ width: '35px', height: '35px', top: '76px', marginLeft: "200px" }}
                        />
                        <h3><Link to="/hom" className="hom" style={{ textDecoration: 'none' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                Favourites <img src={require("../assets/star4.png")} alt="star" style={{ width: '22px', height: '22px' }} />
                            </span>
                        </Link></h3>
                        {/* Other sidebar links */}
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

            {/* Main Dashboard */}
            <div className="manager-dashboard">
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
                </div>

                {loading ? (
                    <h2>Loading your HR Dashboard...</h2>
                ) : (!employeeId || claims.length === 0) ? (
                    <p>You do not have any assigned claims at the moment.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="status-table">
                            <thead>
                                <tr>
                                    <th>Claim ID</th>
                                    <th>Employee ID</th>
                                    <th>Employee Name</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Description</th>
                                    <th>Business Purpose</th>
                                    <th>Expense Date</th>
                                    <th>Receipt</th>
                                    <th>Submitted Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.map((claim) => (
                                    <tr key={claim.id}>
                                        <td>{claim.id}</td>
                                        <td>{claim.employeeId}</td>
                                        <td>{claim.name}</td>
                                        <td>{claim.category}</td>
                                        <td>{claim.amount}</td>
                                        <td>{claim.expenseDescription}</td>
                                        <td>{claim.businessPurpose}</td>
                                        <td>{claim.expenseDate}</td>
                                        <td>
                                            {claim.receiptName ? (
                                                <button
                                                    onClick={() => handleViewReceipt(claim.id, claim.receiptName)}
                                                    style={{
                                                        cursor: "pointer",
                                                        color: "blue",
                                                        textDecoration: "underline",
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        padding: 0
                                                    }}
                                                >
                                                    {claim.receiptName}
                                                </button>
                                            ) : "No Receipt"}
                                        </td>
                                        <td>{new Date(claim.submittedDate).toLocaleString()}</td>
                                        <td>{claim.status}</td>
                                        <td>
                                            {claim.status !== "Paid" && (
                                                <div className="action-buttons">
                                                    <button className="approve-btn" onClick={() => updateStatus(claim.id, "Initiated")}>Initiated</button>
                                                    <button className="reject-btn" onClick={() => updateStatus(claim.id, "Payment Under Process")}>Payment Under Process</button>
                                                    <button className="download-btn" onClick={() => updateStatus(claim.id, "Paid")}>Paid</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {isModalOpen && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                        backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                        justifyContent: "center", zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "#fff", padding: "20px", borderRadius: "8px",
                            boxShadow: "0 0 10px rgba(0,0,0,0.25)", maxWidth: "90%", maxHeight: "90vh", textAlign: "center",
                            display: 'flex', flexDirection: 'column', gap: '10px'
                        }}>
                            <h3>Receipt Preview</h3>
                            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                                {fileType === 'pdf' ? (
                                    <div className="pdf-container">
                                        <Document
                                            file={previewFile}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            onLoadError={(error) => console.error("Error loading PDF:", error)}
                                        >
                                            <Page pageNumber={pageNumber} />
                                        </Document>
                                        
                                    </div>
                                ) : (
                                    <img src={previewFile} alt="Receipt" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: 'contain' }} />
                                )}
                            </div>
                            {numPages > 1 && (
                                <div className="pdf-controls">
                                    <p>Page {pageNumber} of {numPages}</p>
                                    <button onClick={prevPage} disabled={pageNumber <= 1}>Previous</button>
                                    <button onClick={nextPage} disabled={pageNumber >= numPages}>Next</button>
                                </div>
                            )}
                            <button onClick={handleCloseModal} style={{
                                padding: "10px 20px", border: "none", backgroundColor: "#f44336",
                                color: "#fff", borderRadius: "5px", cursor: "pointer", marginTop: 'auto'
                            }}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HRDashboard;