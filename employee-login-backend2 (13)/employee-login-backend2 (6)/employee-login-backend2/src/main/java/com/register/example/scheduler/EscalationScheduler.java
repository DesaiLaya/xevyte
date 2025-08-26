package com.register.example.scheduler;

import com.register.example.entity.Claim;
import com.register.example.entity.ClaimHistory;
import com.register.example.entity.Notification;
import com.register.example.repository.ClaimHistoryRepository;
import com.register.example.repository.ClaimRepository;
import com.register.example.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class EscalationScheduler {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ClaimHistoryRepository claimHistoryRepository;

    @Scheduled(fixedRate = 3600000) // runs every 1 minute (for testing)
    public void escalateAndAutoRejectClaims() {
        Date now = new Date();
        System.out.println("⏰ Scheduler running at: " + now);

        // Escalate from Manager to Finance after 5 days (120 hours)
        List<Claim> managerClaims = claimRepository.findByStatusAndNextApprover("Pending", "Manager");
        for (Claim claim : managerClaims) {
            long diffHours = TimeUnit.MILLISECONDS.toHours(now.getTime() - claim.getSubmittedDate().getTime());
            if (diffHours >= 120) {
                claim.setNextApprover("Finance");
                claimRepository.save(claim);

                // Claim History
                ClaimHistory history = new ClaimHistory();
                history.setEmployeeId(claim.getEmployeeId());
                history.setAmount(claim.getAmount());
                history.setCategory(claim.getCategory());
                history.setDate(now);
                history.setStatus("Escalated to Finance");
                claimHistoryRepository.save(history);

                // Notification
                Notification notification = new Notification();
                notification.setEmployeeId(claim.getEmployeeId());
                notification.setMessage("⏫ Claim escalated to Finance due to Manager inaction.");
                notification.setTimestamp(now);
                notificationRepository.save(notification);
            }
        }

        // Auto-reject from Finance after 10 days (240 hours)
        List<Claim> financeClaims = claimRepository.findByStatusAndNextApprover("Pending", "Finance");
        for (Claim claim : financeClaims) {
            long diffHours = TimeUnit.MILLISECONDS.toHours(now.getTime() - claim.getSubmittedDate().getTime());
            if (diffHours >= 240) {
                claim.setStatus("Rejected");
                claim.setNextApprover(null);
                claim.setRejectionReason("❌ Automatically rejected due to Finance inaction.");
                claimRepository.save(claim);

                // Claim History
                ClaimHistory history = new ClaimHistory();
                history.setEmployeeId(claim.getEmployeeId());
                history.setAmount(claim.getAmount());
                history.setCategory(claim.getCategory());
                history.setDate(now);
                history.setStatus("Auto-Rejected by System");
                claimHistoryRepository.save(history);

                // Notification
                Notification notification = new Notification();
                notification.setEmployeeId(claim.getEmployeeId());
                notification.setMessage("❌ Your claim was auto-rejected due to Finance inaction.");
                notification.setTimestamp(now);
                notificationRepository.save(notification);
            }
        }
    }
}