package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.AgeLimit;
import com.akashi.cinema.enums.MovieStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MovieDetailResponse {

    private Integer movieId;
    private String title;
    private String description;
    private String genre;
    private Integer duration;
    private AgeLimit ageLimit;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate releaseDate;

    private MovieStatus movieStatus;
    private String posterUrl;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    public MovieDetailResponse() {
    }

    public MovieDetailResponse(Integer movieId, String title, String description, String genre, Integer duration,
                               AgeLimit ageLimit, LocalDate releaseDate, MovieStatus movieStatus, String posterUrl,
                               LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.movieId = movieId;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.duration = duration;
        this.ageLimit = ageLimit;
        this.releaseDate = releaseDate;
        this.movieStatus = movieStatus;
        this.posterUrl = posterUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static MovieDetailResponse from(Movie movie) {
        if (movie == null) {
            return null;
        }
        return MovieDetailResponse.builder()
                .movieId(movie.getMovieId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .genre(movie.getGenre())
                .duration(movie.getDuration())
                .ageLimit(movie.getAgeLimit())
                .releaseDate(movie.getReleaseDate())
                .movieStatus(movie.getMovieStatus())
                .posterUrl(movie.getPosterUrl())
                .createdAt(movie.getCreatedAt())
                .updatedAt(movie.getUpdatedAt())
                .build();
    }

    public Integer getMovieId() {
        return movieId;
    }

    public void setMovieId(Integer movieId) {
        this.movieId = movieId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public AgeLimit getAgeLimit() {
        return ageLimit;
    }

    public void setAgeLimit(AgeLimit ageLimit) {
        this.ageLimit = ageLimit;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDate releaseDate) {
        this.releaseDate = releaseDate;
    }

    public MovieStatus getMovieStatus() {
        return movieStatus;
    }

    public void setMovieStatus(MovieStatus movieStatus) {
        this.movieStatus = movieStatus;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public void setPosterUrl(String posterUrl) {
        this.posterUrl = posterUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class Builder {
        private Integer movieId;
        private String title;
        private String description;
        private String genre;
        private Integer duration;
        private AgeLimit ageLimit;
        private LocalDate releaseDate;
        private MovieStatus movieStatus;
        private String posterUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder movieId(Integer movieId) {
            this.movieId = movieId;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder genre(String genre) {
            this.genre = genre;
            return this;
        }

        public Builder duration(Integer duration) {
            this.duration = duration;
            return this;
        }

        public Builder ageLimit(AgeLimit ageLimit) {
            this.ageLimit = ageLimit;
            return this;
        }

        public Builder releaseDate(LocalDate releaseDate) {
            this.releaseDate = releaseDate;
            return this;
        }

        public Builder movieStatus(MovieStatus movieStatus) {
            this.movieStatus = movieStatus;
            return this;
        }

        public Builder posterUrl(String posterUrl) {
            this.posterUrl = posterUrl;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public MovieDetailResponse build() {
            return new MovieDetailResponse(movieId, title, description, genre, duration, ageLimit,
                    releaseDate, movieStatus, posterUrl, createdAt, updatedAt);
        }
    }
}

