package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.AgeLimit;
import com.akashi.cinema.enums.MovieStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public class MovieResponse {

    private Integer movieId;
    private String title;
    private String genre;
    private Integer duration;
    private AgeLimit ageLimit;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate releaseDate;

    private MovieStatus movieStatus;
    private String posterUrl;

    public MovieResponse() {
    }

    public MovieResponse(Integer movieId, String title, String genre, Integer duration,
                         AgeLimit ageLimit, LocalDate releaseDate, MovieStatus movieStatus, String posterUrl) {
        this.movieId = movieId;
        this.title = title;
        this.genre = genre;
        this.duration = duration;
        this.ageLimit = ageLimit;
        this.releaseDate = releaseDate;
        this.movieStatus = movieStatus;
        this.posterUrl = posterUrl;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static MovieResponse from(Movie movie) {
        if (movie == null) {
            return null;
        }
        return MovieResponse.builder()
                .movieId(movie.getMovieId())
                .title(movie.getTitle())
                .genre(movie.getGenre())
                .duration(movie.getDuration())
                .ageLimit(movie.getAgeLimit())
                .releaseDate(movie.getReleaseDate())
                .movieStatus(movie.getMovieStatus())
                .posterUrl(movie.getPosterUrl())
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

    public static class Builder {
        private Integer movieId;
        private String title;
        private String genre;
        private Integer duration;
        private AgeLimit ageLimit;
        private LocalDate releaseDate;
        private MovieStatus movieStatus;
        private String posterUrl;

        public Builder movieId(Integer movieId) {
            this.movieId = movieId;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
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

        public MovieResponse build() {
            return new MovieResponse(movieId, title, genre, duration, ageLimit, releaseDate, movieStatus, posterUrl);
        }
    }
}

