package com.register.example.controller;

import com.register.example.entity.Notification;
import com.register.example.service.ClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private ClaimService claimService;

    @GetMapping("/{employeeId}")
    public List<Notification> getNotifications(@PathVariable String employeeId) {
        return claimService.getNotifications(employeeId);
    }

    @PostMapping("/read/{id}")
    public String markAsRead(@PathVariable Long id) {
        return claimService.markNotificationAsRead(id);
    }
}
