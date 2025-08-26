import React, { useState, useEffect } from "react";

function DailyEntryForm({ date, onAlert, onClose, onSuccess }) {
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [loginTime, setLoginTime] = useState({ hour: "", minute: "", period: "" });
  const [logoutTime, setLogoutTime] = useState({ hour: "", minute: "", period: "" });
  const [totalHours, setTotalHours] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});

  const clients = ["Client A", "Client B", "Client C"];
  const projects = ["Project A", "Project B", "Project C"];
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  useEffect(() => {
    if (loginTime.hour && loginTime.minute && logoutTime.hour && logoutTime.minute) {
      const get24Hour = (time) => {
        let hour = parseInt(time.hour, 10);
        let minute = parseInt(time.minute, 10);
        if (time.period === "PM" && hour !== 12) {
          hour += 12;
        }
        if (time.period === "AM" && hour === 12) {
          hour = 0;
        }
        return { hour, minute };
      };

      const login24 = get24Hour(loginTime);
      const logout24 = get24Hour(logoutTime);

      const start = login24.hour * 60 + login24.minute;
      const end = logout24.hour * 60 + logout24.minute;
      const diff = (end - start) / 60;
      setTotalHours(diff > 0 ? diff.toFixed(2) : 0);
    } else {
      setTotalHours(0);
    }
  }, [loginTime, logoutTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!client) newErrors.client = "Please select a client.";
    if (!project) newErrors.project = "Please select a project.";
    if (!loginTime.hour || !loginTime.minute || !logoutTime.hour || !logoutTime.minute) {
      newErrors.time = "Please enter hours before submitting.";
    }
    if (loginTime.hour && logoutTime.hour && totalHours <= 0) {
      newErrors.totalHours = "Invalid time range. Please check login/logout.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const employeeId = localStorage.getItem("employeeId");
      if (!employeeId) {
        // This is a red-themed error message, which is correct
        onAlert(
          <div
            style={{
              color: "red",
              backgroundColor: "#f8d7da",
            
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            ❌ Employee not logged in.
          </div>
        );
        return;
      }

      const formattedLoginTime = `${loginTime.hour}:${loginTime.minute} ${loginTime.period}`;
      const formattedLogoutTime = `${logoutTime.hour}:${logoutTime.minute} ${logoutTime.period}`;

      const response = await fetch(
        `http://localhost:8082/daily-entry/submit/${employeeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            client,
            project,
            loginTime: formattedLoginTime,
            logoutTime: formattedLogoutTime,
            totalHours,
            remarks,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // The updated success message with correct styling
        onAlert(
          <div
            style={{
              backgroundColor: "#d4edda", // light green background
              color: "#155724", // dark green text
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #c3e6cb", // soft green border
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ✅ Daily entry submitted: Success
          </div>
        );
        onSuccess(date);
        onClose();
      } else {
        const error = await response.text();
        // This is the error message with correct red styling
        onAlert(
          <div
            style={{
              color: "red",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            ❌ Failed to submit: {error}
          </div>
        );
      }
    } catch (err) {
      console.error(err);
      // This is the warning message with correct yellow styling
      onAlert(
        <div
          style={{
            color: "#856404",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          ⚠️ Error submitting daily entry. Please try again.
        </div>
      );
    }
  };

  const handleClearForm = () => {
    setClient("");
    setProject("");
    setLoginTime({ hour: "", minute: "", period: "" });
    setLogoutTime({ hour: "", minute: "", period: "" });
    setTotalHours(0);
    setRemarks("");
    setErrors({});
  };

  const handleCancelAndClose = () => {
    handleClearForm();
    onClose();
  };

  const handleCloseOnly = () => {
    onClose();
  };

  const labelStyle = {
    display: "block",
    margin: "10px 5px 5px",
    fontWeight: "600",
  };

  const timeInputContainerStyle = {
    display: "flex",
    gap: "5px",
    width: "100%",
  };

  const selectStyle = {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    width: "100%",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          width: "600px",
          backgroundColor: "#fff",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <button
          onClick={handleCloseOnly}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          &times;
        </button>

        <h3>Submit Hours for Day {date}</h3>
        <form onSubmit={handleSubmit}>
          {/* Client */}
          <label style={labelStyle} htmlFor="client-select">
            Client <span style={{ color: "red" }}>*</span>
          </label>
          <select
            id="client-select"
            value={client}
            onChange={(e) => {
              setClient(e.target.value);
              if (e.target.value) setErrors((prev) => ({ ...prev, client: "" }));
            }}
            style={{
              padding: "8px",
              margin: "5px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              width: "99%",
            }}
          >
            <option value="">-- Select Client --</option>
            {clients.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.client && (
            <div style={{ color: "red", marginLeft: "5px" }}>{errors.client}</div>
          )}

          {/* Project */}
          <label style={labelStyle} htmlFor="project-select">
            Project <span style={{ color: "red" }}>*</span>
          </label>
          <select
            id="project-select"
            value={project}
            onChange={(e) => {
              setProject(e.target.value);
              if (e.target.value) setErrors((prev) => ({ ...prev, project: "" }));
            }}
            style={{
              padding: "8px",
              margin: "5px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              width: "99%",
            }}
          >
            <option value="">-- Select Project --</option>
            {projects.map((p, idx) => (
              <option key={idx} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.project && (
            <div style={{ color: "red", marginLeft: "5px" }}>{errors.project}</div>
          )}

          {/* Login / Logout */}
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            {/* Login Time */}
            <div style={{ flex: 1 }}>
              <label htmlFor="login-time" style={labelStyle}>
                Login Time <span style={{ color: "red" }}>*</span>
              </label>
              <div style={timeInputContainerStyle}>
                <select
                  value={loginTime.hour}
                  onChange={(e) => setLoginTime({ ...loginTime, hour: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Hr</option>
                  {hours.map((h) => (
                    <option key={h} value={h.toString()}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={loginTime.minute}
                  onChange={(e) => setLoginTime({ ...loginTime, minute: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Min</option>
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={loginTime.period}
                  onChange={(e) => setLoginTime({ ...loginTime, period: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">AM/PM</option>
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logout Time */}
            <div style={{ flex: 1 }}>
              <label htmlFor="logout-time" style={labelStyle}>
                Logout Time <span style={{ color: "red" }}>*</span>
              </label>
              <div style={timeInputContainerStyle}>
                <select
                  value={logoutTime.hour}
                  onChange={(e) => setLogoutTime({ ...logoutTime, hour: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Hr</option>
                  {hours.map((h) => (
                    <option key={h} value={h.toString()}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={logoutTime.minute}
                  onChange={(e) => setLogoutTime({ ...logoutTime, minute: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Min</option>
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={logoutTime.period}
                  onChange={(e) => setLogoutTime({ ...logoutTime, period: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">AM/PM</option>
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {errors.time && (
            <div style={{ color: "red", marginTop: "5px", fontWeight: "600" }}>
              {errors.time}
            </div>
          )}
          {errors.totalHours && (
            <div style={{ color: "red", marginTop: "5px", fontWeight: "600" }}>
              {errors.totalHours}
            </div>
          )}

          {/* Total Hours */}
          <label style={labelStyle} htmlFor="total-hours">
            Total Hours
          </label>
          <input
            id="total-hours"
            type="text"
            value={totalHours}
            readOnly
            placeholder="Total Hours"
            style={{
              padding: "8px",
              margin: "5px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
              width: "99%",
            }}
          />
          {totalHours > 0 && totalHours < 8 && (
            <div style={{ color: "red", marginTop: "5px", fontWeight: "600" }}>
              You have entered fewer than the required hours. Please confirm submission.
            </div>
          )}

          {/* Remarks */}
          <label style={labelStyle} htmlFor="remarks">
            Remarks
          </label>
          <input
            id="remarks"
            type="text"
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            style={{
              padding: "8px",
              margin: "5px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              width: "99%",
            }}
          />

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "15px",
            }}
          >
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginRight: "10px",
                fontWeight: "600",
                fontSize: "16px",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleCancelAndClose}
              style={{
                flex: 1,
                padding: "10px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#545b62")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DailyEntryForm;