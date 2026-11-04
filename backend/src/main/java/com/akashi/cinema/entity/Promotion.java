package com.akashi.cinema.entity;

import com.akashi.cinema.enums.DiscountType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promo_id")
    private Integer promoId;

    @Column(name = "code", length = 50, nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, columnDefinition = "ENUM('PERCENT', 'FIXED')")
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false)
    private Long discountValue;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "min_order_value", nullable = false)
    private Long minOrderValue = 0L;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Promotion() {
    }

    public Promotion(Integer promoId, String code, DiscountType discountType, Long discountValue,
                     LocalDateTime expiryDate, Long minOrderValue, Boolean isActive, LocalDateTime createdAt) {
        this.promoId = promoId;
        this.code = code;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.expiryDate = expiryDate;
        this.minOrderValue = minOrderValue != null ? minOrderValue : 0L;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getPromoId() {
        return promoId;
    }

    public void setPromoId(Integer promoId) {
        this.promoId = promoId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public void setDiscountType(DiscountType discountType) {
        this.discountType = discountType;
    }

    public Long getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(Long discountValue) {
        this.discountValue = discountValue;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Long getMinOrderValue() {
        return minOrderValue;
    }

    public void setMinOrderValue(Long minOrderValue) {
        this.minOrderValue = minOrderValue;
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
        private Integer promoId;
        private String code;
        private DiscountType discountType;
        private Long discountValue;
        private LocalDateTime expiryDate;
        private Long minOrderValue = 0L;
        private Boolean isActive = true;
        private LocalDateTime createdAt;

        public Builder promoId(Integer promoId) {
            this.promoId = promoId;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder discountType(DiscountType discountType) {
            this.discountType = discountType;
            return this;
        }

        public Builder discountValue(Long discountValue) {
            this.discountValue = discountValue;
            return this;
        }

        public Builder expiryDate(LocalDateTime expiryDate) {
            this.expiryDate = expiryDate;
            return this;
        }

        public Builder minOrderValue(Long minOrderValue) {
            this.minOrderValue = minOrderValue;
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

        public Promotion build() {
            return new Promotion(promoId, code, discountType, discountValue, expiryDate, minOrderValue, isActive, createdAt);
        }
    }
}

