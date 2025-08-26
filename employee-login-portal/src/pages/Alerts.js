import React from "react";

function Alerts({ alerts }) {
  return (
    <div style={{ marginTop: "20px" }}>
      {alerts.map((msg, index) => (
        <div
          key={index}
          style={{
            // The background, border, and color styles are removed here
            padding: "10px",
            margin: "5px 0",
            borderRadius: "5px",
          }}
        >
          {msg}
        </div>
      ))}
    </div>
  );
}

export default Alerts;