package com.register.example.repository;

import com.register.example.entity.TravelHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TravelHistoryRepository extends JpaRepository<TravelHistory, Long> {
    List<TravelHistory> findByTravelRequestIdOrderByActionDateAsc(Long travelRequestId);
}
