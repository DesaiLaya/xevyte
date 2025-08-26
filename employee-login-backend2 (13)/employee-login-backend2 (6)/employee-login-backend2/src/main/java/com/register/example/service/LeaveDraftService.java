package com.register.example.service;

import com.register.example.entity.LeaveDraft;
import com.register.example.repository.LeaveDraftRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LeaveDraftService {

    private final LeaveDraftRepository repo;

    public LeaveDraftService(LeaveDraftRepository repo) {
        this.repo = repo;
    }

    public LeaveDraft saveDraft(LeaveDraft draft) {
        return repo.save(draft);
    }

    public List<LeaveDraft> getDraftsByEmployee(String employeeId) {
        return repo.findByEmployeeId(employeeId);
    }

    public Optional<LeaveDraft> getDraftById(Long id) {
        return repo.findById(id);
    }

    public void deleteDraft(Long id) {
        repo.deleteById(id);
    }
}
