package com.register.example.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "travel_history")
public class TravelHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "assigned_admin_id")
    private String assignedAdminId;

    // FK to TravelRequest.id
    @Column(name = "travel_request_id", nullable = false)
    private Long travelRequestId;

    private String employeeId; // the request owner
    private String actionBy;   // who performed the action (employeeId or managerId)
    private String action;     // Created, Approved, Rejected, Updated, Cancelled
    private String remarks;

    @Temporal(TemporalType.TIMESTAMP)
    private Date actionDate;

    public TravelHistory() {
        this.actionDate = new Date();
    }
    @Column(name = "rejected_reason")  // New column
    private String rejectedReason;
    // === Getters/Setters ===

    public Long getId() {
        return id;
    }

    public Long getTravelRequestId() {
        return travelRequestId;
    }

    public void setTravelRequestId(Long travelRequestId) {
        this.travelRequestId = travelRequestId;
    }
    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public String getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(String assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getActionBy() {
        return actionBy;
    }

    public void setActionBy(String actionBy) {
        this.actionBy = actionBy;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Date getActionDate() {
        return actionDate;
    }

    public void setActionDate(Date actionDate) {
        this.actionDate = actionDate;
    }
}
