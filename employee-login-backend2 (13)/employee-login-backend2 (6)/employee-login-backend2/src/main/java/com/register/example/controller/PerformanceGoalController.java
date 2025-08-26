package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.entity.PerformanceGoal;
import com.register.example.entity.GoalComment;
import com.register.example.payload.EmployeeGoalStatusDTO;
import com.register.example.payload.EmployeeGoalStatusDTO.GoalStatusUpdateDTO;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PerformanceGoalRepository;
import com.register.example.repository.GoalCommentRepository;
import com.register.example.service.PerformanceGoalService;
import com.register.example.payload.ReviewRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.sql.Date;

@RestController
@RequestMapping("/api/goals")
@CrossOrigin(origins = "http://localhost:3000")
public class PerformanceGoalController {

    private final PerformanceGoalService performanceGoalService;

    public PerformanceGoalController(PerformanceGoalService performanceGoalService) {
        this.performanceGoalService = performanceGoalService;
    }

    @Autowired
    private PerformanceGoalService goalService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PerformanceGoalRepository goalRepository;

    @Autowired
    private GoalCommentRepository goalCommentRepository;

    @PostMapping("/assign")
    public ResponseEntity<?> assignGoal(@RequestBody PerformanceGoal goal) {
        try {
            String targetEmployeeId = goal.getEmployeeId();
            if (targetEmployeeId == null || targetEmployeeId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Employee ID is required.");
            }
            Optional<Employee> optionalEmp = employeeRepository.findByEmployeeId(targetEmployeeId);
            if (!optionalEmp.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Employee not found with ID: " + targetEmployeeId);
            }
            Employee employee = optionalEmp.get();
            goal.setEmployeeId(employee.getEmployeeId());
            LocalDate localStartDate = LocalDate.now();
            LocalDate localEndDate = localStartDate.plusMonths(3);
            Date startDate = Date.valueOf(localStartDate);
            Date endDate = Date.valueOf(localEndDate);
            goal.setStartDate(startDate);
            goal.setEndDate(endDate);
            goal.setStatus("Pending");
            PerformanceGoal saved = goalRepository.save(goal);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning goal: " + e.getMessage());
        }
    }

