package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.CreateNewsRequest;
import com.akashi.cinema.dto.request.UpdateNewsRequest;
import com.akashi.cinema.dto.response.NewsResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.entity.News;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.NewsRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsService {

    private static final int MAX_PAGE_SIZE = 50;

    private final NewsRepository newsRepository;
    private final CloudinaryService cloudinaryService;

    public NewsService(NewsRepository newsRepository, CloudinaryService cloudinaryService) {
        this.newsRepository = newsRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional(readOnly = true)
    public PageResponse<NewsResponse> getNews(String keywordParam, int page, int size) {
        if (page < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Số trang không được âm");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Kích thước trang phải từ 1 đến " + MAX_PAGE_SIZE);
        }

        String keyword = (keywordParam != null && !keywordParam.isBlank()) ? keywordParam.trim() : null;
        Pageable pageable = PageRequest.of(page, size);
        Page<News> newsPage = newsRepository.searchNews(keyword, pageable);

        return PageResponse.from(newsPage, NewsResponse::from);
    }

    @Transactional(readOnly = true)
    public NewsResponse getNewsById(Integer newsId) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy bài viết"));

        return NewsResponse.from(news);
    }

    @Transactional
    public NewsResponse createNews(CreateNewsRequest request) {
        String normalizedImg = cloudinaryService.validateAndNormalizeNewsImageUrl(request.getImageUrl());

        News news = News.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .imageUrl(normalizedImg)
                .build();

        News saved = newsRepository.save(news);
        return NewsResponse.from(saved);
    }

    @Transactional
    public NewsResponse updateNews(Integer newsId, UpdateNewsRequest request) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy bài viết"));

        String normalizedImg = cloudinaryService.validateAndNormalizeNewsImageUrl(request.getImageUrl());

        news.setTitle(request.getTitle().trim());
        news.setContent(request.getContent().trim());
        news.setImageUrl(normalizedImg);

        News saved = newsRepository.save(news);
        return NewsResponse.from(saved);
    }

    @Transactional
    public void deleteNews(Integer newsId) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy bài viết"));

        newsRepository.delete(news);
    }
}
