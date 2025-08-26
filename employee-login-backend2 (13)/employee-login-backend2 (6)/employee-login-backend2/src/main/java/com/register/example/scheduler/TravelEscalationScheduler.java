package com.register.example.scheduler;

import com.register.example.entity.TravelHistory;
import com.register.example.entity.TravelRequest;
import com.register.example.repository.TravelHistoryRepository;
import com.register.example.repository.TravelRequestRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Component
public class TravelEscalationScheduler {

    private final TravelRequestRepository requestRepository;
    private final TravelHistoryRepository historyRepository;

    public TravelEscalationScheduler(TravelRequestRepository requestRepository,
                                     TravelHistoryRepository historyRepository) {
        this.requestRepository = requestRepository;
        this.historyRepository = historyRepository;
    }

    // Runs every hour
    @Scheduled(fixedRate = 60 * 60 * 1000) // every 1 hour
    @Transactional
    public void checkPendingRequests() {
        Date now = new Date();

        // 1️⃣ Manager Pending > 48 hours → auto reject
        List<TravelRequest> managerPendingRequests = requestRepository.findByAssignedManagerIdAndStatus(null, "Pending");
        for (TravelRequest req : managerPendingRequests) {
            // If assignedManagerId is null, skip (just in case)
            if (req.getAssignedManagerId() == null) continue;

            long hoursPending = (now.getTime() - req.getCreatedAt().getTime()) / (1000 * 60 * 60);
            if (hoursPending >= 48) {
                String reason = "Automatically rejected: Manager did not take action within 48 hours";

                req.setStatus("Rejected");
                req.setRejectedReason(reason);
                req.setRemarks(reason);
                req.setUpdatedAt(now);
                requestRepository.save(req);

                // Log in TravelHistory
                TravelHistory history = new TravelHistory();
                history.setTravelRequestId(req.getId());
                history.setEmployeeId(req.getEmployeeId());
                history.setActionBy("SYSTEM");
                history.setAction("Rejected");
                history.setRemarks(reason);
                history.setRejectedReason(reason);
                history.setActionDate(now);
                historyRepository.save(history);
            }
        }

        // 2️⃣ Admin Pending > 24 hours → auto reject
        List<TravelRequest> adminPendingRequests = requestRepository.findByStatusAndAssignedAdminId("PENDING_ADMIN_APPROVAL", null);
        for (TravelRequest req : adminPendingRequests) {
            if (req.getAssignedAdminId() == null) continue;

            long hoursPending = (now.getTime() - req.getUpdatedAt().getTime()) / (1000 * 60 * 60);
            if (hoursPending >= 24) {
                String reason = "Automatically rejected: Admin did not take action within 24 hours";

                req.setStatus("Rejected");
                req.setRejectedReason(reason);
                req.setRemarks(reason);
                req.setUpdatedAt(now);
                requestRepository.save(req);

                // Log in TravelHistory
                TravelHistory history = new TravelHistory();
                history.setTravelRequestId(req.getId());
                history.setEmployeeId(req.getEmployeeId());
                history.setActionBy("SYSTEM");
                history.setAction("Rejected");
                history.setRemarks(reason);
                history.setRejectedReason(reason);
                history.setActionDate(now);
                historyRepository.save(history);
            }
        }
    }
}
