package com.akashi.cinema.controller;

import com.akashi.cinema.dto.response.ShowtimeResponse;
import com.akashi.cinema.service.ShowtimeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
            @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "movieId", required = false) Integer movieId,
            @RequestParam(name = "roomId", required = false) Integer roomId
    ) {
        List<ShowtimeResponse> response = showtimeService.getShowtimes(date, movieId, roomId);
        return ResponseEntity.ok(response);
    }
}

