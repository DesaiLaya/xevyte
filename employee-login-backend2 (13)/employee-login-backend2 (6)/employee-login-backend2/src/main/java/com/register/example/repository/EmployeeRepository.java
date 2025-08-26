package com.register.example.repository;

import com.register.example.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmployeeId(String employeeId);

    List<Employee> findByAssignedManagerId(String managerId);

//    // Find employees by assigned reviewer’s ID (Long)

    List<Employee> findByReviewerId(String reviewerId);
    
    List<Employee> findByAssignedHrId(String hrId);
//
//
//    // Alternative: find employees by assigned reviewer’s employeeId (String)
//    List<Employee> findByAssignedReviewer_EmployeeId(String reviewerEmployeeId);
    


}
