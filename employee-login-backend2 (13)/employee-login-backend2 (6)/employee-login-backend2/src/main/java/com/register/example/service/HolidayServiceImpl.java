package com.register.example.service;

import com.register.example.entity.Holiday;
import com.register.example.repository.HolidayRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository repo;

    public HolidayServiceImpl(HolidayRepository repo) {
        this.repo = repo;
    }

    @Override
    public Holiday create(Holiday holiday) {
        // avoid duplicate same-date holiday
        if (repo.existsByHolidayDate(holiday.getHolidayDate())) {
            // update existing record if needed or throw
            Holiday existing = repo.findByHolidayDate(holiday.getHolidayDate()).get();
            existing.setName(holiday.getName());
            existing.setOptionalHoliday(holiday.isOptionalHoliday());
            return repo.save(existing);
        }
        return repo.save(holiday);
    }

    @Override
    public Holiday update(Long id, Holiday holiday) {
        Holiday existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Holiday not found: " + id));
        // If date changed, ensure uniqueness
        if (!existing.getHolidayDate().equals(holiday.getHolidayDate())
                && repo.existsByHolidayDate(holiday.getHolidayDate())) {
            throw new IllegalArgumentException("Holiday already exists for date: " + holiday.getHolidayDate());
        }
        existing.setHolidayDate(holiday.getHolidayDate());
        existing.setName(holiday.getName());
        existing.setOptionalHoliday(holiday.isOptionalHoliday());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Override
    public List<Holiday> getAll() {
        return repo.findAll();
    }

    @Override
    public Optional<Holiday> getById(Long id) {
        return repo.findById(id);
    }

    @Override
    public Optional<Holiday> getByDate(LocalDate date) {
        return repo.findByHolidayDate(date);
    }

    @Override
    public List<Holiday> getByMonth(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return repo.findByHolidayDateBetween(start, end);
    }

    @Override
    public List<Holiday> getByYear(int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        return repo.findByHolidayDateBetween(start, end);
    }

    // ⭐ CORRECTED: Implementation of the new method
    @Override
    public List<Holiday> getHolidaysInDateRange(LocalDate startDate, LocalDate endDate) {
        return repo.findByHolidayDateBetween(startDate, endDate);
    }
}