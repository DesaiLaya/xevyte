package com.register.example.repository;

import com.register.example.entity.PerformanceGoal;
import com.register.example.payload.EmployeeGoalStatusDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PerformanceGoalRepository extends JpaRepository<PerformanceGoal, Long> {

    // Existing methods
    List<PerformanceGoal> findByEmployeeId(String employeeId);
    List<PerformanceGoal> findByAssignedBy(String assignedBy);
    List<PerformanceGoal> findByAssignedByAndStatus(String assignedBy, String status);
    List<PerformanceGoal> findByEmployeeIdInAndStatus(List<String> employeeIds, String status);

    // 🔹 New methods for scheduler
    List<PerformanceGoal> findByStatus(String status);
    List<PerformanceGoal> findByStatusIn(List<String> statuses);

    // ✅ Existing custom query
    @Query("SELECT new com.register.example.payload.EmployeeGoalStatusDTO(e.empId, e.name, g.goalTitle, g.status) " +
           "FROM PerformanceGoal g JOIN PerformanceEmployee e ON g.employeeId = e.empId " +
           "WHERE g.assignedBy = :managerId")
    List<EmployeeGoalStatusDTO> findEmployeeGoalsByManager(String managerId);
}
