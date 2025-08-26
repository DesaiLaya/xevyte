package com.register.example.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeId;
    private String assignedManagerId;
    private String assignedHrId;
    
    // Corrected: Add the 'type' field to store the leave type (e.g., Casual, Sick)
    private String type;

    @Temporal(TemporalType.DATE)
    private Date startDate;

    @Temporal(TemporalType.DATE)
    private Date endDate;

    // Corrected: Renamed from 'numberOfDays' to 'totalDays' to match the DTO and frontend
    private int totalDays; 
    
    private String reason;
    private String status;
    private String rejectionReason;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    private boolean counted = false;

    // New fields for file upload
    @Lob
    @Column(name = "attachment", columnDefinition = "LONGBLOB")
    private byte[] attachment;

    private String fileName;
    private String fileType;

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getAssignedManagerId() { return assignedManagerId; }
    public void setAssignedManagerId(String assignedManagerId) { this.assignedManagerId = assignedManagerId; }

    public String getAssignedHrId() { return assignedHrId; }
    public void setAssignedHrId(String assignedHrId) { this.assignedHrId = assignedHrId; }
    
    // Corrected: Add getter and setter for the 'type' field
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Date getStartDate() { return startDate; }
    public void setStartDate(Date startDate) { this.startDate = startDate; }

    public Date getEndDate() { return endDate; }
    public void setEndDate(Date endDate) { this.endDate = endDate; }
    
    // Corrected: Rename getter and setter for 'totalDays'
    public int getTotalDays() { return totalDays; }
    public void setTotalDays(int totalDays) { this.totalDays = totalDays; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }

    public boolean isCounted() { return counted; }
    public void setCounted(boolean counted) { this.counted = counted; }

    public byte[] getAttachment() { return attachment; }
    public void setAttachment(byte[] attachment) { this.attachment = attachment; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
}