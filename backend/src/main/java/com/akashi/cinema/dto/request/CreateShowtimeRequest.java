package com.akashi.cinema.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateShowtimeRequest {

    @NotNull(message = "ID phim là bắt buộc")
    private Integer movieId;

    @NotNull(message = "ID phòng chiếu là bắt buộc")
    private Integer roomId;

    @NotNull(message = "Thời gian bắt đầu là bắt buộc")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss]")
    private LocalDateTime startTime;

    @DecimalMin(value = "0.50", message = "Hệ số giá tối thiểu là 0.50")
    @DecimalMax(value = "3.00", message = "Hệ số giá tối đa là 3.00")
    private BigDecimal priceMultiplier;

    public CreateShowtimeRequest() {
    }

    public CreateShowtimeRequest(Integer movieId, Integer roomId, LocalDateTime startTime, BigDecimal priceMultiplier) {
        this.movieId = movieId;
        this.roomId = roomId;
        this.startTime = startTime;
        this.priceMultiplier = priceMultiplier;
    }

    public Integer getMovieId() {
        return movieId;
    }

    public void setMovieId(Integer movieId) {
        this.movieId = movieId;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public BigDecimal getPriceMultiplier() {
        return priceMultiplier;
    }

    public void setPriceMultiplier(BigDecimal priceMultiplier) {
        this.priceMultiplier = priceMultiplier;
    }
}
