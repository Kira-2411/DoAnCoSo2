package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.LoginRequest;
import com.akashi.cinema.dto.response.LoginResponse;
import com.akashi.cinema.dto.response.UserResponse;
import com.akashi.cinema.security.CustomUserDetails;
import com.akashi.cinema.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse response = authService.getCurrentUser(userDetails.getUserId());
        return ResponseEntity.ok(response);
    }
}