    @GetMapping("/employee/{empId}")
    public ResponseEntity<?> getGoalsForEmployee(@PathVariable String empId) {
        try {
            List<PerformanceGoal> goals = goalService.getGoalsByEmployee(empId);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @DeleteMapping("/delete/{goalId}")
    public ResponseEntity<?> deleteGoal(@PathVariable Long goalId) {
        try {
            if (!goalRepository.existsById(goalId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found with ID: " + goalId);
            }
            goalRepository.deleteById(goalId);
            return ResponseEntity.ok("Goal with ID " + goalId + " deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete goal: " + e.getMessage());
        }
    }
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<?> getGoalsForManager(@PathVariable String managerId) {
        try {
            List<PerformanceGoal> goals = goalService.getGoalsByManager(managerId);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/rejected/{managerId}")
    public ResponseEntity<?> getRejectedGoalsByManager(@PathVariable String managerId) {
        try {
            List<PerformanceGoal> goals = goalService.getRejectedGoalsByManager(managerId);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching rejected goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/reassign/{goalId}")
    public ResponseEntity<?> reassignGoal(@PathVariable Long goalId, @RequestBody PerformanceGoal updatedGoal) {
        try {
            PerformanceGoal reassignedGoal = goalService.reassignGoal(goalId, updatedGoal);
            return new ResponseEntity<>(reassignedGoal, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to reassign goal: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employees")
    public ResponseEntity<?> getEmployeesAssignedByManager(@PathVariable String managerId) {
        try {
            List<Employee> employees = goalService.getEmployeesUnderManager(managerId);
            return new ResponseEntity<>(employees, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employees: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/submitted/{managerId}")
    public ResponseEntity<?> getSubmittedGoalsForManager(@PathVariable String managerId) {
        try {
            List<PerformanceGoal> goals = goalService.getSubmittedGoalsByManager(managerId);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching submitted goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employee-goals")
    public ResponseEntity<?> getGoalsUnderManager(@PathVariable String managerId) {
        try {
            List<EmployeeGoalStatusDTO> goals = goalService.getEmployeeGoalsByManager(managerId);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employee goals: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/manager/{managerId}/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeGoalDetailsUnderManager(@PathVariable String managerId, @PathVariable String employeeId) {
        try {
            List<PerformanceGoal> goals = goalService.getGoalsForEmployeeUnderManager(managerId, employeeId);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching employee goal details: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{goalId}/status")
    public ResponseEntity<?> updateGoalStatus(@PathVariable Long goalId, @RequestBody GoalStatusUpdateDTO updateDTO) {
        try {
            PerformanceGoal updatedGoal = goalService.updateGoalStatusAndFeedback(goalId, updateDTO.getStatus(), updateDTO.getSelfAssessment());
            return new ResponseEntity<>(updatedGoal, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update goal status: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/reviewer/{reviewerId}/employees")
    public ResponseEntity<?> getEmployees(@PathVariable String reviewerId) {
        try {
            List<Employee> employees = goalService.getEmployeesUnderReviewer(reviewerId);
            return ResponseEntity.ok(employees);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching employees under reviewer: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}/employees")
    public List<Employee> getEmployeesByHrId(@PathVariable String hrId) {
        return goalService.getEmployeesByHrId(hrId);
    }

    @PatchMapping("/review")
    public ResponseEntity<?> reviewGoals(@RequestBody ReviewRequest reviewRequest) {
        try {
            List<Long> goalIds = reviewRequest.getGoalIds();
            String status = reviewRequest.getStatus();
            List<PerformanceGoal> updatedGoals = performanceGoalService.updateGoalsStatus(goalIds, status);
            return ResponseEntity.ok(updatedGoals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to review goals: " + e.getMessage());
        }
    }

    @PutMapping("/{goalId}/employee-feedback")
    public ResponseEntity<?> updateEmployeeFeedback(@PathVariable Long goalId,
                                                    @RequestBody EmployeeGoalStatusDTO.GoalStatusUpdateDTO request) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
        PerformanceGoal goal = optionalGoal.get();
        goal.setStatus(request.getStatus());
        goal.setSelfAssessment(request.getSelfAssessment());
        goal.setRating(request.getRating());
        goal.setAdditionalNotes(request.getAdditionalNotes());
        goal.setAchievedTarget(request.getAchievedTarget());
        goal.setManagerRating(request.getManagerRating());
        goal.setManagerComments(request.getManagerComments());
        goalRepository.save(goal);
        return ResponseEntity.ok("Employee feedback saved successfully");
    }

    @GetMapping("/{goalId}/feedback")
    public ResponseEntity<?> getFeedback(@PathVariable Long goalId) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
        PerformanceGoal goal = optionalGoal.get();
        Map<String, Object> feedbackData = new HashMap<>();
        feedbackData.put("goalId", goal.getGoalId());
        feedbackData.put("rating", goal.getRating());
        feedbackData.put("selfAssessment", goal.getSelfAssessment());
        feedbackData.put("additionalNotes", goal.getAdditionalNotes());
        feedbackData.put("status", goal.getStatus());
        return ResponseEntity.ok(feedbackData);
    }

    @PutMapping("/{goalId}/manager-feedback")
    public ResponseEntity<?> updateManagerFeedback(
            @PathVariable Long goalId,
            @RequestBody EmployeeGoalStatusDTO.GoalStatusUpdateDTO feedbackDTO) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
        PerformanceGoal goal = optionalGoal.get();
        goal.setAchievedTarget(feedbackDTO.getAchievedTarget());
        goal.setManagerRating(feedbackDTO.getManagerRating());
        goal.setManagerComments(feedbackDTO.getManagerComments());
        goalRepository.save(goal);
        return ResponseEntity.ok("Manager feedback updated successfully");
    }

    @PutMapping("/manager-feedback")
    public ResponseEntity<?> submitBulkFeedback(@RequestBody List<EmployeeGoalStatusDTO> feedbackList) {
        try {
            List<PerformanceGoal> updatedGoals = feedbackList.stream()
                    .map(feedback -> {
                        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(feedback.getGoalId());
                        if (optionalGoal.isPresent()) {
                            PerformanceGoal goal = optionalGoal.get();
                            if (feedback.getAchievedTarget() != null) {
                                goal.setAchievedTarget(feedback.getAchievedTarget());
                            }
                            if (feedback.getManagerComments() != null) {
                                goal.setManagerComments(feedback.getManagerComments());
                            }
                            if (feedback.getManagerRating() != null) {
                                goal.setManagerRating(feedback.getManagerRating());
                            }
                            return goalRepository.save(goal);
                        } else {
                            throw new RuntimeException("Goal not found: " + feedback.getGoalId());
                        }
                    }).toList();
            return ResponseEntity.ok(updatedGoals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to submit bulk feedback: " + e.getMessage());
        }
    }

    @GetMapping("/{goalId}/manager-feedback")
    public ResponseEntity<?> getManagerFeedback(@PathVariable Long goalId) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
        PerformanceGoal goal = optionalGoal.get();
        Map<String, Object> response = new HashMap<>();
        response.put("goalId", goal.getGoalId());
        response.put("goalTitle", goal.getGoalTitle());
        response.put("achievedTarget", goal.getAchievedTarget());
        response.put("managerRating", goal.getManagerRating());
        response.put("managerComments", goal.getManagerComments());
        return ResponseEntity.ok(response);
    }

    // ======================
    // 📌 Goal Comments APIs
    // ======================

    @PostMapping("/{goalId}/comments")
    public ResponseEntity<?> addCommentToGoal(@PathVariable Long goalId, @RequestBody GoalComment comment) {
        Optional<PerformanceGoal> goalOpt = goalRepository.findById(goalId);
        if (goalOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
        comment.setGoal(goalOpt.get());
        GoalComment savedComment = goalCommentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedComment);
    }

    @GetMapping("/{goalId}/comments")
    public ResponseEntity<?> getCommentsForGoal(@PathVariable Long goalId) {
        List<GoalComment> comments = goalCommentRepository.findByGoal_GoalId(goalId);
        return ResponseEntity.ok(comments);
    }
    @PutMapping("/{goalId}/reviewer-comments")
    public ResponseEntity<?> updateReviewerComments(@PathVariable Long goalId,
                                                    @RequestBody Map<String, String> payload) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
     
        PerformanceGoal goal = optionalGoal.get();
     
        String reviewerComments = payload.get("reviewerComments");
        if (reviewerComments == null || reviewerComments.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Reviewer comments cannot be empty");
        }
     
        goal.setReviewerComments(reviewerComments);
        goalRepository.save(goal);
     
        return ResponseEntity.ok("Reviewer comments saved successfully");
    }
     
    @GetMapping("/{goalId}/reviewer-comments")
    public ResponseEntity<?> getReviewerComments(@PathVariable Long goalId) {
        Optional<PerformanceGoal> optionalGoal = goalRepository.findById(goalId);
        if (optionalGoal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Goal not found");
        }
     
        PerformanceGoal goal = optionalGoal.get();
     
        Map<String, Object> response = new HashMap<>();
        response.put("goalId", goal.getGoalId());
        response.put("reviewerComments", goal.getReviewerComments());
     
        return ResponseEntity.ok(response);
    }
     
     
     
}
