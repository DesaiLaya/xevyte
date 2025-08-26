import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './Dashboard.css';
import './Mytimesheet.css';

// Import the download icon as a component
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zM12.5 5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-9 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm.5 3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm5 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm.5 3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm-5 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM3.5 14a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM8 14a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM12.5 14a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM4 1.5A1.5 1.5 0 0 1 5.5 0h5A1.5 1.5 0 0 1 12 1.5v.194a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V1.5zM1.5 3h13v2.5a.5.5 0 0 1-1 0V4H2v1.5a.5.5 0 0 1-1 0V3zM1.5 6h13v8a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 1.5 14V6z"/>
    </svg>
);

function Performance() {
    const navigate = useNavigate();
    const location = useLocation();

    const employeeId = localStorage.getItem("employeeId");
    
    const [employeeName, setEmployeeName] = useState(localStorage.getItem("employeeName"));
    const [profilePic, setProfilePic] = useState(localStorage.getItem("employeeProfilePic") || require('../assets/SKKKK.JPG.jpg'));
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);
    const profileDropdownRef = useRef(null);

    // Manager Timesheet state
    const [allTimesheets, setAllTimesheets] = useState([]); // Store all timesheets from the API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New state for view modal
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
   const timesheetEmployeeId = location.state?.employeeId || localStorage.getItem("selectedEmployeeId") || "";

    const managerId = localStorage.getItem("employeeId");

    // State for selected month and year
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // State for column filters
    const [filters, setFilters] = useState({
        date: 'asc',
        employeeId: '',
        client: '',
        project: '',
        loginTime: '',
        logoutTime: '',
        totalHours: '',
        remarks: ''
    });

