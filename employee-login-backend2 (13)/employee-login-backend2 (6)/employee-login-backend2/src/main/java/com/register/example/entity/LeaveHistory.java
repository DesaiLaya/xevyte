package com.register.example.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "leave_history")
public class LeaveHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeId;      // Employee who applied for leave
    private String actionBy;        // Who performed the action (Manager/HR)
    private String actionRole;      // Role of the actionBy (Manager/HR)
    private String status;          // Status after this action: "Pending", "Approved", "Rejected"
    private String remarks;         // Comments or remarks for this action

    @Temporal(TemporalType.TIMESTAMP)
    private Date actionDate = new Date(); // Date of this action

    private Long leaveRequestId;    // Link to LeaveRequest

    // ===== Getters & Setters =====

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getActionBy() { return actionBy; }
    public void setActionBy(String actionBy) { this.actionBy = actionBy; }

    public String getActionRole() { return actionRole; }
    public void setActionRole(String actionRole) { this.actionRole = actionRole; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Date getActionDate() { return actionDate; }
    public void setActionDate(Date actionDate) { this.actionDate = actionDate; }

    public Long getLeaveRequestId() { return leaveRequestId; }
    public void setLeaveRequestId(Long leaveRequestId) { this.leaveRequestId = leaveRequestId; }
}
