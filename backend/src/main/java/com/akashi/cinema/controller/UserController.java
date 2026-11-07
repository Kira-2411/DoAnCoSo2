package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.UpdateProfileRequest;
import com.akashi.cinema.dto.response.BookingHistoryResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.dto.response.UserResponse;
import com.akashi.cinema.security.CustomUserDetails;
import com.akashi.cinema.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse response = userService.getProfile(userDetails.getUserId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(userDetails.getUserId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/bookings")
    public ResponseEntity<PageResponse<BookingHistoryResponse>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<BookingHistoryResponse> response = userService.getMyBookings(
                userDetails.getUserId(),
                status,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }
}

