package com.register.example.repository;

import com.register.example.entity.ClaimHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimHistoryRepository extends JpaRepository<ClaimHistory, Long> {
}
