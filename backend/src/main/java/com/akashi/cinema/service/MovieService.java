package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.MovieDetailResponse;
import com.akashi.cinema.dto.response.MovieResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.MovieStatus;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.MovieRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovieService {

    private static final int MAX_PAGE_SIZE = 100;

    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getMovies(String statusParam, String keywordParam, int page, int size) {
        if (page < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Số trang không được âm");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Kích thước trang phải từ 1 đến " + MAX_PAGE_SIZE);
        }

        MovieStatus status = parseMovieStatus(statusParam);
        String keyword = normalizeKeyword(keywordParam);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "movieId"));
        Page<Movie> moviePage = movieRepository.searchActiveMovies(status, keyword, pageable);

        return PageResponse.from(moviePage, MovieResponse::from);
    }

    @Transactional(readOnly = true)
    public MovieDetailResponse getMovieById(Integer movieId) {
        Movie movie = movieRepository.findByMovieIdAndIsActiveTrue(movieId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim"));

        return MovieDetailResponse.from(movie);
    }

    private MovieStatus parseMovieStatus(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        try {
            return MovieStatus.valueOf(statusParam.trim());
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Trạng thái phim không hợp lệ");
        }
    }

    private String normalizeKeyword(String keywordParam) {
        if (keywordParam == null) {
            return null;
        }
        String trimmed = keywordParam.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

