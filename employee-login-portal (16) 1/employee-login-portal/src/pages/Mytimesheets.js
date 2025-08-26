import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './Dashboard.css';
import './Mytimesheet.css';

// Import the download icon (e.g., from a library or as an SVG/image file)
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
);

const EmployeeTimesheets = ({ employeeId, searchTerm }) => {
    const [allEntries, setAllEntries] = useState([]); // Store all fetched entries
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [currentView, setCurrentView] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

    // State for column filters
    const [filters, setFilters] = useState({
        date: 'asc',
        client: '',
        project: '',
        loginTime: '',
        logoutTime: '',
        totalHours: '',
        remarks: ''
    });

    useEffect(() => {
        if (!employeeId) return;

        const fetchAllEntries = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(
                    `http://localhost:8082/daily-entry/employee/${employeeId}`
                );

                setAllEntries(response.data); // Store all entries
            } catch (err) {
                setError(
                    err.response?.data || 'Failed to fetch timesheet entries.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAllEntries();
    }, [employeeId]);

    // Filter and sort entries based on all filters and search term
    const filteredEntries = useMemo(() => {
        let currentEntries = [...allEntries];

        // Apply month and year filter first
        currentEntries = currentEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentView.month && entryDate.getFullYear() === currentView.year;
        });

        // Apply global search term
        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            currentEntries = currentEntries.filter(entry =>
                Object.values(entry).some(value =>
                    String(value).toLowerCase().includes(lowercasedSearchTerm)
                )
            );
        }

        // Apply column-specific filters
        if (filters.client) {
            currentEntries = currentEntries.filter(entry =>
                entry.client.toLowerCase().includes(filters.client.toLowerCase())
            );
        }
        if (filters.project) {
            currentEntries = currentEntries.filter(entry =>
                entry.project.toLowerCase().includes(filters.project.toLowerCase())
            );
        }
        if (filters.remarks) {
            currentEntries = currentEntries.filter(entry =>
                entry.remarks?.toLowerCase().includes(filters.remarks.toLowerCase())
            );
        }
        if (filters.loginTime) {
            currentEntries = currentEntries.filter(entry =>
                entry.loginTime.includes(filters.loginTime)
            );
        }
        if (filters.logoutTime) {
            currentEntries = currentEntries.filter(entry =>
                entry.logoutTime.includes(filters.logoutTime)
            );
        }
        if (filters.totalHours) {
            currentEntries = currentEntries.filter(entry => {
                const total = parseFloat(entry.totalHours);
                if (filters.totalHours === 'lessThan8') {
                    return total < 8;
                }
                if (filters.totalHours === 'greaterThan8') {
                    return total >= 8;
                }
                return true;
            });
        }

        // Sort by date
        currentEntries.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return filters.date === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return currentEntries;
    }, [allEntries, filters, searchTerm, currentView]);

    const handleFilterChange = (column, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [column]: value
        }));
    };

    const handleDownload = () => {
        // Filter entries based on the selected start and end dates from the modal
        const dataToExport = allEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            const isAfterStart = !start || entryDate >= start;
            const isBeforeEnd = !end || entryDate <= end;
            return isAfterStart && isBeforeEnd;
        }).map(({ id, ...rest }) => rest); // Exclude the 'id' field

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');
        XLSX.writeFile(workbook, 'timesheet_entries.xlsx');
        setIsModalOpen(false); // Close the modal after download
    };

    const handleViewTimesheet = () => {
        // Update the view state and close the modal.
        // The `useMemo` hook will handle the filtering of the fetched data.
        setCurrentView({ month: selectedMonth, year: selectedYear });
        setIsViewModalOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (!employeeId) {
        return <p>Please log in to view your timesheets.</p>;
    }

    if (loading) return <p>Loading timesheets...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="timesheet-container">
           <div className="timesheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h2>Timesheet for {monthNames[currentView.month]} {currentView.year}</h2>
    <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsViewModalOpen(true)} className="export-btn">
            View Timesheet
        </button>
        <button onClick={() => setIsModalOpen(true)} className="export-btn">
            Export Timesheet <DownloadIcon />
        </button>
    </div>
</div>
            
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
                            <button onClick={handleDownload} className="download-btn">Download</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-wrapper">
                <table className="timesheet-table">
                    <thead>
                        <tr>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Date
                                <select
                                    value={filters.date}
                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                    style={{
                                        height: '25px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        width: 'auto',
                                        minWidth: '80px',
                                        marginRight: 'auto',
                                        marginBottom: '16px',
                                        color: 'black'
                                    }}
                                >
                                    <option value="asc">Asc</option>
                                    <option value="desc">Desc</option>
                                </select>
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Client
                                <input
                                    type="text"
                                    placeholder="Search Client"
                                    value={filters.client}
                                    onChange={(e) => handleFilterChange('client', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Project
                                <input
                                    type="text"
                                    placeholder="Search Project"
                                    value={filters.project}
                                    onChange={(e) => handleFilterChange('project', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Login Time
                                <input
                                    type="text"
                                    placeholder="Search Time"
                                    value={filters.loginTime}
                                    onChange={(e) => handleFilterChange('loginTime', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Logout Time
                                <input
                                    type="text"
                                    placeholder="Search Time"
                                    value={filters.logoutTime}
                                    onChange={(e) => handleFilterChange('logoutTime', e.target.value)}
                                />
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
                                Total Hours
                                <select
                                    value={filters.totalHours}
                                    onChange={(e) => handleFilterChange('totalHours', e.target.value)}
                                    style={{
                                        height: '25px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        minWidth: '100px',
                                        marginRight: 'auto',
                                        marginBottom: '16px',
                                        color: 'black'
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="lessThan8"> &lt; 8</option>
                                    <option value="greaterThan8"> &ge; 8</option>
                                </select>
                            </th>
                            <th style={{ color: '#ffffff', backgroundColor: '#4c82d3' }}>
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
                                    <td>{entry.client}</td>
                                    <td>{entry.project}</td>
                                    <td>{entry.loginTime}</td>
                                    <td>{entry.logoutTime}</td>
                                    <td>{entry.totalHours} Hrs</td>
                                    <td>{entry.remarks || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No timesheet entries found for {monthNames[currentView.month]} {currentView.year}.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function Performance() {
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

                {/* Timesheet content inserted here */}
                <EmployeeTimesheets employeeId={employeeId} searchTerm={searchTerm} />

            </div>
        </div>
    );
}

export default Performance;