package com.akashi.cinema.service;

import com.akashi.cinema.config.TimeConfig;
import com.akashi.cinema.dto.request.CreateMovieRequest;
import com.akashi.cinema.dto.request.UpdateMovieRequest;
import com.akashi.cinema.dto.response.MovieDetailResponse;
import com.akashi.cinema.dto.response.MovieResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.MovieStatus;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.MovieRepository;
import com.akashi.cinema.security.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class MovieService {

    private static final Logger log = LoggerFactory.getLogger(MovieService.class);
    private static final int MAX_PAGE_SIZE = 100;

    private final MovieRepository movieRepository;
    private final ShowtimeService showtimeService;
    private final CloudinaryService cloudinaryService;

    public MovieService(MovieRepository movieRepository,
                        ShowtimeService showtimeService,
                        CloudinaryService cloudinaryService) {
        this.movieRepository = movieRepository;
        this.showtimeService = showtimeService;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional
    public PageResponse<MovieResponse> getMovies(String statusParam, String keywordParam, Boolean includeInactiveParam, String sortParam, int page, int size) {
        if (page < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Số trang không được âm");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Kích thước trang phải từ 1 đến " + MAX_PAGE_SIZE);
        }

        autoUpdateMovieStatuses();

        MovieStatus status = parseMovieStatus(statusParam);
        String keyword = normalizeKeyword(keywordParam);

        boolean isAdmin = isCurrentUserAdmin();
        boolean includeInactive = isAdmin && Boolean.TRUE.equals(includeInactiveParam);

        Pageable pageable;
        Page<Movie> moviePage;

        if ("newest".equalsIgnoreCase(sortParam) || "desc".equalsIgnoreCase(sortParam)) {
            // Sắp xếp ưu tiên trạng thái: SẮP CHIẾU (1) -> ĐANG CHIẾU (2) -> NGỪNG CHIẾU (3).
            // Trong mỗi trạng thái, sắp xếp từ ngày khởi chiếu mới nhất đến cũ nhất.
            pageable = PageRequest.of(page, size);
            moviePage = movieRepository.searchMoviesOrderByNewest(status, keyword, includeInactive, pageable);
        } else {
            Sort sort = Sort.by(Sort.Direction.ASC, "movieId");
            pageable = PageRequest.of(page, size, sort);
            moviePage = movieRepository.searchMovies(status, keyword, includeInactive, pageable);
        }

        return PageResponse.from(moviePage, MovieResponse::from);
    }

    @Transactional
    public MovieDetailResponse getMovieById(Integer movieId) {
        autoUpdateMovieStatuses();

        boolean isAdmin = isCurrentUserAdmin();
        Movie movie;
        if (isAdmin) {
            movie = movieRepository.findById(movieId)
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim"));
        } else {
            movie = movieRepository.findByMovieIdAndIsActiveTrue(movieId)
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim"));
        }

        return MovieDetailResponse.from(movie);
    }

    @Transactional
    public MovieResponse createMovie(CreateMovieRequest request) {
        validateMovieStatusAndDates(request.getReleaseDate(), request.getMovieStatus());

        String normalizedPosterUrl = cloudinaryService.validateAndNormalizePosterUrl(request.getPosterUrl());

        Movie movie = Movie.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .duration(request.getDuration())
                .genre(request.getGenre())
                .ageLimit(request.getAgeLimit())
                .releaseDate(request.getReleaseDate())
                .movieStatus(request.getMovieStatus())
                .posterUrl(normalizedPosterUrl)
                .isActive(true)
                .build();

        Movie saved = movieRepository.save(movie);
        log.info("Admin [{}] created movie [movieId={}, title='{}']", getCurrentUserId(), saved.getMovieId(), saved.getTitle());

        return MovieResponse.from(saved);
    }

    @Transactional
    public MovieResponse updateMovie(Integer movieId, UpdateMovieRequest request) {
        validateMovieStatusAndDates(request.getReleaseDate(), request.getMovieStatus());

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim"));

        // If requesting to deactivate an active movie, ensure no active unfinished showtimes exist
        if (request.getIsActive() != null && !request.getIsActive() && Boolean.TRUE.equals(movie.getIsActive())) {
            LocalDateTime now = LocalDateTime.now(TimeConfig.VIETNAM_ZONE);
            if (showtimeService.hasActiveUnfinishedShowtimes(movieId, now)) {
                throw new AppException(HttpStatus.CONFLICT, "MOVIE_HAS_UPCOMING_SHOWTIMES",
                        "Phim còn suất chiếu chưa kết thúc, cần hủy các suất đó trước");
            }
        }

        String normalizedPosterUrl = cloudinaryService.validateAndNormalizePosterUrl(request.getPosterUrl());

        List<String> changedFields = new ArrayList<>();
        if (!Objects.equals(movie.getTitle(), request.getTitle().trim())) changedFields.add("title");
        if (!Objects.equals(movie.getDescription(), request.getDescription())) changedFields.add("description");
        if (!Objects.equals(movie.getDuration(), request.getDuration())) changedFields.add("duration");
        if (!Objects.equals(movie.getGenre(), request.getGenre())) changedFields.add("genre");
        if (!Objects.equals(movie.getAgeLimit(), request.getAgeLimit())) changedFields.add("ageLimit");
        if (!Objects.equals(movie.getReleaseDate(), request.getReleaseDate())) changedFields.add("releaseDate");
        if (!Objects.equals(movie.getMovieStatus(), request.getMovieStatus())) changedFields.add("movieStatus");
        if (!Objects.equals(movie.getPosterUrl(), normalizedPosterUrl)) changedFields.add("posterUrl");
        if (request.getIsActive() != null && !Objects.equals(movie.getIsActive(), request.getIsActive())) changedFields.add("isActive");

        movie.setTitle(request.getTitle().trim());
        movie.setDescription(request.getDescription());
        movie.setDuration(request.getDuration());
        movie.setGenre(request.getGenre());
        movie.setAgeLimit(request.getAgeLimit());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setMovieStatus(request.getMovieStatus());
        movie.setPosterUrl(normalizedPosterUrl);
        if (request.getIsActive() != null) {
            movie.setIsActive(request.getIsActive());
        }

        Movie updated = movieRepository.save(movie);
        log.info("Admin [{}] updated movie [movieId={}]. Changed fields: {}", getCurrentUserId(), movieId, changedFields);
        if (changedFields.contains("isActive")) {
            log.info("Admin [{}] changed movie [movieId={}] isActive to {}", getCurrentUserId(), movieId, updated.getIsActive());
        }

        return MovieResponse.from(updated);
    }

    @Transactional
    public void deleteMovie(Integer movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phim"));

        if (Boolean.TRUE.equals(movie.getIsActive())) {
            LocalDateTime now = LocalDateTime.now(TimeConfig.VIETNAM_ZONE);
            if (showtimeService.hasActiveUnfinishedShowtimes(movieId, now)) {
                throw new AppException(HttpStatus.CONFLICT, "MOVIE_HAS_UPCOMING_SHOWTIMES",
                        "Phim còn suất chiếu chưa kết thúc, cần hủy các suất đó trước");
            }
            movie.setIsActive(false);
            movieRepository.save(movie);
            log.info("Admin [{}] deactivated (soft-deleted) movie [movieId={}]", getCurrentUserId(), movieId);
        } else {
            log.info("Admin [{}] invoked delete on already inactive movie [movieId={}] (no-op)", getCurrentUserId(), movieId);
        }
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }
        return null;
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

    @Transactional
    public void autoUpdateMovieStatuses() {
        LocalDate today = LocalDate.now(TimeConfig.VIETNAM_ZONE);
        LocalDate sevenDaysAgo = today.minusDays(7);
        LocalDateTime sevenDaysAgoDateTime = LocalDateTime.now(TimeConfig.VIETNAM_ZONE).minusDays(7);

        int promoted = movieRepository.autoPromoteComingSoonToNowShowing(today, sevenDaysAgo);
        int expired = movieRepository.autoExpireToEnded(sevenDaysAgo, sevenDaysAgoDateTime);
        if (promoted > 0 || expired > 0) {
            log.info("Auto updated movie statuses: promoted {} to NOW_SHOWING, expired {} to ENDED", promoted, expired);
        }
    }

    public void validateMovieStatusAndDates(LocalDate releaseDate, MovieStatus movieStatus) {
        if (releaseDate == null) {
            Map<String, String> details = Map.of("releaseDate", "Ngày khởi chiếu là bắt buộc");
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Ngày khởi chiếu là bắt buộc", details);
        }
        if (movieStatus == null) {
            Map<String, String> details = Map.of("movieStatus", "Trạng thái phim là bắt buộc");
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Trạng thái phim là bắt buộc", details);
        }
        LocalDate today = LocalDate.now(TimeConfig.VIETNAM_ZONE);
        LocalDate sevenDaysAgo = today.minusDays(7);

        // 1. Phim khởi chiếu trong tương lai (> today) bắt buộc phải là COMING_SOON
        if (releaseDate.isAfter(today)) {
            if (movieStatus != MovieStatus.COMING_SOON) {
                Map<String, String> details = Map.of("movieStatus", "Phim có ngày khởi chiếu từ ngày mai trở đi phải có trạng thái SẮP CHIẾU (COMING_SOON)");
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                        "Phim có ngày khởi chiếu trong tương lai phải có trạng thái SẮP CHIẾU", details);
            }
        }
        // 2. Phim đã quá 7 ngày kể từ ngày khởi chiếu (< today - 7) bắt buộc phải là ENDED
        else if (releaseDate.isBefore(sevenDaysAgo)) {
            if (movieStatus != MovieStatus.ENDED) {
                Map<String, String> details = Map.of("movieStatus", "Phim đã quá thời hạn chiếu 7 ngày phải có trạng thái NGỪNG CHIẾU (ENDED)");
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                        "Phim đã quá thời hạn chiếu 7 ngày phải có trạng thái NGỪNG CHIẾU", details);
            }
        }
        // 3. Phim trong khoảng từ ngày khởi chiếu đến 7 ngày (sevenDaysAgo <= releaseDate <= today) không được để COMING_SOON
        else {
            if (movieStatus == MovieStatus.COMING_SOON) {
                Map<String, String> details = Map.of("movieStatus", "Phim đã đến ngày khởi chiếu không thể để trạng thái SẮP CHIẾU (COMING_SOON)");
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                        "Phim đã đến ngày khởi chiếu không thể để trạng thái SẮP CHIẾU", details);
            }
        }
    }
}
