package com.akashi.cinema.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "seat_holds")
public class SeatHold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hold_id")
    private Integer holdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Column(name = "holder_token", length = 64, nullable = false)
    private String holderToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public SeatHold() {
    }

    public SeatHold(Integer holdId, Showtime showtime, Seat seat, String holderToken,
                    Booking booking, Long price, LocalDateTime expiresAt, LocalDateTime createdAt) {
        this.holdId = holdId;
        this.showtime = showtime;
        this.seat = seat;
        this.holderToken = holderToken;
        this.booking = booking;
        this.price = price;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getHoldId() {
        return holdId;
    }

    public void setHoldId(Integer holdId) {
        this.holdId = holdId;
    }

    public Showtime getShowtime() {
        return showtime;
    }

    public void setShowtime(Showtime showtime) {
        this.showtime = showtime;
    }

    public Seat getSeat() {
        return seat;
    }

    public void setSeat(Seat seat) {
        this.seat = seat;
    }

    public String getHolderToken() {
        return holderToken;
    }

    public void setHolderToken(String holderToken) {
        this.holderToken = holderToken;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class Builder {
        private Integer holdId;
        private Showtime showtime;
        private Seat seat;
        private String holderToken;
        private Booking booking;
        private Long price;
        private LocalDateTime expiresAt;
        private LocalDateTime createdAt;

        public Builder holdId(Integer holdId) {
            this.holdId = holdId;
            return this;
        }

        public Builder showtime(Showtime showtime) {
            this.showtime = showtime;
            return this;
        }

        public Builder seat(Seat seat) {
            this.seat = seat;
            return this;
        }

        public Builder holderToken(String holderToken) {
            this.holderToken = holderToken;
            return this;
        }

        public Builder booking(Booking booking) {
            this.booking = booking;
            return this;
        }

        public Builder price(Long price) {
            this.price = price;
            return this;
        }

        public Builder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public SeatHold build() {
            return new SeatHold(holdId, showtime, seat, holderToken, booking, price, expiresAt, createdAt);
        }
    }
}

