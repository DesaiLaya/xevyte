package com.register.example.service;

import com.register.example.entity.PerformanceGoal;
import com.register.example.entity.Employee;
import com.register.example.entity.GoalComment;
import com.register.example.payload.EmployeeGoalStatusDTO;
import com.register.example.repository.PerformanceGoalRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PerformanceEmployeeRepository;
import com.register.example.repository.GoalCommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PerformanceGoalService {

    private final PerformanceGoalRepository goalRepository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceEmployeeRepository performanceEmployeeRepository;
    private final GoalCommentRepository commentRepository; // Added for comments

    @Autowired
    public PerformanceGoalService(PerformanceGoalRepository goalRepository,
                                  EmployeeRepository employeeRepository,
                                  PerformanceEmployeeRepository performanceEmployeeRepository,
                                  GoalCommentRepository commentRepository) {
        this.goalRepository = goalRepository;
        this.employeeRepository = employeeRepository;
        this.performanceEmployeeRepository = performanceEmployeeRepository;
        this.commentRepository = commentRepository;
    }

    // ----------------- EXISTING CODE -----------------

    // 1. Assign goal - status is always set to "Pending" initially
    public PerformanceGoal assignGoal(PerformanceGoal goal) {
        goal.setStatus("Pending");
        return goalRepository.save(goal);
    }

    // 2. Fetch goals by employee ID
    public List<PerformanceGoal> getGoalsByEmployee(String employeeId) {
        return goalRepository.findByEmployeeId(employeeId);
    }

    // Get rejected goals assigned by a particular manager
    public List<PerformanceGoal> getRejectedGoalsByManager(String managerId) {
        return goalRepository.findByAssignedByAndStatus(managerId, "Rejected");
    }

    // Reassign a goal by updating its details and resetting status & rejection reason
    public PerformanceGoal reassignGoal(Long goalId, PerformanceGoal updatedGoal) {
        PerformanceGoal existingGoal = goalRepository.findById(goalId).orElse(null);
        if (existingGoal != null) {
            existingGoal.setGoalTitle(updatedGoal.getGoalTitle());
            existingGoal.setGoalDescription(updatedGoal.getGoalDescription());
            existingGoal.setEmployeeId(updatedGoal.getEmployeeId());
            existingGoal.setAssignedBy(updatedGoal.getAssignedBy());
            existingGoal.setStatus("Pending");
            existingGoal.setRejectionReason(null);
            return goalRepository.save(existingGoal);
        }
        return null;
    }

    // Get goals submitted by employees to a specific manager
    public List<PerformanceGoal> getSubmittedGoalsByManager(String managerId) {
        return goalRepository.findByAssignedByAndStatus(managerId, "Submitted");
    }

    // Get goals for a particular employee under a specific manager
    public List<PerformanceGoal> getGoalsForEmployeeUnderManager(String managerId, String employeeId) {
        List<PerformanceGoal> allGoals = goalRepository.findByEmployeeId(employeeId);
        return allGoals.stream()
                .filter(goal -> managerId.equals(goal.getAssignedBy()))
                .collect(Collectors.toList());
    }

    // Fetch list of goals with employee info by manager, using a DTO projection
    public List<EmployeeGoalStatusDTO> getEmployeeGoalsByManager(String managerId) {
        return goalRepository.findEmployeeGoalsByManager(managerId);
    }

    // Fetch employees directly from Employee entity who are assigned to a given manager
    public List<Employee> getEmployeesUnderManager(String managerId) {
        return employeeRepository.findByAssignedManagerId(managerId);
    }

    // Fetch unique employees from the goals list (to avoid duplicates)
    public List<EmployeeGoalStatusDTO> getUniqueEmployeesUnderManager(String managerId) {
        List<EmployeeGoalStatusDTO> allGoals = goalRepository.findEmployeeGoalsByManager(managerId);

        Map<String, String> uniqueEmployees = new HashMap<>();
        for (EmployeeGoalStatusDTO goal : allGoals) {
            uniqueEmployees.put(goal.getEmployeeId(), goal.getEmployeeName());
        }

        return uniqueEmployees.entrySet().stream()
                .map(entry -> new EmployeeGoalStatusDTO(entry.getKey(), entry.getValue(), null, null))
                .collect(Collectors.toList());
    }

    // 3. Fetch all goals assigned by a manager
    public List<PerformanceGoal> getGoalsByManager(String managerId) {
        return goalRepository.findByAssignedBy(managerId);
    }

    // 4a. Update status only for a goal
    public PerformanceGoal updateGoalStatus(Long goalId, String status) {
        PerformanceGoal goal = goalRepository.findById(goalId).orElse(null);
        if (goal != null) {
            goal.setStatus(status);
            return goalRepository.save(goal);
        }
        return null;
    }

    // 4b. Update status and feedback (rejectionReason) together for a goal
    public PerformanceGoal updateGoalStatusAndFeedback(Long goalId, String status, String feedback) {
        PerformanceGoal goal = goalRepository.findById(goalId).orElse(null);
        if (goal != null) {
            goal.setStatus(status);
            goal.setRejectionReason(feedback);
            return goalRepository.save(goal);
        }
        return null;
    }

    // Batch update status of multiple goals
    public List<PerformanceGoal> updateGoalsStatus(List<Long> goalIds, String status) {
        List<PerformanceGoal> updatedGoals = new ArrayList<>();
        for (Long id : goalIds) {
            PerformanceGoal goal = goalRepository.findById(id).orElse(null);
            if (goal != null) {
                goal.setStatus(status);
                updatedGoals.add(goalRepository.save(goal));
            }
        }
        return updatedGoals;
    }

    // Fetch employees under a reviewer
    public List<Employee> getEmployeesUnderReviewer(String reviewerId) {
        return employeeRepository.findByReviewerId(reviewerId);
    }

    // Fetch employees under a HR person
    public List<Employee> getEmployeesByHrId(String hrId) {
        return employeeRepository.findByAssignedHrId(hrId);
    }

    // ----------------- NEW COMMENT FUNCTIONALITY -----------------

    // Add a comment to a goal
    public GoalComment addComment(Long goalId, GoalComment comment) {
        PerformanceGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found with ID: " + goalId));
        comment.setGoal(goal);
        return commentRepository.save(comment);
    }

    // Get all comments for a goal
    public List<GoalComment> getCommentsForGoal(Long goalId) {
        return commentRepository.findByGoal_GoalId(goalId);
    }
}
