package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "goal_comments")
public class GoalComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String commenterId;   // Employee ID or Manager ID
    private String commenterRole; // "EMPLOYEE" or "MANAGER"
    private String commentText;

    @Temporal(TemporalType.TIMESTAMP)
    private Date commentedAt = new Date();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    @JsonIgnore // Prevents Hibernate proxy serialization issues
    private PerformanceGoal goal;

    // --- Getters and Setters ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCommenterId() {
        return commenterId;
    }

    public void setCommenterId(String commenterId) {
        this.commenterId = commenterId;
    }

    public String getCommenterRole() {
        return commenterRole;
    }

    public void setCommenterRole(String commenterRole) {
        this.commenterRole = commenterRole;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public Date getCommentedAt() {
        return commentedAt;
    }

    public void setCommentedAt(Date commentedAt) {
        this.commentedAt = commentedAt;
    }

    public PerformanceGoal getGoal() {
        return goal;
    }

    public void setGoal(PerformanceGoal goal) {
        this.goal = goal;
    }
}
