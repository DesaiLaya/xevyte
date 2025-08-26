package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "daily_entries")
public class DailyEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeId;
    private String managerId;
    private String hrId;

    private LocalDate date;
    private String client;
    private String project;
    private String loginTime;
    private String logoutTime;
    private double totalHours;
    private String remarks;
    
    private boolean frozen = false; // NEW FIELD


    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }

    public String getHrId() { return hrId; }
    public void setHrId(String hrId) { this.hrId = hrId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public String getLoginTime() { return loginTime; }
    public void setLoginTime(String loginTime) { this.loginTime = loginTime; }

    public String getLogoutTime() { return logoutTime; }
    public void setLogoutTime(String logoutTime) { this.logoutTime = logoutTime; }

    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    


    // getters & setters
    public boolean isFrozen() {
        return frozen;
    }
    public void setFrozen(boolean frozen) {
        this.frozen = frozen;
    }
}
