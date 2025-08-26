package com.register.example.controller;

import com.register.example.entity.DailyEntry;
import com.register.example.payload.DailyEntryDTO;
import com.register.example.payload.FreezeRequest;
import com.register.example.payload.SubmittedDateDTO;
import com.register.example.service.DailyEntryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/daily-entry")
@CrossOrigin(origins = "*")
public class DailyEntryController {

    private final DailyEntryService dailyEntryService;

    public DailyEntryController(DailyEntryService dailyEntryService) {
        this.dailyEntryService = dailyEntryService;
    }

    @PostMapping("/submit/{employeeId}")
    public ResponseEntity<?> submitEntry(@PathVariable String employeeId,
                                         @RequestBody DailyEntryDTO dto) {
        try {
            DailyEntry entry = dailyEntryService.submitDailyEntry(employeeId, dto);
            return ResponseEntity.ok(entry);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeEntries(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByEmployee(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<?> getManagerEntries(@PathVariable String managerId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByManager(managerId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}")
    public ResponseEntity<?> getHrEntries(@PathVariable String hrId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByHr(hrId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeEntriesForManager(@PathVariable String managerId,
                                                          @PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByManagerAndEmployee(managerId, employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/hr/{hrId}/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeEntriesForHr(@PathVariable String hrId,
                                                     @PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getEntriesByHrAndEmployee(hrId, employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/submitted-dates/{employeeId}")
    public ResponseEntity<?> getSubmittedDatesByEmployee(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getSubmittedDatesByEmployee(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/total-hours/{employeeId}")
    public ResponseEntity<?> getTotalHoursByEmployee(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getTotalHoursByEmployee(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/frozen-dates/{employeeId}")
    public ResponseEntity<?> getFrozenDates(@PathVariable String employeeId) {
        try {
            return ResponseEntity.ok(dailyEntryService.getFrozenDates(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/freeze")
    public ResponseEntity<?> freezeTimesheets(@RequestBody FreezeRequest request) {
        try {
            dailyEntryService.freezeTimesheets(
                    request.getManagerId(),
                    request.getEmployeeId(),   // ✅ pass employeeId
                    request.getStartDate(),
                    request.getEndDate()
            );
            return ResponseEntity.ok("Timesheets frozen successfully for employee: " + request.getEmployeeId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

}
