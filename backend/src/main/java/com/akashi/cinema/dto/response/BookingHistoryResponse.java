package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Booking;
import com.akashi.cinema.enums.BookingStatus;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public class BookingHistoryResponse {

    private Integer bookingId;
    private String bookingCode;
    private BookingStatus status;
    private String movieTitle;
    private String roomName;
    private LocalDateTime showtime;
    private List<String> seats;
    private Long totalPrice;
    private LocalDateTime createdAt;

    public BookingHistoryResponse() {
    }

    public BookingHistoryResponse(Integer bookingId, String bookingCode, BookingStatus status,
                                  String movieTitle, String roomName, LocalDateTime showtime,
                                  List<String> seats, Long totalPrice, LocalDateTime createdAt) {
        this.bookingId = bookingId;
        this.bookingCode = bookingCode;
        this.status = status;
        this.movieTitle = movieTitle;
        this.roomName = roomName;
        this.showtime = showtime;
        this.seats = seats != null ? seats : Collections.emptyList();
        this.totalPrice = totalPrice;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static BookingHistoryResponse from(Booking booking, List<String> seatLabels) {
        if (booking == null) {
            return null;
        }
        return BookingHistoryResponse.builder()
                .bookingId(booking.getBookingId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getBookingStatus())
                .movieTitle(booking.getShowtime().getMovie().getTitle())
                .roomName(booking.getShowtime().getRoom().getRoomName())
                .showtime(booking.getShowtime().getStartTime())
                .seats(seatLabels != null ? seatLabels : Collections.emptyList())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getBookingTime())
                .build();
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public void setBookingCode(String bookingCode) {
        this.bookingCode = bookingCode;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getMovieTitle() {
        return movieTitle;
    }

    public void setMovieTitle(String movieTitle) {
        this.movieTitle = movieTitle;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public LocalDateTime getShowtime() {
        return showtime;
    }

    public void setShowtime(LocalDateTime showtime) {
        this.showtime = showtime;
    }

    public List<String> getSeats() {
        return seats;
    }

    public void setSeats(List<String> seats) {
        this.seats = seats;
    }

    public Long getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Long totalPrice) {
        this.totalPrice = totalPrice;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class Builder {
        private Integer bookingId;
        private String bookingCode;
        private BookingStatus status;
        private String movieTitle;
        private String roomName;
        private LocalDateTime showtime;
        private List<String> seats = Collections.emptyList();
        private Long totalPrice;
        private LocalDateTime createdAt;

        public Builder bookingId(Integer bookingId) {
            this.bookingId = bookingId;
            return this;
        }

        public Builder bookingCode(String bookingCode) {
            this.bookingCode = bookingCode;
            return this;
        }

        public Builder status(BookingStatus status) {
            this.status = status;
            return this;
        }

        public Builder movieTitle(String movieTitle) {
            this.movieTitle = movieTitle;
            return this;
        }

        public Builder roomName(String roomName) {
            this.roomName = roomName;
            return this;
        }

        public Builder showtime(LocalDateTime showtime) {
            this.showtime = showtime;
            return this;
        }

        public Builder seats(List<String> seats) {
            this.seats = seats;
            return this;
        }

        public Builder totalPrice(Long totalPrice) {
            this.totalPrice = totalPrice;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public BookingHistoryResponse build() {
            return new BookingHistoryResponse(bookingId, bookingCode, status, movieTitle,
                    roomName, showtime, seats, totalPrice, createdAt);
        }
    }
}

