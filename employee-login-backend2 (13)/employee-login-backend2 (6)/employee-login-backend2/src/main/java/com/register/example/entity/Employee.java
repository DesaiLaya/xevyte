package com.register.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate; // ✅ You forgot this import

@Entity
@Table(name = "employee_portal")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assigned_admin_id")
    private String assignedAdminId;

    @Column(name = "employee_id", unique = true, nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String email;

    @Column(name = "joining_date")
    private LocalDate joiningDate; // ✅ Now works fine

    private Integer failedAttempts = 0;

    private Boolean accountLocked = false;

    private String role;

    private String assignedManagerId;
    private String assignedFinanceId;
    private String assignedHrId;
    private String reviewerId;

    @Lob
    @Column(length = 1000000)
    private String profilePic;

    // === Constructors ===
    public Employee() {}

    public Employee(String employeeId, String password, String email) {
        this.employeeId = employeeId;
        this.password = password;
        this.email = email;
    }

    // === Getters & Setters ===
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(String assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getFailedAttempts() {
        return failedAttempts != null ? failedAttempts : 0;
    }

    public void setFailedAttempts(Integer failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public void incrementFailedAttempts() {
        if (this.failedAttempts == null) this.failedAttempts = 0;
        this.failedAttempts++;
        if (this.failedAttempts >= 3) this.accountLocked = true;
    }

    public Boolean isAccountLocked() {
        return accountLocked != null && accountLocked;
    }

    public void setAccountLocked(Boolean accountLocked) {
        this.accountLocked = accountLocked;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAssignedManagerId() {
        return assignedManagerId;
    }

    public void setAssignedManagerId(String assignedManagerId) {
        this.assignedManagerId = assignedManagerId;
    }

    public String getAssignedFinanceId() {
        return assignedFinanceId;
    }

    public void setAssignedFinanceId(String assignedFinanceId) {
        this.assignedFinanceId = assignedFinanceId;
    }

    public String getAssignedHrId() {
        return assignedHrId;
    }

    public void setAssignedHrId(String assignedHrId) {
        this.assignedHrId = assignedHrId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(String reviewerId) {
        this.reviewerId = reviewerId;
    }
}
