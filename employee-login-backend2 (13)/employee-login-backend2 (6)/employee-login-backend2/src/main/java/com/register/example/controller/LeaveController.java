package com.register.example.controller;

import com.register.example.entity.Holiday;
import com.register.example.entity.LeaveHistory;
import com.register.example.entity.LeaveRequest;
import com.register.example.service.LeaveAssignmentService;
import com.register.example.service.LeaveService;
import com.register.example.service.HolidayService;
import com.register.example.payload.LeaveActionDTO;
import com.register.example.payload.LeaveRequestDTO;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/leaves")
@CrossOrigin(origins = "http://localhost:3000") // Allow React app calls
public class LeaveController {

    private final LeaveService leaveService;
    private final LeaveAssignmentService leaveAssignmentService;
    private final HolidayService holidayService;

    public LeaveController(LeaveService leaveService,
                           LeaveAssignmentService leaveAssignmentService,
                           HolidayService holidayService) {
        this.leaveService = leaveService;
        this.leaveAssignmentService = leaveAssignmentService;
        this.holidayService = holidayService;
    }

    // ===== Apply for leave (CL, SL) with optional document =====
    @PostMapping(value = "/apply", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public LeaveRequest applyLeave(
            @RequestPart("dto") LeaveRequestDTO dto,
            @RequestPart(value = "document", required = false) MultipartFile document
    ) throws Exception {
        return leaveService.applyLeave(dto, document);
    }

    // ===== Approve/Reject leave request by Manager/HR =====
    @PostMapping("/action")
    public LeaveRequest takeAction(@RequestBody LeaveActionDTO dto) {
        return leaveService.takeAction(dto);
    }

    // ===== Get all leave requests of an employee =====
    @GetMapping("/employee/{employeeId}")
    public List<LeaveRequest> getEmployeeLeaves(@PathVariable String employeeId) {
        return leaveService.getEmployeeLeaves(employeeId);
    }

    // ===== Get leave approval history for employee =====
    @GetMapping("/employee/{employeeId}/history")
    public List<LeaveHistory> getLeaveHistory(@PathVariable String employeeId) {
        return leaveService.getHistory(employeeId);
    }

    // ===== Get all pending leave requests for a manager =====
    @GetMapping("/manager/{managerId}")
    public List<LeaveRequest> getManagerLeaves(@PathVariable String managerId) {
        return leaveService.getManagerLeaves(managerId);
    }

    // ===== Get all pending leave requests for HR (after manager approval) =====
    @GetMapping("/hr/{hrId}")
    public List<LeaveRequest> getHrLeaves(@PathVariable String hrId) {
        return leaveService.getHrLeaves(hrId);
    }

    // ===== Download uploaded leave document by leave ID =====
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadLeaveDocument(@PathVariable Long id) throws IOException {
        Resource file = leaveService.getLeaveDocument(id);

        if (file == null || !file.exists()) {
            return ResponseEntity.notFound().build();
        }

        String filename = file.getFilename();
        if (filename == null || filename.trim().isEmpty()) {
            filename = "leave_document_" + id;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(file);
    }

    // ===== Assign leaves to an employee based on joining date (prorated for the first year) =====
    @PostMapping("/assign/{employeeId}")
    public ResponseEntity<String> assignLeaves(@PathVariable String employeeId) {
        try {
            int assignedLeaves = leaveAssignmentService.assignLeavesByMonth(employeeId);
            return ResponseEntity.ok(
                    "Assigned " + assignedLeaves + " CL and "
                            + assignedLeaves + " SL leaves for employee " + employeeId
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body("Leaves already assigned for this employee.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error assigning leaves: " + e.getMessage());
        }
    }

    // ===== Get a specific employee's leave balance =====
    @GetMapping("/balance/{employeeId}")
    public Map<String, Integer> getLeaveBalance(@PathVariable String employeeId) {
        return leaveAssignmentService.getLeaveBalance(employeeId);
    }

  
    
    
 // ===== Cancel a leave request =====
    @PutMapping("/cancel/{id}")
    @Transactional
    public ResponseEntity<Void> cancelLeave(@PathVariable Long id) {
        try {
            leaveService.cancelLeave(id);
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (Exception e) {
            System.err.println("Error cancelling leave with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }


    // ===== Get all approved leave dates for an employee =====
    @GetMapping("/approved-dates/{employeeId}")
    public List<LocalDate> getApprovedLeaveDates(@PathVariable String employeeId) {
        return leaveService.getApprovedLeaveDates(employeeId);
    }
    
    // ===================== HOLIDAY APIs =====================

    // Get all holidays
    @GetMapping("/holidays")
    public List<Holiday> getAllHolidays() {
        return holidayService.getAll();
    }

    // Add a holiday
    @PostMapping("/holidays")
    public Holiday addHoliday(@RequestBody Holiday holiday) {
        return holidayService.create(holiday);
    }

    // Update a holiday
    @PutMapping("/holidays/{id}")
    public Holiday updateHoliday(@PathVariable Long id, @RequestBody Holiday holiday) {
        return holidayService.update(id, holiday);
    }

    // Delete a holiday
    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Long id) {
        holidayService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Get holiday by ID
    @GetMapping("/holidays/{id}")
    public ResponseEntity<Holiday> getHolidayById(@PathVariable Long id) {
        return holidayService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get holiday by date (yyyy-MM-dd)
    @GetMapping("/holidays/date/{date}")
    public ResponseEntity<Holiday> getHolidayByDate(@PathVariable String date) {
        return holidayService.getByDate(LocalDate.parse(date))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get holidays by month
    @GetMapping("/holidays/{year}/{month}")
    public List<Holiday> getHolidaysByMonth(@PathVariable int year, @PathVariable int month) {
        return holidayService.getByMonth(year, month);
    }

    // Get holidays by year
    @GetMapping("/holidays/year/{year}")
    public List<Holiday> getHolidaysByYear(@PathVariable int year) {
        return holidayService.getByYear(year);
    }

    // 🗓️ NEW API: Get a list of all non-working days for a given date range
    @GetMapping("/non-working-days")
    public ResponseEntity<Set<LocalDate>> getNonWorkingDays(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            List<Holiday> holidays = holidayService.getHolidaysInDateRange(start, end);
            Set<LocalDate> holidayDates = holidays.stream()
                    .map(Holiday::getHolidayDate)
                    .collect(Collectors.toSet());

            Set<LocalDate> nonWorkingDays = IntStream.range(0, (int) (end.toEpochDay() - start.toEpochDay()) + 1)
                    .mapToObj(i -> start.plusDays(i))
                    .filter(date -> date.getDayOfWeek() == DayOfWeek.SATURDAY ||
                            date.getDayOfWeek() == DayOfWeek.SUNDAY ||
                            holidayDates.contains(date))
                    .collect(Collectors.toSet());

            return ResponseEntity.ok(nonWorkingDays);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}