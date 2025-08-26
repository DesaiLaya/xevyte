package com.register.example.repository;

import com.register.example.entity.LeaveHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface LeaveHistoryRepository extends JpaRepository<LeaveHistory, Long> {

    // Find history by leaveRequestId (matches entity field)
    List<LeaveHistory> findByLeaveRequestId(Long leaveRequestId);

    // Find history by employeeId
    List<LeaveHistory> findByEmployeeId(String employeeId);

    // Deletes all LeaveHistory records associated with a specific LeaveRequest ID
    @Transactional
    void deleteByLeaveRequestId(Long leaveRequestId);
}
