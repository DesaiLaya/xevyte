package com.register.example.scheduler;

import com.register.example.entity.PerformanceGoal;
import com.register.example.repository.PerformanceGoalRepository;
import com.register.example.repository.NotificationRepository;
import com.register.example.entity.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Component
public class GoalEscalationScheduler {

    @Autowired
    private PerformanceGoalRepository goalRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Runs every 1 hour (3600000 ms) — adjust to once a day in production.
     */
    @Scheduled(fixedRate = 60000) // runs every 1 min

    public void checkAndUpdateGoals() {
        LocalDate today = LocalDate.now();
        System.out.println("📅 Goal Scheduler running at: " + today);

        // 1️⃣ Update goals to "In Progress" if not accepted/rejected within 15 days of start date
        List<PerformanceGoal> pendingGoals = goalRepository.findByStatus("Pending");
        for (PerformanceGoal goal : pendingGoals) {
            if (goal.getStartDate() != null) {
                long daysSinceStart = ChronoUnit.DAYS.between(goal.getStartDate().toLocalDate(), today);
                if (daysSinceStart >= 15) {
                    goal.setStatus("In Progress");
                    goalRepository.save(goal);

                    // Notification to employee
                    Notification notification = new Notification();
                    notification.setEmployeeId(goal.getEmployeeId());
                    notification.setMessage("🎯 Your goal '" + goal.getGoalTitle() +
                            "' has been automatically moved to 'In Progress' status.");
                    notification.setTimestamp(new Date());
                    notificationRepository.save(notification);

                    System.out.println("➡️ Goal " + goal.getGoalId() + " moved to 'In Progress' for employee " + goal.getEmployeeId());
                }
            }
        }

        // 2️⃣ Auto-submit goals to Manager if not submitted 7 days before end date
        List<PerformanceGoal> inProgressGoals = goalRepository.findByStatus("In Progress");
        for (PerformanceGoal goal : inProgressGoals) {
            if (goal.getEndDate() != null) {
                long daysUntilEnd = ChronoUnit.DAYS.between(today, goal.getEndDate().toLocalDate());
                if (daysUntilEnd <= 7 && !"Submitted".equalsIgnoreCase(goal.getStatus())) {
                    goal.setStatus("Submitted");
                    goalRepository.save(goal);

                    // Notification to employee
                    Notification notification = new Notification();
                    notification.setEmployeeId(goal.getEmployeeId());
                    notification.setMessage("📤 Your goal '" + goal.getGoalTitle() +
                            "' has been automatically submitted to your manager as the quarter is ending.");
                    notification.setTimestamp(new Date());
                    notificationRepository.save(notification);

                    System.out.println("📤 Goal " + goal.getGoalId() + " auto-submitted for employee " + goal.getEmployeeId());
                }
            }
        }
    }
}