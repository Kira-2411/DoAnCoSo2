package com.akashi.cinema.entity;

import com.akashi.cinema.enums.AgeLimit;
import com.akashi.cinema.enums.MovieStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movie_id")
    private Integer movieId;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "genre", length = 100)
    private String genre;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_limit", nullable = false, columnDefinition = "ENUM('P', 'T13', 'T16', 'T18')")
    private AgeLimit ageLimit = AgeLimit.T13;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "movie_status", nullable = false, columnDefinition = "ENUM('COMING_SOON', 'NOW_SHOWING', 'ENDED')")
    private MovieStatus movieStatus = MovieStatus.COMING_SOON;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Movie() {
    }

    public Movie(Integer movieId, String title, String description, Integer duration, String genre,
                 AgeLimit ageLimit, LocalDate releaseDate, MovieStatus movieStatus, String posterUrl,
                 Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.movieId = movieId;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.ageLimit = ageLimit != null ? ageLimit : AgeLimit.T13;
        this.releaseDate = releaseDate;
        this.movieStatus = movieStatus != null ? movieStatus : MovieStatus.COMING_SOON;
        this.posterUrl = posterUrl;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
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

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
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
        private Integer duration;
        private String genre;
        private AgeLimit ageLimit = AgeLimit.T13;
        private LocalDate releaseDate;
        private MovieStatus movieStatus = MovieStatus.COMING_SOON;
        private String posterUrl;
        private Boolean isActive = true;
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

        public Builder duration(Integer duration) {
            this.duration = duration;
            return this;
        }

        public Builder genre(String genre) {
            this.genre = genre;
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

        public Builder isActive(Boolean isActive) {
            this.isActive = isActive;
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

        public Movie build() {
            return new Movie(movieId, title, description, duration, genre, ageLimit, releaseDate,
                    movieStatus, posterUrl, isActive, createdAt, updatedAt);
        }
    }
}

