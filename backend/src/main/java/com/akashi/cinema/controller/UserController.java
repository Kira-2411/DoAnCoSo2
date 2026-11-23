package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.UpdateProfileRequest;
import com.akashi.cinema.dto.request.UpdateRoleRequest;
import com.akashi.cinema.dto.request.UpdateUserStatusRequest;
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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        PageResponse<UserResponse> response = userService.getUsers(role, keyword, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable("id") Integer id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserResponse response = userService.updateUserRole(id, request.getRole(), userDetails.getUserId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserResponse response = userService.updateUserStatus(id, request.getIsActive(), userDetails.getUserId());
        return ResponseEntity.ok(response);
    }
}
