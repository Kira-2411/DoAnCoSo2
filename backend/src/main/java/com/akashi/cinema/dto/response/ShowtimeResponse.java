package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.entity.Room;
import com.akashi.cinema.entity.Showtime;
import com.akashi.cinema.enums.AgeLimit;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

public class ShowtimeResponse {

    private Integer showId;
    private Integer movieId;
    private String movieTitle;
    private AgeLimit ageLimit;
    private Integer duration;
    private String genre;
    private Integer roomId;
    private String roomName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    private BigDecimal priceMultiplier;

    public ShowtimeResponse() {
    }

    public ShowtimeResponse(Integer showId, Integer movieId, String movieTitle, AgeLimit ageLimit,
                            Integer duration, String genre, Integer roomId, String roomName,
                            LocalDateTime startTime, LocalDateTime endTime, BigDecimal priceMultiplier) {
        this.showId = showId;
        this.movieId = movieId;
        this.movieTitle = movieTitle;
        this.ageLimit = ageLimit;
        this.duration = duration;
        this.genre = genre;
        this.roomId = roomId;
        this.roomName = roomName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.priceMultiplier = priceMultiplier != null ? priceMultiplier.setScale(2, RoundingMode.HALF_UP) : null;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static ShowtimeResponse from(Showtime showtime) {
        if (showtime == null) {
            return null;
        }
        Movie movie = showtime.getMovie();
        Room room = showtime.getRoom();

        return ShowtimeResponse.builder()
                .showId(showtime.getShowId())
                .movieId(movie != null ? movie.getMovieId() : null)
                .movieTitle(movie != null ? movie.getTitle() : null)
                .ageLimit(movie != null ? movie.getAgeLimit() : null)
                .duration(movie != null ? movie.getDuration() : null)
                .genre(movie != null ? movie.getGenre() : null)
                .roomId(room != null ? room.getRoomId() : null)
                .roomName(room != null ? room.getRoomName() : null)
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .priceMultiplier(showtime.getPriceMultiplier())
                .build();
    }

    public Integer getShowId() {
        return showId;
    }

    public void setShowId(Integer showId) {
        this.showId = showId;
    }

    public Integer getMovieId() {
        return movieId;
    }

    public void setMovieId(Integer movieId) {
        this.movieId = movieId;
    }

    public String getMovieTitle() {
        return movieTitle;
    }

    public void setMovieTitle(String movieTitle) {
        this.movieTitle = movieTitle;
    }

    public AgeLimit getAgeLimit() {
        return ageLimit;
    }

    public void setAgeLimit(AgeLimit ageLimit) {
        this.ageLimit = ageLimit;
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

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
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
        this.priceMultiplier = priceMultiplier != null ? priceMultiplier.setScale(2, RoundingMode.HALF_UP) : null;
    }

    public static class Builder {
        private Integer showId;
        private Integer movieId;
        private String movieTitle;
        private AgeLimit ageLimit;
        private Integer duration;
        private String genre;
        private Integer roomId;
        private String roomName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private BigDecimal priceMultiplier;

        public Builder showId(Integer showId) {
            this.showId = showId;
            return this;
        }

        public Builder movieId(Integer movieId) {
            this.movieId = movieId;
            return this;
        }

        public Builder movieTitle(String movieTitle) {
            this.movieTitle = movieTitle;
            return this;
        }

        public Builder ageLimit(AgeLimit ageLimit) {
            this.ageLimit = ageLimit;
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

        public Builder roomId(Integer roomId) {
            this.roomId = roomId;
            return this;
        }

        public Builder roomName(String roomName) {
            this.roomName = roomName;
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

        public ShowtimeResponse build() {
            return new ShowtimeResponse(showId, movieId, movieTitle, ageLimit, duration, genre,
                    roomId, roomName, startTime, endTime, priceMultiplier);
        }
    }
}