const handleFreezeTimesheets = async () => {
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    if (!timesheetEmployeeId) {
        alert("Please select an employee to freeze timesheets for.");
        return;
    }

    try {
       const response = await axios.put(`http://localhost:8082/daily-entry/freeze`, {
    managerId: managerId,
    employeeId: timesheetEmployeeId, // ✅
    startDate: startDate,
    endDate: endDate
});


        if (response.status === 200) {
            alert(`Timesheets successfully frozen for Employee ${timesheetEmployeeId}`);
            setIsModalOpen(false);
            // Optionally refresh
            // fetchAllTimesheets();
        } else {
            alert("Failed to freeze timesheets. Please try again.");
        }
    } catch (error) {
        console.error("Error freezing timesheets:", error);
        alert("An error occurred while freezing timesheets.");
    }
};

    // Fetch updated profile info on mount
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

    // Fetch ALL timesheet data once on mount
    useEffect(() => {
    const fetchEmployeeTimesheets = async () => {
        if (!timesheetEmployeeId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`http://localhost:8082/daily-entry/employee/${timesheetEmployeeId}`);
            setAllTimesheets(response.data);
        } catch (err) {
            setError(err.response?.data || 'Failed to fetch timesheet entries.');
            console.error("Error fetching employee timesheets:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchEmployeeTimesheets();
}, [timesheetEmployeeId]);


// Updated useMemo hook
const filteredEntries = useMemo(() => {
    let currentEntries = [...allTimesheets];
    
    // 1. Filter by selected month and year
    currentEntries = currentEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === selectedYear && entryDate.getMonth() === selectedMonth;
    });

    // 2. Apply global search term with improved logic
    if (searchTerm) {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        currentEntries = currentEntries.filter(entry => {
            // Check for string matches in specific fields
            const matchesString = (
                entry.employeeId.toLowerCase().includes(lowercasedSearchTerm) ||
                entry.client.toLowerCase().includes(lowercasedSearchTerm) ||
                entry.project.toLowerCase().includes(lowercasedSearchTerm) ||
                entry.remarks?.toLowerCase().includes(lowercasedSearchTerm)
            );

            // Check for numeric matches for totalHours
            const matchesTotalHours = parseFloat(entry.totalHours) === parseFloat(searchTerm);

            return matchesString || matchesTotalHours;
        });
    }

    // 3. Apply column-specific filters (from your original code)
    // ... (This section remains the same) ...

    // 4. Sort by date
    if (filters.date === 'asc') {
        currentEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
        currentEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return currentEntries;
}, [allTimesheets, filters, searchTerm, selectedMonth, selectedYear]);

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

    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };

    const handleDownload = () => {
        const dataToExport = filteredEntries.map(({ id, ...rest }) => rest);

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');
        XLSX.writeFile(workbook, 'timesheet_entries.xlsx');
        setIsModalOpen(false);
    };

    // Handler for month/year selection
    const handleViewTimesheet = (e) => {
        e.preventDefault();
        // The filtering is now handled in the useMemo hook, so we just close the modal
        setIsViewModalOpen(false);
    };

    const isManager = localStorage.getItem("isManager") === "true"; 

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
                        <h3><Link to="/home3" className="side" style={{ textDecoration: 'none' }}>Employee Directory</Link>        
                        </h3>
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

            {/* Main content */}
            <div className="main-content">
                {/* Top header */}
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

                {/* Manager Timesheet Content */}
                <div className="p-4">
                    <h2>Manager Timesheets</h2>

                    <div className="my-3" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', marginBottom: "20px" }}>
                        <button onClick={() => setIsViewModalOpen(true)} className="export-btn">
                            View Timesheets
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="export-btn">
                            Export Timesheet <DownloadIcon />
                        </button>
                    </div>

                    {/* Export Modal */}
                   {isModalOpen && (
    <div className="modal-overlay">
        <div className="modal-content">
            <div className="modal-header">
                <h3>Download Timesheet</h3>
                <button onClick={() => setIsModalOpen(false)} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
                <label htmlFor="modal-start-date">Start Date:</label>
                <input
                    type="date"
                    id="modal-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <label htmlFor="modal-end-date">End Date:</label>
                <input
                    type="date"
                    id="modal-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <div className="modal-footer">
                <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                <button onClick={handleFreezeTimesheets} className="freeze-btn">Freeze</button>
                <button onClick={handleDownload} className="download-btn">Download</button>
            </div>
        </div>
    </div>
)}
                    {/* View Timesheet Modal */}
                    {isViewModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Select Month and Year</h3>
                                    <button onClick={() => setIsViewModalOpen(false)} className="close-btn">&times;</button>
                                </div>
                                <div className="modal-body">
                                    <label htmlFor="month-select">Month:</label>
                                    <select
                                        id="month-select"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="year-select">Year:</label>
                                    <input
                                        type="number"
                                        id="year-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        min="2000"
                                        max={new Date().getFullYear() + 10}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button onClick={() => setIsViewModalOpen(false)} className="cancel-btn">Cancel</button>
                                    <button onClick={handleViewTimesheet} className="download-btn">View</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && <p>Loading timesheets...</p>}
                    {error && <p style={{ color: 'red' }}>{error.message || 'An unknown error occurred.'}</p>}
                    
                    {!loading && !error && (
                        <div className="table-wrapper" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="timesheet-table">
                                <thead>
                                    <tr>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Date
                                            <select
                                                value={filters.date}
                                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                                style={{
                                                    height: '25px', /* Increased height for better clickability */
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc',
                                                    fontSize: '14px',
                                                    width: 'auto', /* Width adjusts to content */
                                                    minWidth: '80px', /* Ensures a minimum size */
                                                    marginRight: 'auto', /* Pushes the element to the left */
                                                    marginBottom: '16px',
                                                    color: 'black'
                                                }}
                                            >
                                                <option value="asc">Asc</option>
                                                <option value="desc">Desc</option>
                                            </select>
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Employee ID
                                            <input
                                                type="text"
                                                placeholder="Search ID"
                                                value={filters.employeeId}
                                                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                                            />
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Client
                                            <input
                                                type="text"
                                                placeholder="Search Client"
                                                value={filters.client}
                                                onChange={(e) => handleFilterChange('client', e.target.value)}
                                            />
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Project
                                            <input
                                                type="text"
                                                placeholder="Search Project"
                                                value={filters.project}
                                                onChange={(e) => handleFilterChange('project', e.target.value)}
                                            />
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Login Time
                                            <input
                                                type="text"
                                                placeholder="Search Time"
                                                value={filters.loginTime}
                                                onChange={(e) => handleFilterChange('loginTime', e.target.value)}
                                            />
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Logout Time
                                            <input
                                                type="text"
                                                placeholder="Search Time"
                                                value={filters.logoutTime}
                                                onChange={(e) => handleFilterChange('logoutTime', e.target.value)}
                                            />
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Total Hours
                                            <select
                                                value={filters.totalHours}
                                                onChange={(e) => handleFilterChange('totalHours', e.target.value)}
                                                style={{
                                                    height: '25px', /* Increased height for better clickability */
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc',
                                                    fontSize: '14px',
                                                    /* Width adjusts to content */
                                                    minWidth: '100px', /* Ensures a minimum size */
                                                    marginRight: 'auto', /* Pushes the element to the left */
                                                    marginBottom: '16px',
                                                    color: 'black'
                                                }}
                                            >
                                                <option value="">All</option>
                                                <option value="lessThan8"> &lt; 8</option>
                                                <option value="greaterThan8"> &ge; 8</option>
                                            </select>
                                        </th>
                                        <th style={{ color: '#ffffff' , backgroundColor: '#4c82d3'}}>
                                            Remarks
                                            <input
                                                type="text"
                                                placeholder="Search Remarks"
                                                value={filters.remarks}
                                                onChange={(e) => handleFilterChange('remarks', e.target.value)}
                                            />
                                        </th>
                                       
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.length > 0 ? (
                                        filteredEntries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td>{entry.date}</td>
                                                <td>{entry.employeeId}</td>
                                                <td>{entry.client}</td>
                                                <td>{entry.project}</td>
                                                <td>{entry.loginTime}</td>
                                                <td>{entry.logoutTime}</td>
                                                <td>{entry.totalHours}</td>
                                                <td>{entry.remarks || '-'}</td>

                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8">No timesheet entries found for the selected month.</td>
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

export default Performance;