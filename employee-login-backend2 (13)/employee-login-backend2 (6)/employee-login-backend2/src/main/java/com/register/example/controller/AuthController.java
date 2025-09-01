package com.register.example.controller;
 
import com.register.example.entity.Employee;
import com.register.example.entity.PasswordResetToken;
import com.register.example.payload.LoginRequest;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
 
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
 
@RestController
@RequestMapping("/api/auth")
    .allowedOrigins("http://13.234.30.186")


public class AuthController {
 
    @Autowired
    private EmployeeRepository employeeRepository;
 
    @Autowired
    private PasswordResetTokenRepository tokenRepository;
 
    @Autowired
    private JavaMailSender mailSender;
 
    @Autowired
    private PasswordEncoder encoder;
 
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest request) {
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(request.getEmployeeId());
 
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Invalid username or password. Please try again."));
        }
 
        Employee employee = employeeOpt.get();
 
        if (employee.isAccountLocked()) {
            return ResponseEntity.status(HttpStatus.LOCKED).body(Map.of("message", "Your account has been locked due to multiple failed login attempts. Please reset your password or contact HR for assistance."));
        }
 
        if (encoder.matches(request.getPassword(), employee.getPassword())) {
            employee.setFailedAttempts(0);
            employee.setAccountLocked(false);
 
            employeeRepository.save(employee);
 
            // ✅ Return role in response
            return ResponseEntity.ok(Map.of(
                "message", "SUCCESS",
                "employeeId", employee.getEmployeeId(),
                "name", employee.getName(),
                "role", employee.getRole() // 👈 Include role here
            ));
        } else {
            employee.incrementFailedAttempts();
            if (employee.getFailedAttempts() >= 3) {
                employee.setAccountLocked(true);
            }
            employeeRepository.save(employee);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password. Please try again. Attempt " + employee.getFailedAttempts() + " of 3"));
        }
    }
    // ✅ FORGOT PASSWORD with HTML Email
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(employeeId);
 
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Invalid Employee ID. Please verify and try again."));
        }
 
        Employee employee = employeeOpt.get();
 
        // Clear old tokens
        tokenRepository.deleteByEmployeeId(employeeId);
 
        // Generate new token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(30);
        PasswordResetToken resetToken = new PasswordResetToken(token, employeeId, expiry);
        tokenRepository.save(resetToken);
 
      String resetLink = "http://13.234.30.186 /reset-password?token=" + token;

 
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
 
            helper.setTo(employee.getEmail());
            helper.setSubject("Password Reset Request for Your Xevyte Central Account");
 
            String content = ""
                + "<p>Dear Xevytian,</p>"
                + "<p>We received a request to reset the password for your account associated with this email address.</p>"
                + "<p>To proceed, please click the button below to reset your password:</p>"
                + "<p><a href=\"" + resetLink + "\" style=\"display:inline-block; padding:10px 16px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px;\">🔗 Reset Password</a></p>"
                + "<p>(This link will be valid for the next 30 minutes.)</p>"
                + "<p>If you did not request this change, you can safely ignore this email—your password will remain unchanged.</p>"
                + "<p>If you have any questions or need assistance, please contact our support team at <a href=\"mailto:info@xevyte.com\">info@xevyte.com</a>.</p>"
                + "<p>Thank you,<br>Xevyte Central Support Team</p>";
 
            helper.setText(content, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "We are unable to send the reset email. Please try again later or contact HR for assistance."));
        }
 
        return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email."));
    }
 
    // ✅ RESET PASSWORD Endpoint
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");
 
        String passwordPattern = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%?&]).{8,}$";
        if (!newPassword.matches(passwordPattern)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Your new password does not meet security requirements. Password must be at least 8 characters and include uppercase letters, numbers, and special characters."
            ));
        }
 
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty() || tokenOpt.get().getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", "The password reset link is invalid or has expired. Please request a new one."
            ));
        }
 
        PasswordResetToken resetToken = tokenOpt.get();
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(resetToken.getEmployeeId());
 
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Employee not found."));
        }
 
        Employee employee = employeeOpt.get();
 
        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "The passwords you entered do not match. Please re-enter them."));
        }
        if (encoder.matches(newPassword, employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Your new password cannot be the same as your previous password. Please choose a different one."));
        }
 
        employee.setPassword(encoder.encode(newPassword));
        employee.setAccountLocked(false);
        employee.setFailedAttempts(0);
        employeeRepository.save(employee);
 
        tokenRepository.deleteByToken(token);
 
        return ResponseEntity.ok(Map.of("message", "Password reset successful."));
    }
}
 
