package com.register.example.payload;

import java.time.LocalDate;

public class DailyEntryDTO {
    private LocalDate date;
    private String client;
    private String project;
    private String loginTime;
    private String logoutTime;
    private double totalHours;
    private String remarks;

    // Getters & Setters
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
}
