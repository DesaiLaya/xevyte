package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.TravelHistory;
import com.register.example.entity.TravelRequest;
import com.register.example.exception.ResourceNotFoundException;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.TravelHistoryRepository;
import com.register.example.repository.TravelRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Service
public class TravelRequestService {

    private final TravelRequestRepository requestRepository;
    private final TravelHistoryRepository historyRepository;
    private final EmployeeRepository employeeRepository;

    public TravelRequestService(TravelRequestRepository requestRepository,
                                TravelHistoryRepository historyRepository,
                                EmployeeRepository employeeRepository) {
        this.requestRepository = requestRepository;
        this.historyRepository = historyRepository;
        this.employeeRepository = employeeRepository;
    }

    // ================== CREATE REQUEST ==================
    @Transactional
    public TravelRequest createTravelRequest(TravelRequest request) {
        Employee employee = employeeRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));

        String managerId = employee.getAssignedManagerId();
        String adminId = employee.getAssignedAdminId();

        if (managerId == null || managerId.isBlank()) {
            throw new IllegalArgumentException("Employee has no assigned manager. Travel request cannot be created.");
        }
        if (adminId == null || adminId.isBlank()) {
            throw new IllegalArgumentException("Employee has no assigned admin. Travel request cannot be created.");
        }

        request.setAssignedManagerId(managerId);
        request.setAssignedAdminId(adminId);
        request.setStatus("Pending");

        TravelRequest saved = requestRepository.save(request);

        TravelHistory h = new TravelHistory();
        h.setTravelRequestId(saved.getId());
        h.setEmployeeId(saved.getEmployeeId());
        h.setActionBy(saved.getEmployeeId());
        h.setAction("Created");

        h.setRemarks(request.getRemarks() != null && !request.getRemarks().isBlank() ? request.getRemarks() : "N/A");

        historyRepository.save(h);

        return saved;
    }

    // ================== APPROVE REQUEST ==================
    @Transactional
    public TravelRequest approveRequest(Long requestId, String managerId, String remarks) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("PENDING_ADMIN_APPROVAL");
        // Preserve employee remarks; do not overwrite with manager remarks
        req.setUpdatedAt(new Date());

        Employee employee = employeeRepository.findByEmployeeId(req.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + req.getEmployeeId()));

        req.setAssignedAdminId(employee.getAssignedAdminId());
        requestRepository.save(req);

        TravelHistory h = new TravelHistory();
        h.setTravelRequestId(req.getId());
        h.setEmployeeId(req.getEmployeeId());
        h.setActionBy(managerId);
        h.setAction("Approved");

        // Always use employee-entered remarks for history
        h.setRemarks(req.getRemarks() != null && !req.getRemarks().isBlank() ? req.getRemarks() : "N/A");
        historyRepository.save(h);

        req.setEmployeeName(employee.getName());
        return req;
    }

    // ================== REJECT REQUEST ==================
    @Transactional
    public TravelRequest rejectRequest(Long requestId, String managerId, String rejectedReason) {
        TravelRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));

        req.setStatus("Rejected");
        req.setRejectedReason(rejectedReason);
        // Preserve employee remarks or set "N/A"
        req.setRemarks(req.getRemarks() != null && !req.getRemarks().isBlank() ? req.getRemarks() : "N/A");
        req.setUpdatedAt(new Date());
        requestRepository.save(req);

        TravelHistory h = new TravelHistory();
        h.setTravelRequestId(req.getId());
        h.setEmployeeId(req.getEmployeeId());
        h.setActionBy(managerId);
        h.setAction("Rejected");

        h.setRemarks(req.getRemarks()); // Only employee remarks
        h.setRejectedReason(rejectedReason);
        historyRepository.save(h);

        employeeRepository.findByEmployeeId(req.getEmployeeId())
                .ifPresent(emp -> req.setEmployeeName(emp.getName()));

        return req;
    }

    // ================== GET HISTORY ==================
    public List<TravelHistory> getHistoryForRequest(Long requestId) {
        TravelRequest r = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
        return historyRepository.findByTravelRequestIdOrderByActionDateAsc(requestId);
    }

    // ================== POPULATE EMPLOYEE NAMES ==================
    private void populateEmployeeNames(List<TravelRequest> requests) {
        for (TravelRequest req : requests) {
            employeeRepository.findByEmployeeId(req.getEmployeeId())
                    .ifPresent(emp -> req.setEmployeeName(emp.getName()));
        }
    }

    // ================== GET REQUESTS ==================
    public List<TravelRequest> getRequestsByEmployee(String employeeId) {
        List<TravelRequest> requests = requestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getActiveRequestsForEmployee(String employeeId) {
        List<String> activeStatuses = Arrays.asList("Pending", "Approved", "Confirmed", "PENDING_ADMIN_APPROVAL");
        List<TravelRequest> requests = requestRepository.findByEmployeeIdAndStatusInOrderByCreatedAtDesc(employeeId, activeStatuses);
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getPendingRequestsForManager(String managerId) {
        List<TravelRequest> requests = requestRepository.findByAssignedManagerIdAndStatus(managerId, "Pending");
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getAllRequestsForManager(String managerId) {
        List<TravelRequest> requests = requestRepository.findByAssignedManagerIdOrderByCreatedAtDesc(managerId);
        populateEmployeeNames(requests);
        return requests;
    }

    public List<TravelRequest> getRequestsAssignedToAdmin(String adminId) {
        List<TravelRequest> requests = requestRepository.findByStatusAndAssignedAdminId("PENDING_ADMIN_APPROVAL", adminId);
        populateEmployeeNames(requests);
        return requests;
    }

    // ================== UPLOAD RECEIPT ==================
    @Transactional
    public TravelRequest uploadReceipt(Long requestId, MultipartFile file) {
        TravelRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
        try {
            request.setPdfData(file.getBytes());
            request.setPdfFileName(file.getOriginalFilename());
            request.setPdfContentType(file.getContentType());
            request.setUpdatedAt(new Date());

            TravelRequest saved = requestRepository.save(request);

            TravelHistory history = new TravelHistory();
            history.setTravelRequestId(saved.getId());
            history.setEmployeeId(saved.getEmployeeId());
            history.setActionBy(saved.getEmployeeId());
            history.setAction("PDF Uploaded");
            history.setRemarks("Uploaded: " + file.getOriginalFilename());
            historyRepository.save(history);

            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload PDF", e);
        }
    }

    @Transactional
    public TravelRequest uploadAdminPdf(Long requestId, MultipartFile file) {
        TravelRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Cannot upload empty file");
            }
            if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
                throw new IllegalArgumentException("Only PDF files are allowed");
            }
            request.setPdfData(file.getBytes());
            request.setPdfFileName(file.getOriginalFilename());
            request.setPdfContentType(file.getContentType());

            if ("PENDING_ADMIN_APPROVAL".equalsIgnoreCase(request.getStatus())) {
                request.setStatus("Confirmed");
            }

            request.setUpdatedAt(new Date());

            TravelRequest saved = requestRepository.save(request);

            TravelHistory history = new TravelHistory();
            history.setTravelRequestId(saved.getId());
            history.setEmployeeId(saved.getEmployeeId());
            history.setActionBy(saved.getEmployeeId());
            history.setAction("PDF Uploaded by Admin");
            history.setRemarks("Uploaded file: " + file.getOriginalFilename());
            historyRepository.save(history);

            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload PDF", e);
        }
    }

    // ================== GET FILE DATA ==================
    public byte[] getReceiptFile(Long requestId) {
        TravelRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
        return request.getPdfData();
    }

    public String getReceiptFileName(Long requestId) {
        return requestRepository.findById(requestId)
                .map(TravelRequest::getPdfFileName)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
    }

    public String getReceiptContentType(Long requestId) {
        return requestRepository.findById(requestId)
                .map(TravelRequest::getPdfContentType)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
    }

    public TravelRequest getTravelRequestById(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Travel request not found with id: " + requestId));
    }

    @Transactional
    public void markAsDownloaded(Long requestId) {
        TravelRequest req = getTravelRequestById(requestId);
        req.setStatus("Downloaded");
        requestRepository.save(req);
    }
}
