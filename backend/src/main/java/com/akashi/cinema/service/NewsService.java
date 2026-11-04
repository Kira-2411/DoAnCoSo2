package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.NewsResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.entity.News;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.NewsRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsService {

    private static final int MAX_PAGE_SIZE = 50;

    private final NewsRepository newsRepository;

    public NewsService(NewsRepository newsRepository) {
        this.newsRepository = newsRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<NewsResponse> getNews(int page, int size) {
        if (page < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Số trang không được âm");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Kích thước trang phải từ 1 đến " + MAX_PAGE_SIZE);
        }

        Sort sort = Sort.by(
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("newsId")
        );
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<News> newsPage = newsRepository.findAll(pageable);

        return PageResponse.from(newsPage, NewsResponse::from);
    }

    @Transactional(readOnly = true)
    public NewsResponse getNewsById(Integer newsId) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy bài viết"));

        return NewsResponse.from(news);
    }
}

