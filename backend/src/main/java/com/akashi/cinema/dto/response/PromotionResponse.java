package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Promotion;
import com.akashi.cinema.enums.DiscountType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public class PromotionResponse {

    private Integer promoId;
    private String code;
    private DiscountType discountType;
    private Long discountValue;
    private Long minOrderValue;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expiryDate;

    public PromotionResponse() {
    }

    public PromotionResponse(Integer promoId, String code, DiscountType discountType,
                             Long discountValue, Long minOrderValue, LocalDateTime expiryDate) {
        this.promoId = promoId;
        this.code = code;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.minOrderValue = minOrderValue;
        this.expiryDate = expiryDate;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static PromotionResponse from(Promotion promotion) {
        if (promotion == null) {
            return null;
        }
        return PromotionResponse.builder()
                .promoId(promotion.getPromoId())
                .code(promotion.getCode())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .minOrderValue(promotion.getMinOrderValue())
                .expiryDate(promotion.getExpiryDate())
                .build();
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

    public Long getMinOrderValue() {
        return minOrderValue;
    }

    public void setMinOrderValue(Long minOrderValue) {
        this.minOrderValue = minOrderValue;
    }

    public LocalDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public static class Builder {
        private Integer promoId;
        private String code;
        private DiscountType discountType;
        private Long discountValue;
        private Long minOrderValue;
        private LocalDateTime expiryDate;

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

        public Builder minOrderValue(Long minOrderValue) {
            this.minOrderValue = minOrderValue;
            return this;
        }

        public Builder expiryDate(LocalDateTime expiryDate) {
            this.expiryDate = expiryDate;
            return this;
        }

        public PromotionResponse build() {
            return new PromotionResponse(promoId, code, discountType, discountValue, minOrderValue, expiryDate);
        }
    }
}

