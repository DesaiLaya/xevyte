package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_balances")
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeId;

    private String type;

    private int granted;
    private int consumed;
    private int balance;
    
    private int year; // ADDED: Field to track the year of the leave balance

    // Default constructor
    public LeaveBalance() {}

    // Constructor with all fields
    public LeaveBalance(String employeeId, String type, int granted, int consumed, int balance, int year) {
        this.employeeId = employeeId;
        this.type = type;
        this.granted = granted;
        this.consumed = consumed;
        this.balance = balance;
        this.year = year;
    }

    // Getters and Setters
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getGranted() {
        return granted;
    }

    public void setGranted(int granted) {
        this.granted = granted;
    }

    public int getConsumed() {
        return consumed;
    }

    public void setConsumed(int consumed) {
        this.consumed = consumed;
    }

    public int getBalance() {
        return balance;
    }

    public void setBalance(int balance) {
        this.balance = balance;
    }
    
    // ADDED: Getter and setter for the 'year' field
    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }
}