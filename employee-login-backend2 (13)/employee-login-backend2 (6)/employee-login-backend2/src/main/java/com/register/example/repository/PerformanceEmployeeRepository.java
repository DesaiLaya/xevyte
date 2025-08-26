package com.register.example.repository;

import com.register.example.entity.PerformanceEmployee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceEmployeeRepository extends JpaRepository<PerformanceEmployee, String> {

    List<PerformanceEmployee> findByManagerId(String managerId);
}
