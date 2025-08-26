import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DailyEntryForm from "./DailyEntryForm";
import Alerts from "./Alerts";
import './Dashboard.css';
import './AttendancePage.css';

function TimesheetDashboard() {
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

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const role = localStorage.getItem("role");
  const isManager = role === "Manager";
  const isHR = role === "Hr";

  const [approvedLeaveDates, setApprovedLeaveDates] = useState([]);
  // UPDATED: state to hold submitted entries with hours, mapped by date
  const [submittedEntries, setSubmittedEntries] = useState({});

  const [frozenDates, setFrozenDates] = useState([]);


  const handleMyTasksClick = () => {
    if (isManager) {
      navigate('/mngtime');
    } else if (isHR) {
      navigate('/hrgreq');
    }
  };

  // Fetch frozen dates for the logged-in employee
useEffect(() => {
  if (!employeeId) return;

  const fetchFrozenDates = async () => {
    try {
      const response = await fetch(`http://localhost:8082/daily-entry/frozen-dates/${employeeId}`);
      if (!response.ok) throw new Error("Failed to fetch frozen dates");
      const data = await response.json();
      setFrozenDates(data); // backend returns list of LocalDate like ["2025-08-01", "2025-08-15"]
    } catch (error) {
      console.error(error);
      setFrozenDates([]);
    }
  };

  fetchFrozenDates();
}, [employeeId]);


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

  // Fetch approved leave dates
  useEffect(() => {
    if (!employeeId) return;

    const fetchApprovedLeaves = async () => {
      try {
        const response = await fetch(`http://localhost:8082/leaves/approved-dates/${employeeId}`);
        if (!response.ok) throw new Error("Failed to fetch approved leaves");
        const data = await response.json();
        setApprovedLeaveDates(data);
      } catch (error) {
        console.error(error);
        setApprovedLeaveDates([]);
      }
    };

    fetchApprovedLeaves();
  }, [employeeId]);

  // UPDATED: Fetch submitted timesheet entries (not just dates)
  const fetchSubmittedEntries = async () => {
    if (!employeeId) return;
    try {
      const response = await fetch(`http://localhost:8082/daily-entry/employee/${employeeId}`);
      if (!response.ok) {
        console.error("Backend response not ok:", response.status);
        throw new Error("Failed to fetch submitted entries");
      }
      const data = await response.json();
      // Map the array of entries into an object where the key is the date and the value is the total hours.
     const entriesMap = data.reduce((acc, entry) => {
  // Use backend property names: date + totalHours
  acc[entry.date] = (acc[entry.date] || 0) + entry.totalHours;
  return acc;
}, {});
setSubmittedEntries(entriesMap);

      setSubmittedEntries(entriesMap);
    } catch (error) {
      console.error("Error fetching submitted timesheet entries:", error);
      setSubmittedEntries({});
    }
  };

  // Fetch submitted entries on initial load and when the month changes
  useEffect(() => {
    fetchSubmittedEntries();
  }, [employeeId, month, year]); // Added month and year to dependency array to refresh the view

  // Handle click outside for profile dropdown
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

  // Fetch holidays for the current month/year
  useEffect(() => {
    const url = `http://localhost:8082/api/holidays/${year}/${month + 1}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch holidays");
        return r.json();
      })
      .then((data) => {
        const ds = data.map((h) => h.holidayDate);
        setHolidays(ds);
      })
      .catch((e) => {
        console.error(e);
        setHolidays([]);
      });
  }, [year, month]);

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

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const fmt = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const headerStyle = { fontWeight: "bold", textAlign: "center", padding: "10px" };
  const cellStyle = {
  width: "100px",      // fixed width
  height: "50px",      // fixed height
  padding: "6px",     // adjust padding inside
  border: "1px solid #ddd",
  borderRadius: "8px",
  textAlign: "center",
  cursor: "pointer",
  display: "flex",        // flexbox for alignment
  flexDirection: "column",
  justifyContent: "center", // vertical centering
  alignItems: "center",     // horizontal centering
  boxSizing: "border-box"   // prevents overflow
};

  const isButtonDisabled = !isManager && !isHR;

  // Function to close the form and navigate
  const handleCloseForm = () => {
    setSelectedDate(null); // This hides the form/modal
  };

  // Re-fetch submitted dates after a successful form submission
  const handleSuccessfulSubmit = () => {
    setSelectedDate(null); // Hide the form/modal
    fetchSubmittedEntries(); // Re-fetch the submitted entries to update the calendar
  };

  return (
    <div className="dashboard-container">
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
              style={{ cursor: 'pointer' }}
            />

            <div className="profile-wrapper" ref={profileDropdownRef}>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-pic"
                onClick={toggleProfileMenu}
              />
              {profileOpen && (
                <div className="profile-dropdown">
                  <button onClick={handleEditProfile}>Edit Profile</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
              {successMessage && (
                <div className="success-message">
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

        <div style={{ padding: 20, fontFamily: "Arial" }}>
          <h2 style={{ textAlign: "center" }}>
           <button
              onClick={handlePrev}
              style={{
                padding: "6px 12px",
                marginRight: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              ⬅️ Prev
            </button> Timesheet Dashboard -{" "} 
            {new Date(year, month).toLocaleString("default", { month: "long" })} {year}<button
              onClick={handleNext}
              style={{
                padding: "6px 12px",
                marginLeft:10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
                
              }}
            >
              Next ➡️
            </button>
          </h2>
            <div
        style={{
          display: "flex",
          flexDirection: "row",   // put side by side
          justifyContent: "flex-end", // align to right
          gap: "10px",
          marginBottom: 15,
        }}
      >
<button
          onClick={() => navigate("/mytimesheets")}
          style={{
            padding: "11px 8px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          My Timesheets
        </button>
</div>

  <div
        style={{
          display: "flex",
          flexDirection: "row",   // put side by side
          justifyContent: "flex-end", // align to right
          gap: "10px",
          marginBottom: 15,
        }}
      >
        <button
          onClick={handleMyTasksClick}
          disabled={isButtonDisabled}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isButtonDisabled ? "#ccc" : "#1890ff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isButtonDisabled ? "not-allowed" : "pointer",
            boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          }}
        >
          My Team
        </button>
      </div>
      
{/* 
          <div style={{ textAlign: "center", marginBottom: 15 }}>
            <button
              onClick={handlePrev}
              style={{
                padding: "6px 12px",
                marginRight: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              ⬅️ Prev
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
                background: "rgba(245, 240, 240, 1)",
                color: "black",
              }}
            >
              Next ➡️
            </button>
          </div> */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 10,
              margin: "0 auto",
              maxWidth: 800,
            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} style={headerStyle}>
                {d}
              </div>
            ))}

            {Array((firstDay.getDay() + 6) % 7)
              .fill(null)
              .map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
           {days.map((date, i) => {
  const iso = fmt(date);
  const dow = date.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const isHoliday = holidays.includes(iso);
  const isApprovedLeave = approvedLeaveDates.includes(iso);
  const isFutureDate = date > today;
  const isSubmitted = submittedEntries.hasOwnProperty(iso);
  const submittedHours = submittedEntries[iso];

  // ✅ NEW: frozen logic
  const isFrozen = frozenDates.includes(iso);

  let bg = "#e8f7ff"; // default workday
  let titleText = `${iso}`;
  let hoursDisplay = null;

  if (isWeekend) {
    bg = "#ffcccc";
    titleText += " (Weekend)";
  } else if (isHoliday) {
    bg = "#fff7b3";
    titleText += " (Holiday)";
  } else if (isApprovedLeave) {
    bg = "#d3d3d3";
    titleText += " (Approved Leave)";
  }

  if (isSubmitted) {
    bg = "#b3f7b3";
    titleText += ` (Submitted: ${submittedHours} hours)`;
    hoursDisplay = (
      <div style={{ fontSize: "12px", marginTop: "5px", fontWeight: "bold" }}>
        ({submittedHours} Hrs)
      </div>
    );
  }

  // ❄️ Frozen overrides everything
  if (isFrozen) {
    bg = "#f8d7da"; // light red
  }

  let cursor = "pointer";
  let alertMessage = "";

  if (isFrozen) {
    cursor = "not-allowed";
    alertMessage = "This timesheet is frozen by manager. You cannot edit it.";
  } else if (isFutureDate) {
    cursor = "not-allowed";
    alertMessage = "You cannot fill out a timesheet for a future date.";
  } else if (isApprovedLeave) {
    cursor = "not-allowed";
    alertMessage = "You cannot submit hours for this day as leave has been approved.";
  } else if (isSubmitted) {
    cursor = "not-allowed";
    alertMessage = "You have already submitted a timesheet for this date.";
  }

  const onClickHandler = () => {
    if (alertMessage) {
      alert(alertMessage);
    } else {
      setSelectedDate(iso);
    }
  };

  return (
    <div
      key={iso}
      onClick={onClickHandler}
      title={titleText}
      style={{
        ...cellStyle,
        backgroundColor: bg,
        cursor,
        color: isFrozen ? "gray" : "black",
        pointerEvents: isFrozen ? "none" : "auto",
      }}
    >
      <div>{date.getDate()}</div>
      {hoursDisplay}
      {isFrozen && (
        <small style={{ color: "red", fontWeight: "bold" }}>Freezed</small>
      )}
    </div>
  );
})}

          </div>

          {selectedDate && (
            <div className="modal-overlay">
            <div className="modal-content">
  <h3>Submit Hours for Day {selectedDate}</h3>
  <DailyEntryForm
    date={selectedDate}
    onAlert={(msg) => {
      // Add the new message to the state
      setAlerts((currentAlerts) => [...currentAlerts, msg]);

      // Set a timer to remove the message after 2000 milliseconds (2 seconds)
      setTimeout(() => {
        setAlerts((currentAlerts) => {
          // This creates a new array that excludes the specific message
          return currentAlerts.filter((alert) => alert !== msg);
        });
      }, 2000); // 2 seconds
    }}
    onClose={handleCloseForm}
    onSuccess={handleSuccessfulSubmit}
  />
</div>
            </div>
          )}

          <div style={{ maxWidth: 900, margin: "20px auto", display: "flex", justifyContent: "center", gap: "30px", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#ffcccc", borderRadius: 4, border: "1px solid #d9534f" }}></div>
              <span>Weekends</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#fff7b3", borderRadius: 4, border: "1px solid #d4af37" }}></div>
              <span>Holidays</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#e8f7ff", borderRadius: 4, border: "1px solid #5bc0de" }}></div>
              <span>Workdays</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#d3d3d3", borderRadius: 4, border: "1px solid #999" }}></div>
              <span>Approved Leave</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#f0f0f0", borderRadius: 4, border: "1px solid #ccc" }}></div>
              <span>Future Date</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, backgroundColor: "#b3f7b3", borderRadius: 4, border: "1px solid #4caf50" }}></div>
              <span>Submitted</span>
            </div>
          </div>

          <Alerts alerts={alerts} />
        </div>
      </div>
    </div>
  );
}

export default TimesheetDashboard;