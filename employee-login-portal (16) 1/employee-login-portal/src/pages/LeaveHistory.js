import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function LeaveHistory() {
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

    // Leave history states
    const [leavesData, setLeavesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    // Filter and sort states
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
    const [filters, setFilters] = useState({
        leaveType: '',
        totalDays: '',
        reason: '',
        fileName: '',
        rejectionReason: '',
        status: '',
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

    // Fetch leave history data
    useEffect(() => {
        if (!employeeId) {
            console.error("Employee ID not found. Redirecting to login.");
            navigate("/login");
            return;
        }

        const fetchLeaveHistory = async () => {
            setLoading(true);
            setApiError("");
            try {
                const res = await fetch(`http://localhost:8082/leaves/employee/${employeeId}`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setLeavesData(data);
                } else {
                    setApiError("Invalid data format from server.");
                }
            } catch (err) {
                console.error("Failed to fetch leave history:", err);
                setApiError("Failed to load leave history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaveHistory();
    }, [employeeId, navigate]);

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

    const getStatusColor = (status) => {
    switch (status) {
        case 'Approved':
            return 'transparent';
        case 'Pending':
            return 'transparent';
        case 'Rejected':
            return 'transparent';
        case 'Cancelled':
            return 'transparent'; // you can change color if needed (e.g., gray/red)
        default:
            return 'transparent';
    }
};


    const handleCancelLeave = async (leaveId) => {
        if (window.confirm("Are you sure you want to cancel this leave request?")) {
            try {
                const res = await fetch(`http://localhost:8082/leaves/cancel/${leaveId}`, {
                    method: 'PUT',
                });
                
                if (res.ok) {
                    // Update status locally instead of removing row
                    setLeavesData(prevLeaves =>
                        prevLeaves.map(leave =>
                            leave.id === leaveId ? { ...leave, status: "Cancelled" } : leave
                        )
                    );
                    setSuccessMessage("Leave request cancelled successfully!");
                    setTimeout(() => setSuccessMessage(""), 2000);
                } else {
                    const errorText = await res.text();
                    throw new Error(`HTTP error! status: ${res.status}, Message: ${errorText}`);
                }
            } catch (err) {
                console.error("Failed to cancel leave:", err);
                setApiError("Failed to cancel leave. Please try again.");
                setTimeout(() => setApiError(""), 3000);
            }
        }
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Refined function for filtering and sorting
    const sortedAndFilteredLeaves = () => {
        let leavesToProcess = [...leavesData];
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        // 1. Apply global search filter first
        if (lowercasedSearchTerm) {
            leavesToProcess = leavesToProcess.filter(leave =>
                Object.values(leave).some(value =>
                    value && value.toString().toLowerCase().includes(lowercasedSearchTerm)
                )
            );
        }

        // 2. Apply individual column filters on the globally filtered data
        const finalFilteredLeaves = leavesToProcess.filter(leave => {
            const leaveTypeMatch = filters.leaveType === '' || (leave.type && leave.type.toLowerCase() === filters.leaveType.toLowerCase());
            const totalDaysMatch = filters.totalDays === '' || (leave.totalDays && leave.totalDays.toString().includes(filters.totalDays));
            const reasonMatch = filters.reason === '' || (leave.reason && leave.reason.toLowerCase().includes(filters.reason.toLowerCase()));
            const fileNameMatch = filters.fileName === '' || (leave.fileName && leave.fileName.toLowerCase().includes(filters.fileName.toLowerCase()));
            const rejectionReasonMatch = filters.rejectionReason === '' || (leave.rejectionReason && leave.rejectionReason.toLowerCase().includes(filters.rejectionReason.toLowerCase()));
            const statusMatch = filters.status === '' || (leave.status && leave.status.toLowerCase() === filters.status.toLowerCase());
            
            return leaveTypeMatch && totalDaysMatch && reasonMatch && fileNameMatch && rejectionReasonMatch && statusMatch;
        });

        // 3. Apply sorting
        if (sortConfig.key !== null) {
            finalFilteredLeaves.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }
                
                if (sortConfig.key === 'totalDays') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return finalFilteredLeaves;
    };


    const leavesToDisplay = sortedAndFilteredLeaves();

    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
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
                            
                            {/* API Error Message */}
                            {apiError && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: '0',
                                    marginTop: '5px',
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap',
                                    zIndex: 1100,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}>
                                    {apiError}
                                </div>
                            )}

                            {/* Hidden file input */}
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

                {/* Leave History Content */}
                <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                    <h2 style={{ marginBottom: '20px' }}>My Leave History </h2>
                    {loading ? (
                        <div style={{ textAlign: 'center' }}>Loading...</div>
                    ) : leavesData.length === 0 ? (
                        <div style={{ textAlign: 'center' }}>No leave history found.</div>
                    ) : (
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px', backgroundColor: '#fff', padding:'0', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', cursor: 'pointer', position: 'sticky', top: '0' }} onClick={() => handleSort('id')}>
                                            Leave_Id {getSortIndicator('id')}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Leave Type
                                       <select
                                        name="leaveType"
                                        value={filters.leaveType}
                                        onChange={handleFilterChange}
                                      style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd', color: '#070202ff', cursor: 'pointer', position: 'sticky', top: '0' }}
                                    >
                                        <option value="">All</option>
                                        <option value="Sick Leave">Sick Leave</option>
                                        <option value="Casual Leave">Casual Leave</option>
                                        <option value="Maternity Leave">Maternity Leave</option>
                                        <option value="Paternity Leave">Paternity Leave</option>
                                        {/* Add more if needed */}
                                    </select>

                                        </th>
                                        <th style={{ padding: '15px', marginTop:'-9px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', cursor: 'pointer', position: 'sticky', top: '0' }} onClick={() => handleSort('startDate')}>
                                            Start Date {getSortIndicator('startDate')}
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', cursor: 'pointer', position: 'sticky', top: '0' }} onClick={() => handleSort('endDate')}>
                                            End Date {getSortIndicator('endDate')}
                                        </th>
                                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0', marginBottom: '10px' }}>
                                            Total days
                                            <input
                                                type="number"
                                                name="totalDays"
                                                placeholder="Search..."
                                                value={filters.totalDays}
                                                onChange={handleFilterChange}
                                                style={{ marginLeft: '5px', fontSize: '14px', padding: '5px', width: '100px' }}
                                            />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Reason
                                            <input type="text" name="reason" placeholder="Search..." value={filters.reason} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px', width: '100px' }} />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Uploaded File
                                            <input type="text" name="fileName" placeholder="Search..." value={filters.fileName} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px', width: '100px' }} />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Rejected Reason
                                            <input type="text" name="rejectionReason" placeholder="Search..." value={filters.rejectionReason} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px', width: '100px' }} />
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Status
                                            <select name="status" value={filters.status} onChange={handleFilterChange} style={{ marginLeft: '10px', fontSize: '14px', padding: '5px' }}>
                                                <option value="">All</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                {/* <option value="Approved by HR">Approved by HR</option> */}
                                                <option value="Rejected">Rejected</option>
                                               <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', backgroundColor: '#4c82d3', color: '#ffffff', position: 'sticky', top: '0' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                               <tbody>
                                {leavesToDisplay.map((leave) => (
                                    <tr key={leave.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.id}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.type}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.startDate}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.endDate}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.totalDays}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.reason}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                            {leave.fileName ? (
                                                <a
                                                    href={`http://localhost:8082/leaves/download/${leave.id}`}
                                                    download={leave.fileName}
                                                    style={{ color: '#007bff', textDecoration: 'underline' }}
                                                >
                                                    Leave Document
                                                </a>
                                            ) : (
                                                <span>No File</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{leave.rejectionReason}</td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                            <span style={{
                                                padding: '5px 10px',
                                                borderRadius: '15px',
                                                color: 'black',
                                                fontSize: '18px',
                                                backgroundColor: getStatusColor(leave.status),
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {leave.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleCancelLeave(leave.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {leavesToDisplay.length === 0 && (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>No leaves found matching the current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LeaveHistory;