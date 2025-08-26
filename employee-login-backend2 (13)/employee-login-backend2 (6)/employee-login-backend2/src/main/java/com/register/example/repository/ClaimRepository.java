package com.register.example.repository;

import com.register.example.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    List<Claim> findByNextApprover(String nextApprover);

    List<Claim> findByEmployeeId(String employeeId);

    List<Claim> findByNextApproverAndStatusNot(String nextApprover, String status);

    List<Claim> findByStatusAndNextApprover(String status, String nextApprover);
    List<Claim> findByAssignedManagerIdAndStatusAndNextApprover(String managerId, String status, String nextApprover);// 🔴 Add this line
    List<Claim> findByNextApproverAndAssignedFinanceId(String nextApprover, String assignedFinanceId);
    List<Claim> findByAssignedHrIdAndNextApproverAndStatusNot(String hrId, String nextApprover, String status);
}