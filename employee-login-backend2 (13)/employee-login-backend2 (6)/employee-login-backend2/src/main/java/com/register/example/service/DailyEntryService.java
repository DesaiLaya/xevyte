package com.register.example.service;

import com.register.example.entity.DailyEntry;
import com.register.example.entity.Employee;
import com.register.example.payload.DailyEntryDTO;
import com.register.example.payload.SubmittedDateDTO;
import com.register.example.repository.DailyEntryRepository;
import com.register.example.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyEntryService {

    private final DailyEntryRepository dailyEntryRepository;
    private final EmployeeRepository employeeRepository;

    public DailyEntryService(DailyEntryRepository dailyEntryRepository,
                             EmployeeRepository employeeRepository) {
        this.dailyEntryRepository = dailyEntryRepository;
        this.employeeRepository = employeeRepository;
    }

    public DailyEntry submitDailyEntry(String employeeId, DailyEntryDTO dto) {
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        // ❌ Block submission if frozen
        if (isDateFrozen(employeeId, dto.getDate())) {
            throw new IllegalStateException("Timesheet is frozen for date: " + dto.getDate());
        }

        if (dailyEntryRepository.findByEmployeeIdAndDate(employeeId, dto.getDate()).isPresent()) {
            throw new IllegalStateException("Timesheet already submitted for date: " + dto.getDate());
        }

        DailyEntry entry = new DailyEntry();
        entry.setEmployeeId(emp.getEmployeeId());
        entry.setManagerId(emp.getAssignedManagerId());
        entry.setHrId(emp.getAssignedHrId());
        entry.setDate(dto.getDate());
        entry.setClient(dto.getClient());
        entry.setProject(dto.getProject());
        entry.setLoginTime(dto.getLoginTime());
        entry.setLogoutTime(dto.getLogoutTime());
        entry.setTotalHours(dto.getTotalHours());
        entry.setRemarks(dto.getRemarks());
        entry.setFrozen(false);

        return dailyEntryRepository.save(entry);
    }

    public List<DailyEntry> getEntriesByEmployee(String employeeId) {
        return dailyEntryRepository.findByEmployeeId(employeeId);
    }

    public List<DailyEntry> getEntriesByManager(String managerId) {
        return dailyEntryRepository.findByManagerId(managerId);
    }

    public List<DailyEntry> getEntriesByHr(String hrId) {
        return dailyEntryRepository.findByHrId(hrId);
    }

    public List<DailyEntry> getEntriesByManagerAndEmployee(String managerId, String employeeId) {
        return dailyEntryRepository.findByManagerIdAndEmployeeId(managerId, employeeId);
    }

    public List<DailyEntry> getEntriesByHrAndEmployee(String hrId, String employeeId) {
        return dailyEntryRepository.findByHrIdAndEmployeeId(hrId, employeeId);
    }

    public List<SubmittedDateDTO> getSubmittedDatesByEmployee(String employeeId) {
        return dailyEntryRepository.findByEmployeeId(employeeId).stream()
                .map(entry -> new SubmittedDateDTO(entry.getDate(), entry.getTotalHours()))
                .collect(Collectors.toList());
    }

    public double getTotalHoursByEmployee(String employeeId) {
        Double totalHours = dailyEntryRepository.findTotalHoursByEmployeeId(employeeId);
        return totalHours != null ? totalHours : 0.0;
    }

    public List<LocalDate> getFrozenDates(String employeeId) {
        return dailyEntryRepository.findByEmployeeIdAndFrozenTrue(employeeId)
                .stream()
                .map(DailyEntry::getDate)
                .toList();
    }

    /**
     * ✅ Freeze only for the selected employeeId (not all under manager)
     */
    @Transactional
    public void freezeTimesheets(String managerId, String employeeId, LocalDate startDate, LocalDate endDate) {
        // Check if employee exists
        Employee emp = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new IllegalStateException("Employee not found: " + employeeId));

        // Ensure manager is authorized
        if (!emp.getAssignedManagerId().equals(managerId)) {
            throw new IllegalStateException("Manager is not authorized to freeze timesheets for employee: " + employeeId);
        }

        List<DailyEntry> toSave = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            Optional<DailyEntry> existing = dailyEntryRepository.findByEmployeeIdAndDate(employeeId, current);

            if (existing.isPresent()) {
                DailyEntry entry = existing.get();
                entry.setFrozen(true);
                toSave.add(entry);
            } else {
                DailyEntry frozenEntry = new DailyEntry();
                frozenEntry.setEmployeeId(employeeId);
                frozenEntry.setManagerId(managerId);
                frozenEntry.setHrId(emp.getAssignedHrId());
                frozenEntry.setDate(current);
                frozenEntry.setFrozen(true);
                frozenEntry.setTotalHours(0.0);
                frozenEntry.setClient(null);
                frozenEntry.setProject(null);
                frozenEntry.setRemarks(""); // or null

                toSave.add(frozenEntry);
            }

            current = current.plusDays(1);
        }

        dailyEntryRepository.saveAll(toSave);
    }

    public boolean isDateFrozen(String employeeId, LocalDate date) {
        return dailyEntryRepository.findByEmployeeIdAndDate(employeeId, date)
                .map(DailyEntry::isFrozen)
                .orElse(false);
    }
}
