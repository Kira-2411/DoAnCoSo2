package com.akashi.cinema.entity;

import com.akashi.cinema.enums.BookingChannel;
import com.akashi.cinema.enums.BookingStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Integer bookingId;

    @Column(name = "booking_code", length = 20, nullable = false, unique = true)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_id")
    private Promotion promotion;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, columnDefinition = "ENUM('ONLINE', 'COUNTER')")
    private BookingChannel channel = BookingChannel.ONLINE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "discount_amount", nullable = false)
    private Long discountAmount = 0L;

    @Column(name = "total_price", nullable = false)
    private Long totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", nullable = false, columnDefinition = "ENUM('PENDING', 'PAID', 'CANCELLED', 'EXPIRED')")
    private BookingStatus bookingStatus = BookingStatus.PENDING;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "booking_time", nullable = false)
    private LocalDateTime bookingTime;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Booking() {
    }

    public Booking(Integer bookingId, String bookingCode, User user, Showtime showtime,
                   Promotion promotion, BookingChannel channel, User createdBy,
                   Long discountAmount, Long totalPrice, BookingStatus bookingStatus,
                   LocalDateTime expiresAt, LocalDateTime bookingTime, LocalDateTime updatedAt) {
        this.bookingId = bookingId;
        this.bookingCode = bookingCode;
        this.user = user;
        this.showtime = showtime;
        this.promotion = promotion;
        this.channel = channel != null ? channel : BookingChannel.ONLINE;
        this.createdBy = createdBy;
        this.discountAmount = discountAmount != null ? discountAmount : 0L;
        this.totalPrice = totalPrice;
        this.bookingStatus = bookingStatus != null ? bookingStatus : BookingStatus.PENDING;
        this.expiresAt = expiresAt;
        this.bookingTime = bookingTime;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.bookingTime == null) {
            this.bookingTime = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Showtime getShowtime() {
        return showtime;
    }

    public void setShowtime(Showtime showtime) {
        this.showtime = showtime;
    }

    public Promotion getPromotion() {
        return promotion;
    }

    public void setPromotion(Promotion promotion) {
        this.promotion = promotion;
    }

    public BookingChannel getChannel() {
        return channel;
    }

    public void setChannel(BookingChannel channel) {
        this.channel = channel;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Long getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(Long discountAmount) {
        this.discountAmount = discountAmount;
    }

    public Long getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Long totalPrice) {
        this.totalPrice = totalPrice;
    }

    public BookingStatus getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(BookingStatus bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getBookingTime() {
        return bookingTime;
    }

    public void setBookingTime(LocalDateTime bookingTime) {
        this.bookingTime = bookingTime;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class Builder {
        private Integer bookingId;
        private String bookingCode;
        private User user;
        private Showtime showtime;
        private Promotion promotion;
        private BookingChannel channel = BookingChannel.ONLINE;
        private User createdBy;
        private Long discountAmount = 0L;
        private Long totalPrice;
        private BookingStatus bookingStatus = BookingStatus.PENDING;
        private LocalDateTime expiresAt;
        private LocalDateTime bookingTime;
        private LocalDateTime updatedAt;

        public Builder bookingId(Integer bookingId) {
            this.bookingId = bookingId;
            return this;
        }

        public Builder bookingCode(String bookingCode) {
            this.bookingCode = bookingCode;
            return this;
        }

        public Builder user(User user) {
            this.user = user;
            return this;
        }

        public Builder showtime(Showtime showtime) {
            this.showtime = showtime;
            return this;
        }

        public Builder promotion(Promotion promotion) {
            this.promotion = promotion;
            return this;
        }

        public Builder channel(BookingChannel channel) {
            this.channel = channel;
            return this;
        }

        public Builder createdBy(User createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public Builder discountAmount(Long discountAmount) {
            this.discountAmount = discountAmount;
            return this;
        }

        public Builder totalPrice(Long totalPrice) {
            this.totalPrice = totalPrice;
            return this;
        }

        public Builder bookingStatus(BookingStatus bookingStatus) {
            this.bookingStatus = bookingStatus;
            return this;
        }

        public Builder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public Builder bookingTime(LocalDateTime bookingTime) {
            this.bookingTime = bookingTime;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Booking build() {
            return new Booking(bookingId, bookingCode, user, showtime, promotion, channel, createdBy,
                    discountAmount, totalPrice, bookingStatus, expiresAt, bookingTime, updatedAt);
        }
    }
}

