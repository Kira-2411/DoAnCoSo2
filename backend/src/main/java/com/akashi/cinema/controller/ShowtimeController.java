package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.CreateShowtimeRequest;
import com.akashi.cinema.dto.request.UpdateShowtimeRequest;
import com.akashi.cinema.dto.response.ShowtimeResponse;
import com.akashi.cinema.service.ShowtimeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    public ShowtimeController(ShowtimeService showtimeService) {
        this.showtimeService = showtimeService;
    }

    @GetMapping
    public ResponseEntity<List<ShowtimeResponse>> getShowtimes(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "movieId", required = false) Integer movieId,
            @RequestParam(name = "roomId", required = false) Integer roomId,
            @RequestParam(name = "keyword", required = false) String keyword
    ) {
        if (isCurrentUserAdmin()) {
            List<ShowtimeResponse> response = showtimeService.getAdminShowtimes(date, movieId, roomId, keyword);
            return ResponseEntity.ok(response);
        } else {
            List<ShowtimeResponse> response = showtimeService.getShowtimes(date, movieId, roomId);
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeResponse> getShowtimeById(@PathVariable("id") Integer id) {
        ShowtimeResponse response = showtimeService.getShowtimeById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowtimeResponse> createShowtime(@Valid @RequestBody CreateShowtimeRequest request) {
        ShowtimeResponse response = showtimeService.createShowtime(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowtimeResponse> updateShowtime(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateShowtimeRequest request
    ) {
        ShowtimeResponse response = showtimeService.updateShowtime(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cancelShowtime(@PathVariable("id") Integer id) {
        showtimeService.cancelShowtime(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
