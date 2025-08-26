package com.register.example.repository;

import com.register.example.entity.TravelRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TravelRequestRepository extends JpaRepository<TravelRequest, Long> {

    // Find all travel requests for a given employee, ordered by createdAt descending
    List<TravelRequest> findByEmployeeIdOrderByCreatedAtDesc(String employeeId);

    // Find travel requests assigned to a specific manager and with specific status
    List<TravelRequest> findByAssignedManagerIdAndStatus(String assignedManagerId, String status);

    // Find travel requests by employeeId and a list of statuses, ordered by createdAt descending
    List<TravelRequest> findByEmployeeIdAndStatusInOrderByCreatedAtDesc(String employeeId, List<String> statuses);

    // Find all travel requests assigned to a manager regardless of status
    List<TravelRequest> findByAssignedManagerIdOrderByCreatedAtDesc(String assignedManagerId);

    // Find travel requests by status and assigned admin
    List<TravelRequest> findByStatusAndAssignedAdminId(String status, String assignedAdminId);

    // Find all travel requests assigned to a specific admin
    List<TravelRequest> findByAssignedAdminId(String assignedAdminId);

    // Find travel requests for employee with specific status
    List<TravelRequest> findByEmployeeIdAndStatus(String employeeId, String status);
}
