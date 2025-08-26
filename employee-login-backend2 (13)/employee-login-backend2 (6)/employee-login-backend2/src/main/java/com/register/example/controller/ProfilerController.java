package com.register.example.controller;

import com.register.example.entity.Employee;
import com.register.example.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")  // 👈 CORS for React frontend
@RestController
@RequestMapping("/profile")
public class ProfilerController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @PutMapping("/update/{employeeId}")
    public ResponseEntity<?> updateProfile(
            @PathVariable String employeeId,
            @RequestParam("name") String name,
            @RequestParam(value = "profilePic", required = false) MultipartFile profilePic) {

        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);

        if (employee == null) {
            return ResponseEntity.badRequest().body("Employee not found");
        }

        // Update name
        employee.setName(name);

        // Convert and save Base64 image if present
        if (profilePic != null && !profilePic.isEmpty()) {
            try {
                byte[] imageBytes = profilePic.getBytes();
                String base64Image = "data:" + profilePic.getContentType() + ";base64," +
                        Base64.getEncoder().encodeToString(imageBytes);
                employee.setProfilePic(base64Image);
            } catch (IOException e) {
                return ResponseEntity.status(500).body("Error processing profile picture");
            }
        }

        // Save updated employee
        employeeRepository.save(employee);

        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("name", employee.getName());
        response.put("profilePic", employee.getProfilePic());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<?> getProfile(@PathVariable String employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId).orElse(null);

        if (employee == null) {
            return ResponseEntity.badRequest().body("Employee not found");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("name", employee.getName());
        response.put("profilePic", employee.getProfilePic());

        return ResponseEntity.ok(response);
    }
}
