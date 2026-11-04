package com.akashi.cinema.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "booking_seats")
public class BookingSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_seat_id")
    private Integer bookingSeatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Column(name = "price", nullable = false)
    private Long price;

    public BookingSeat() {
    }

    public BookingSeat(Integer bookingSeatId, Booking booking, Showtime showtime, Seat seat, Long price) {
        this.bookingSeatId = bookingSeatId;
        this.booking = booking;
        this.showtime = showtime;
        this.seat = seat;
        this.price = price;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getBookingSeatId() {
        return bookingSeatId;
    }

    public void setBookingSeatId(Integer bookingSeatId) {
        this.bookingSeatId = bookingSeatId;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
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

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public static class Builder {
        private Integer bookingSeatId;
        private Booking booking;
        private Showtime showtime;
        private Seat seat;
        private Long price;

        public Builder bookingSeatId(Integer bookingSeatId) {
            this.bookingSeatId = bookingSeatId;
            return this;
        }

        public Builder booking(Booking booking) {
            this.booking = booking;
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

        public Builder price(Long price) {
            this.price = price;
            return this;
        }

        public BookingSeat build() {
            return new BookingSeat(bookingSeatId, booking, showtime, seat, price);
        }
    }
}

