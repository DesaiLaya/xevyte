package com.register.example.controller;

import com.register.example.entity.TravelRequest;
import com.register.example.service.TravelRequestService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/travel")
public class TravelRequestController {

    private final TravelRequestService travelRequestService;

    public TravelRequestController(TravelRequestService travelRequestService) {
        this.travelRequestService = travelRequestService;
    }

    // ===== ADMIN PDF UPLOAD =====
    @PostMapping("/admin/upload-pdf/{requestId}")
    public ResponseEntity<String> uploadAdminPdf(
            @PathVariable Long requestId,
            @RequestParam("file") MultipartFile file) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
                return ResponseEntity.badRequest().body("Only PDF files are allowed");
            }
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("File size exceeds 5MB limit");
            }

            travelRequestService.uploadAdminPdf(requestId, file);
            return ResponseEntity.ok("PDF uploaded successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error uploading PDF: " + e.getMessage());
        }
    }

    // ===== DOWNLOAD PDF BY REQUEST ID =====
    @GetMapping("/download-pdf/{requestId}")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long requestId) {
        TravelRequest request = travelRequestService.getTravelRequestById(requestId);

        if (request.getPdfData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + request.getPdfFileName() + "\"")
                .contentType(MediaType.parseMediaType(request.getPdfContentType()))
                .body(request.getPdfData());
    }

    // ===== MARK AS DOWNLOADED =====
    @PutMapping("/mark-downloaded/{requestId}")
    public ResponseEntity<String> markAsDownloaded(@PathVariable Long requestId) {
        try {
            travelRequestService.markAsDownloaded(requestId);
            return ResponseEntity.ok("Travel request marked as downloaded.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error marking as downloaded: " + e.getMessage());
        }
    }

    // ===== DOWNLOAD RECEIPT PDF =====
    @GetMapping("/download-receipt/{requestId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long requestId) {
        TravelRequest request = travelRequestService.getTravelRequestById(requestId);

        if (request.getPdfData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + request.getPdfFileName() + "\"")
                .contentType(MediaType.parseMediaType(request.getPdfContentType()))
                .body(request.getPdfData());
    }

    // ===== CREATE TRAVEL REQUEST =====
    @PostMapping("/create")
    public ResponseEntity<TravelRequest> createRequest(@RequestBody TravelRequest request) {
        TravelRequest created = travelRequestService.createTravelRequest(request);
        return ResponseEntity.ok(created);
    }

    // ===== MANAGER ENDPOINTS =====
    @GetMapping("/manager/all/{managerId}")
    public ResponseEntity<List<TravelRequest>> getAllRequestsForManager(@PathVariable String managerId) {
        return ResponseEntity.ok(travelRequestService.getAllRequestsForManager(managerId));
    }

    @GetMapping("/manager/pending/{managerId}")
    public ResponseEntity<List<TravelRequest>> getPendingForManager(@PathVariable String managerId) {
        return ResponseEntity.ok(travelRequestService.getPendingRequestsForManager(managerId));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<TravelRequest> approveRequest(
            @PathVariable Long id,
            @RequestParam String managerId,
            @RequestParam(required = false, defaultValue = "") String remarks) {

        TravelRequest updated = travelRequestService.approveRequest(id, managerId, remarks);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<TravelRequest> rejectRequest(
            @PathVariable Long id,
            @RequestParam String managerId,
            @RequestParam(required = false, defaultValue = "") String rejectedReason) {

        if (rejectedReason == null || rejectedReason.trim().length() < 10) {
            return ResponseEntity.badRequest().body(null); // Can return a meaningful message
        }

        TravelRequest updated = travelRequestService.rejectRequest(id, managerId, rejectedReason.trim());
        return ResponseEntity.ok(updated);
    }

    // ===== ADMIN ENDPOINTS =====
    @GetMapping("/admin/assigned-requests/{adminId}")
    public ResponseEntity<List<TravelRequest>> getRequestsAssignedToAdmin(@PathVariable String adminId) {
        return ResponseEntity.ok(travelRequestService.getRequestsAssignedToAdmin(adminId));
    }

    // ===== HISTORY AND ACTIVE REQUESTS =====
    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<TravelRequest>> getAllTickets(@PathVariable String employeeId) {
        return ResponseEntity.ok(travelRequestService.getRequestsByEmployee(employeeId));
    }

    @GetMapping("/active/{employeeId}")
    public ResponseEntity<List<TravelRequest>> getActiveTickets(@PathVariable String employeeId) {
        return ResponseEntity.ok(travelRequestService.getActiveRequestsForEmployee(employeeId));
    }
}
