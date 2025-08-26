package com.register.example.repository;

import com.register.example.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    List<Holiday> findByHolidayDateBetween(LocalDate start, LocalDate end);

    Optional<Holiday> findByHolidayDate(LocalDate date);

    boolean existsByHolidayDate(LocalDate date);
}