package com.register.example.repository;

import com.register.example.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    // ===== Employee =====
    List<LeaveRequest> findByEmployeeId(String employeeId);

    // ===== Manager =====
    // All leaves assigned to a manager
    List<LeaveRequest> findByAssignedManagerId(String managerId);

    // Only leaves pending manager approval
    List<LeaveRequest> findByAssignedManagerIdAndStatus(String managerId, String status);
    List<LeaveRequest> findByAssignedManagerIdAndStatusIn(String managerId, List<String> statuses);

    // ===== HR =====
    // All leaves assigned to a HR
    List<LeaveRequest> findByAssignedHrId(String hrId);

    // Only leaves approved by manager for HR visibility
    List<LeaveRequest> findByAssignedHrIdAndStatus(String hrId, String status);

    // ===== Optional: File-related queries =====

    // Find leaves which have a file attached
    List<LeaveRequest> findByAttachmentIsNotNull();

    // Find leaves without any file attached
    List<LeaveRequest> findByAttachmentIsNull();

    // Find leaves with filename containing given text (case-insensitive)
    List<LeaveRequest> findByFileNameContainingIgnoreCase(String fileName);

    // Find leaves with exact filename
    List<LeaveRequest> findByFileName(String fileName);
    
    List<LeaveRequest> findByEmployeeIdAndStatus(String employeeId, String status);

}
