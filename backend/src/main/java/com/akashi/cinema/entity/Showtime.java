package com.akashi.cinema.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "showtimes")
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "show_id")
    private Integer showId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "price_multiplier", nullable = false, precision = 3, scale = 2)
    private BigDecimal priceMultiplier = new BigDecimal("1.00");

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Showtime() {
    }

    public Showtime(Integer showId, Movie movie, Room room, LocalDateTime startTime, LocalDateTime endTime,
                    BigDecimal priceMultiplier, Boolean isActive, LocalDateTime createdAt) {
        this.showId = showId;
        this.movie = movie;
        this.room = room;
        this.startTime = startTime;
        this.endTime = endTime;
        this.priceMultiplier = priceMultiplier != null ? priceMultiplier : new BigDecimal("1.00");
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getShowId() {
        return showId;
    }

    public void setShowId(Integer showId) {
        this.showId = showId;
    }

    public Movie getMovie() {
        return movie;
    }

    public void setMovie(Movie movie) {
        this.movie = movie;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public BigDecimal getPriceMultiplier() {
        return priceMultiplier;
    }

    public void setPriceMultiplier(BigDecimal priceMultiplier) {
        this.priceMultiplier = priceMultiplier;
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

    public static class Builder {
        private Integer showId;
        private Movie movie;
        private Room room;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private BigDecimal priceMultiplier = new BigDecimal("1.00");
        private Boolean isActive = true;
        private LocalDateTime createdAt;

        public Builder showId(Integer showId) {
            this.showId = showId;
            return this;
        }

        public Builder movie(Movie movie) {
            this.movie = movie;
            return this;
        }

        public Builder room(Room room) {
            this.room = room;
            return this;
        }

        public Builder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(LocalDateTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder priceMultiplier(BigDecimal priceMultiplier) {
            this.priceMultiplier = priceMultiplier;
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

        public Showtime build() {
            return new Showtime(showId, movie, room, startTime, endTime, priceMultiplier, isActive, createdAt);
        }
    }
}

