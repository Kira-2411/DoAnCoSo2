package com.akashi.cinema.controller;

import com.akashi.cinema.dto.response.NewsResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.service.NewsService;
import org.springframework.http.ResponseEntity;
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
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        PageResponse<NewsResponse> response = newsService.getNews(page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsResponse> getNewsById(@PathVariable("id") Integer id) {
        NewsResponse response = newsService.getNewsById(id);
        return ResponseEntity.ok(response);
    }
}

