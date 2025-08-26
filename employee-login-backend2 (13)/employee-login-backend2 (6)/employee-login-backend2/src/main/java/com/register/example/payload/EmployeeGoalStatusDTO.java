package com.register.example.payload;

/**
 * Container class for Employee Goal related DTOs.
 */
public class EmployeeGoalStatusDTO {

    private String employeeId;
    private String employeeName;
    private String goalTitle;
    private String status;
    private String feedback;
    private String reviewerComments;
    // ➕ New fields
    private Integer rating;
    private String achievedTarget;
    private String selfAssessment;
    private String additionalNotes;
    private Integer managerRating;
    private String managerComments;
    private String metric;
    private String target;
    
    private String assignedAdminId;
//    private String receiptBase64;
    
    

    // Constructors
    public EmployeeGoalStatusDTO() {
        // No-arg constructor
    }

    public EmployeeGoalStatusDTO(String employeeId, String employeeName, String goalTitle, String status) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.goalTitle = goalTitle;
        this.status = status;
    }

    // Getters and Setters
    private Long goalId;

    public Long getGoalId() {
        return goalId;
    }
    public String getReviewerComments() {
        return reviewerComments;
    }
 
    public void setReviewerComments(String reviewerComments) {
        this.reviewerComments = reviewerComments;
    }
    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }

    public String getEmployeeId() {
        return employeeId;
    }
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }
    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getGoalTitle() {
        return goalTitle;
    }
    public void setGoalTitle(String goalTitle) {
        this.goalTitle = goalTitle;
    }

    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    public String getFeedback() {
        return feedback;
    }
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
    public String getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(String assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
        
    }
    
//    public String getReceiptBase64() {
//        return receiptBase64;
//    }
//    public void setReceiptBase64(String receiptBase64) {
//        this.receiptBase64 = receiptBase64;
//    }

    // ➕ New Getters and Setters

    public Integer getRating() {
        return rating;
    }
    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getAchievedTarget() {
        return achievedTarget;
    }
    public void setAchievedTarget(String achievedTarget) {
        this.achievedTarget = achievedTarget;
    }

    public String getSelfAssessment() {
        return selfAssessment;
    }
    public void setSelfAssessment(String selfAssessment) {
        this.selfAssessment = selfAssessment;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }
    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public Integer getManagerRating() {
        return managerRating;
    }
    public void setManagerRating(Integer managerRating) {
        this.managerRating = managerRating;
    }

    public String getManagerComments() {
        return managerComments;
    }
    public void setManagerComments(String managerComments) {
        this.managerComments = managerComments;
    }
  
    public String getMetric() {
        return metric;
    }

    public void setMetric(String metric) {
        this.metric = metric;
    }
    
    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }
    
    /**
     * Static inner class for updating goal status and feedback.
     */
    public static class GoalStatusUpdateDTO {
        private String status;
        private String selfAssessment;   // renamed from 'feedback' for clarity
        private Integer rating;
        private String achievedTarget;
        private String additionalNotes;
        private Integer managerRating;
        private String managerComments;

        public GoalStatusUpdateDTO() {
            // No-arg constructor
        }

        // Getters and Setters

        public String getStatus() {
            return status;
        }
        public void setStatus(String status) {
            this.status = status;
        }

        public String getSelfAssessment() {
            return selfAssessment;
        }
        public void setSelfAssessment(String selfAssessment) {
            this.selfAssessment = selfAssessment;
        }

        public Integer getRating() {
            return rating;
        }
        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getAchievedTarget() {
            return achievedTarget;
        }
        public void setAchievedTarget(String achievedTarget) {
            this.achievedTarget = achievedTarget;
        }

        public String getAdditionalNotes() {
            return additionalNotes;
        }
        public void setAdditionalNotes(String additionalNotes) {
            this.additionalNotes = additionalNotes;
        }

        public Integer getManagerRating() {
            return managerRating;
        }
        public void setManagerRating(Integer managerRating) {
            this.managerRating = managerRating;
        }

        public String getManagerComments() {
            return managerComments;
        }
        public void setManagerComments(String managerComments) {
            this.managerComments = managerComments;
        }
    }
}
