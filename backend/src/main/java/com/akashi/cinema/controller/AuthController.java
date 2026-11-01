package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.LoginRequest;
import com.akashi.cinema.dto.request.RegisterRequest;
import com.akashi.cinema.dto.request.ResendOtpRequest;
import com.akashi.cinema.dto.request.VerifyEmailRequest;
import com.akashi.cinema.dto.response.LoginResponse;
import com.akashi.cinema.dto.response.MessageResponse;
import com.akashi.cinema.dto.response.UserResponse;
import com.akashi.cinema.security.CustomUserDetails;
import com.akashi.cinema.service.AuthService;
import com.akashi.cinema.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RegistrationService registrationService;

    public AuthController(AuthService authService, RegistrationService registrationService) {
        this.authService = authService;
        this.registrationService = registrationService;
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

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        MessageResponse response = registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        MessageResponse response = registrationService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<MessageResponse> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        MessageResponse response = registrationService.resendOtp(request);
        return ResponseEntity.ok(response);
    }
}
