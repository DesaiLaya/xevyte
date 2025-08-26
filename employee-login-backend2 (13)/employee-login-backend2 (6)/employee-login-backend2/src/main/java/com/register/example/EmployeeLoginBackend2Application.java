package com.register.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // ✅ Add this line to enable scheduled tasks
public class EmployeeLoginBackend2Application {

    public static void main(String[] args) {
        SpringApplication.run(EmployeeLoginBackend2Application.class, args);
    }
}
