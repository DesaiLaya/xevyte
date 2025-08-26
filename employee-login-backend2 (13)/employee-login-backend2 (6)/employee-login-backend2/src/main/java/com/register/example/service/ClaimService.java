package com.register.example.service;

import com.register.example.entity.Claim;
import com.register.example.entity.Employee;
import com.register.example.entity.Notification;
import com.register.example.entity.ClaimHistory;
import com.register.example.repository.ClaimRepository;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.ClaimHistoryRepository;
import com.register.example.repository.NotificationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ClaimHistoryRepository claimHistoryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // Submit claim with optional receipt
    public Claim submitClaimWithReceipt(Claim claim, MultipartFile receiptFile) throws IOException {
        if (receiptFile != null && !receiptFile.isEmpty()) {
            if (receiptFile.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Receipt file size exceeds 5MB limit");
            }
            claim.setReceipt(receiptFile.getBytes());
            claim.setReceiptName(receiptFile.getOriginalFilename());
        }

        // Set initial values
        claim.setStatus("Pending");
        claim.setNextApprover("Manager");
        claim.setSubmittedDate(new Date());

        // Set assigned approvers dynamically from employee table
        Optional<Employee> empOpt = employeeRepository.findByEmployeeId(claim.getEmployeeId());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            claim.setAssignedManagerId(emp.getAssignedManagerId());
            claim.setAssignedFinanceId(emp.getAssignedFinanceId());
            claim.setAssignedHrId(emp.getAssignedHrId());
            claim.setName(emp.getName());
        }

        return claimRepository.save(claim);
    }
    public List<Claim> getClaimsForManager(String managerId) {
        return claimRepository.findByAssignedManagerIdAndStatusAndNextApprover(managerId, "Pending", "Manager");
    }
    public List<Claim> getClaimsForFinance(String financeId) {
        return claimRepository.findByNextApproverAndAssignedFinanceId("Finance", financeId);
    }
    public List<Claim> getClaimsByHrId(String hrId) {
        return claimRepository.findByAssignedHrIdAndNextApproverAndStatusNot(hrId, "HR", "Paid");
    }

    // Approve Claim
    public String approveClaim(Long id, String role) {
        Optional<Claim> optionalClaim = claimRepository.findById(id);
        if (!optionalClaim.isPresent()) return "Claim not found";

        Claim claim = optionalClaim.get();

        switch (role) {
            case "Manager":
                claim.setStatus("Pending");
                claim.setNextApprover("Finance");
                sendNotification(claim.getAssignedFinanceId(), "New claim needs approval.");
                break;
            case "Finance":
                claim.setStatus("Approved by Finance");
                claim.setNextApprover("HR");
                sendNotification(claim.getAssignedHrId(), "Claim ready for HR processing.");
                break;
            case "HR":
                claim.setStatus("Approved");
                claim.setNextApprover(null);
                break;
            default:
                return "Invalid role";
        }

        claimRepository.save(claim);
        return "Claim approved by " + role;
    }

    // Reject Claim
    public String rejectClaim(Long id, String role, String reason) {
        Optional<Claim> optionalClaim = claimRepository.findById(id);
        if (!optionalClaim.isPresent()) return "Claim not found";

        Claim claim = optionalClaim.get();
        claim.setStatus("Rejected");
        claim.setNextApprover(null);
        claim.setRejectionReason(reason);
        claimRepository.save(claim);

        sendNotification(claim.getEmployeeId(), "Your claim has been rejected. Reason: " + reason);

        return "Claim rejected by " + role;
    }

    // Claim history
    public List<Claim> getClaimHistoryByEmployee(String employeeId) {
        return claimRepository.findByEmployeeId(employeeId);
    }

    // HR updates payment status
    public String updateHRStatus(Long claimId, String status) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        claim.setStatus(status);

        if ("Paid".equalsIgnoreCase(status)) {
            claim.setNextApprover(null);

            ClaimHistory history = new ClaimHistory();
            history.setEmployeeId(claim.getEmployeeId());
            history.setAmount(claim.getAmount());
            history.setCategory(claim.getCategory());
            history.setDate(new Date());
            history.setStatus("Paid");

            claimHistoryRepository.save(history);
        }

        claimRepository.save(claim);
        return "Claim status updated to " + status;
    }

    // Summary of claims
    public Map<String, Object> getClaimSummaryByEmployeeId(String employeeId) {
        List<Claim> claims = claimRepository.findByEmployeeId(employeeId);

        long totalClaims = claims.size();
        long approved = claims.stream()
                .filter(c -> "Approved by Finance".equalsIgnoreCase(c.getStatus()) || "Paid".equalsIgnoreCase(c.getStatus()))
                .count();
        long rejected = claims.stream()
                .filter(c -> c.getStatus().toLowerCase().contains("rejected"))
                .count();
        double paidAmount = claims.stream()
                .filter(c -> "Paid".equalsIgnoreCase(c.getStatus()))
                .mapToDouble(Claim::getAmount)
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClaims", totalClaims);
        summary.put("approved", approved);
        summary.put("rejected", rejected);
        summary.put("paidAmount", paidAmount);

        return summary;
    }

    // Notification
    public List<Notification> getNotifications(String employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    public String markNotificationAsRead(Long id) {
        Optional<Notification> optionalNotification = notificationRepository.findById(id);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            notification.setRead(true);
            notificationRepository.save(notification);
            return "Notification marked as read.";
        }
        return "Notification not found.";
    }

    public void sendNotification(String employeeId, String message) {
        if (employeeId == null || employeeId.isEmpty()) return;

        Notification notification = new Notification();
        notification.setEmployeeId(employeeId);
        notification.setMessage(message);
        notification.setTimestamp(new Date());
        notification.setRead(false);

        notificationRepository.save(notification);
    }

    // Receipt download
    public Claim findById(Long id) {
        return claimRepository.findById(id).orElse(null);
    }
}