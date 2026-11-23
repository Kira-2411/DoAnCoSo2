package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.CreateNewsRequest;
import com.akashi.cinema.dto.request.UpdateNewsRequest;
import com.akashi.cinema.dto.response.NewsResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.service.NewsService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<NewsResponse>> getNews(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        PageResponse<NewsResponse> response = newsService.getNews(keyword, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsResponse> getNewsById(@PathVariable("id") Integer id) {
        NewsResponse response = newsService.getNewsById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> createNews(@Valid @RequestBody CreateNewsRequest request) {
        NewsResponse response = newsService.createNews(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NewsResponse> updateNews(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateNewsRequest request
    ) {
        NewsResponse response = newsService.updateNews(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNews(@PathVariable("id") Integer id) {
        newsService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }
}
