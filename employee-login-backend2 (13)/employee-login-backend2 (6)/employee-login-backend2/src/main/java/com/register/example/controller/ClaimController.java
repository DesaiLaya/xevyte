package com.register.example.controller;

import com.register.example.entity.Claim;
import com.register.example.service.ClaimService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/claims")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Submit a new claim with optional single receipt file upload.
     * Accepts 'claim' JSON part and optional 'receiptFile' part.
     */
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitClaim(
            @RequestPart("claim") String claimJson,
            @RequestPart(value = "receiptFile", required = false) MultipartFile receiptFile) {
        try {
            Claim claim = objectMapper.readValue(claimJson, Claim.class);
            Claim savedClaim = claimService.submitClaimWithReceipt(claim, receiptFile);
            return ResponseEntity.ok(savedClaim);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error submitting claim: " + e.getMessage());
        }
    }

    /**
     * Get pending claims for a specific manager.
     */
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Claim>> getClaimsForManager(@PathVariable String managerId) {
        List<Claim> claims = claimService.getClaimsForManager(managerId);
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Get pending claims for a specific finance team member.
     */
    @GetMapping("/finance/{financeId}")
    public ResponseEntity<List<Claim>> getClaimsForFinance(@PathVariable String financeId) {
        List<Claim> claims = claimService.getClaimsForFinance(financeId);
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Get claims for a specific HR team member.
     */
    @GetMapping("/hr/{hrId}")
    public ResponseEntity<List<Claim>> getClaimsByHrId(@PathVariable String hrId) {
        List<Claim> claims = claimService.getClaimsByHrId(hrId);
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Manager or Finance approves the claim.
     */
    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approveClaim(@PathVariable Long id, @RequestParam String role) {
        String result = claimService.approveClaim(id, role);
        return ResponseEntity.ok(result);
    }

    /**
     * Manager or Finance rejects the claim.
     */
    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectClaim(
            @PathVariable Long id,   
            @RequestParam String role,
            @RequestParam String reason) {
        String result = claimService.rejectClaim(id, role, reason);
        return ResponseEntity.ok(result);
    }

    /**
     * Get claim history for an employee.
     */
    @GetMapping("/history/{employeeId}")
    public ResponseEntity<List<Claim>> getHistory(@PathVariable String employeeId) {
        List<Claim> claims = claimService.getClaimHistoryByEmployee(employeeId);
        return ResponseEntity.ok(claims);
    }

    /**
     * HR updates final status of a claim.
     */
    @PutMapping("/hr/update-status/{id}")
    public ResponseEntity<String> updateHRStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        String result = claimService.updateHRStatus(id, status);
        return ResponseEntity.ok(result);
    }
   
    /**
     * Get a summary of claims for an employee.
     */
    @GetMapping("/summary/{employeeId}")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable String employeeId) {
        Map<String, Object> summary = claimService.getClaimSummaryByEmployeeId(employeeId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Endpoint to retrieve a receipt file and set the correct content type.
     */
    @GetMapping("/receipt/{id}")
    public ResponseEntity<byte[]> getReceipt(@PathVariable Long id) {
        Claim claim = claimService.findById(id);
        if (claim == null || claim.getReceipt() == null) {
            return ResponseEntity.notFound().build();
        }

        // Determine the content type based on the file extension
        String receiptName = claim.getReceiptName();
        String fileExtension = "";
        if (receiptName != null) {
            int dotIndex = receiptName.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = receiptName.substring(dotIndex + 1).toLowerCase();
            }
        }

        MediaType contentType;
        switch (fileExtension) {
            case "jpg":
            case "jpeg":
                contentType = MediaType.IMAGE_JPEG;
                break;
            case "png":
                contentType = MediaType.IMAGE_PNG;
                break;
            case "pdf":
                contentType = MediaType.APPLICATION_PDF;
                break;
            default:
                contentType = MediaType.APPLICATION_OCTET_STREAM; // Fallback
                break;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(contentType);
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + receiptName + "\"");

        return new ResponseEntity<>(claim.getReceipt(), headers, HttpStatus.OK);
    }
}