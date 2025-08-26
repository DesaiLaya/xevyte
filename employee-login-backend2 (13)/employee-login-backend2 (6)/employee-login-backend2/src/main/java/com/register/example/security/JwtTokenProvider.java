package com.register.example.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtTokenProvider {

    private final String JWT_SECRET = "your-secret-key"; // Replace with env variable in production
    private final long JWT_EXPIRATION = 86400000; // 1 day

    public String generateToken(String employeeId) {
        return Jwts.builder()
                .setSubject(employeeId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION))
                .signWith(SignatureAlgorithm.HS512, JWT_SECRET)
                .compact();
    }
}
