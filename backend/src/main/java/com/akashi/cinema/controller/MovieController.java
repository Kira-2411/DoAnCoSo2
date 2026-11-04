package com.akashi.cinema.controller;

import com.akashi.cinema.dto.response.MovieDetailResponse;
import com.akashi.cinema.dto.response.MovieResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.service.MovieService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<MovieResponse>> getMovies(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        PageResponse<MovieResponse> response = movieService.getMovies(status, keyword, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDetailResponse> getMovieById(@PathVariable("id") Integer id) {
        MovieDetailResponse response = movieService.getMovieById(id);
        return ResponseEntity.ok(response);
    }
}

