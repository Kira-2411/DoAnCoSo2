package com.akashi.cinema.dto.request;

import com.akashi.cinema.enums.DiscountType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public class CreatePromotionRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    @Size(max = 50, message = "Mã không được vượt quá 50 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã chỉ được chứa chữ hoa không dấu, số, gạch nối (-) hoặc (_)")
    private String code;

    @NotNull(message = "Loại giảm giá không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @Positive(message = "Giá trị giảm phải là số dương")
    private Long discountValue;

    @NotNull(message = "Ngày hết hạn không được để trống")
    @JsonFormat(pattern = "yyyy-MM-dd['T'HH:mm[:ss]]")
    private LocalDateTime expiryDate;

    @Min(value = 0, message = "Giá trị đơn tối thiểu không được âm")
    private Long minOrderValue = 0L;

    public CreatePromotionRequest() {
    }

    public CreatePromotionRequest(String code, DiscountType discountType, Long discountValue,
                                  LocalDateTime expiryDate, Long minOrderValue) {
        this.code = code;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.expiryDate = expiryDate;
        this.minOrderValue = minOrderValue != null ? minOrderValue : 0L;
    }

    public static Builder builder() {
        return new Builder();
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

    public static class Builder {
        private String code;
        private DiscountType discountType;
        private Long discountValue;
        private LocalDateTime expiryDate;
        private Long minOrderValue = 0L;

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

        public CreatePromotionRequest build() {
            return new CreatePromotionRequest(code, discountType, discountValue, expiryDate, minOrderValue);
        }
    }
}
