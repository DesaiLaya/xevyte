package com.register.example.controller;

import com.register.example.entity.LeaveDraft;
import com.register.example.service.LeaveDraftService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/leaves/drafts")
@CrossOrigin(origins = "*") // allow frontend
public class LeaveDraftController {

    private final LeaveDraftService service;

    public LeaveDraftController(LeaveDraftService service) {
        this.service = service;
    }

    // ✅ Create new draft
    @PostMapping
    public ResponseEntity<LeaveDraft> createDraft(
            @RequestPart("dto") LeaveDraft draft,
            @RequestPart(value = "document", required = false) MultipartFile file
    ) throws IOException {
        if (file != null && !file.isEmpty()) {
            draft.setFileName(file.getOriginalFilename());
            draft.setDocument(file.getBytes());
        }
        LeaveDraft saved = service.saveDraft(draft);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // ✅ Update existing draft
    @PutMapping("/{id}")
    public ResponseEntity<LeaveDraft> updateDraft(
            @PathVariable Long id,
            @RequestPart("dto") LeaveDraft draft,
            @RequestPart(value = "document", required = false) MultipartFile file
    ) throws IOException {
        draft.setId(id);
        if (file != null && !file.isEmpty()) {
            draft.setFileName(file.getOriginalFilename());
            draft.setDocument(file.getBytes());
        }
        LeaveDraft updated = service.saveDraft(draft);
        return ResponseEntity.ok(updated);
    }

    // ✅ Get all drafts for an employee
    @GetMapping("/{employeeId}")
    public ResponseEntity<List<LeaveDraft>> getDrafts(@PathVariable String employeeId) {
        List<LeaveDraft> drafts = service.getDraftsByEmployee(employeeId);
        return ResponseEntity.ok(drafts);
    }

    // ✅ Get a single draft by id
    @GetMapping("/single/{id}")
    public ResponseEntity<LeaveDraft> getDraftById(@PathVariable Long id) {
        return service.getDraftById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Download draft file
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadDraftFile(@PathVariable Long id) {
        return service.getDraftById(id)
                .filter(draft -> draft.getDocument() != null)
                .map(draft -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentDispositionFormData("attachment", draft.getFileName());
                    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                    return new ResponseEntity<>(draft.getDocument(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Delete draft
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        service.deleteDraft(id);
        return ResponseEntity.noContent().build();
    }
}
