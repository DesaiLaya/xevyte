package com.register.example.service;

import com.register.example.entity.Holiday;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HolidayService {

    Holiday create(Holiday holiday);

    Holiday update(Long id, Holiday holiday);

    void delete(Long id);

    List<Holiday> getAll();

    Optional<Holiday> getById(Long id);

    Optional<Holiday> getByDate(LocalDate date);

    List<Holiday> getByMonth(int year, int month); // month: 1-12

    List<Holiday> getByYear(int year);
    
    List<Holiday> getHolidaysInDateRange(LocalDate startDate, LocalDate endDate);
}
