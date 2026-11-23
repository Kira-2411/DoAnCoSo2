package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.CreatePromotionRequest;
import com.akashi.cinema.dto.request.UpdatePromotionRequest;
import com.akashi.cinema.dto.response.AdminPromotionResponse;
import com.akashi.cinema.dto.response.PromotionResponse;
import com.akashi.cinema.entity.Promotion;
import com.akashi.cinema.enums.DiscountType;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.PromotionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final Clock clock;

    public PromotionService(PromotionRepository promotionRepository, Clock clock) {
        this.promotionRepository = promotionRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(now);

        return activePromotions.stream()
                .map(PromotionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminPromotionResponse> getPromotions(String keyword, boolean includeInactive) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        List<Promotion> promotions = promotionRepository.searchPromotions(kw, includeInactive);
        return promotions.stream()
                .map(AdminPromotionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminPromotionResponse getPromotionById(Integer id) {
        Promotion promotion = findPromotionOrThrow(id);
        return AdminPromotionResponse.from(promotion);
    }

    @Transactional
    public AdminPromotionResponse createPromotion(CreatePromotionRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();

        if (promotionRepository.existsByCode(cleanCode)) {
            throw new AppException(HttpStatus.CONFLICT, "PROMO_EXISTS", "Mã khuyến mãi '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        validateDiscountValue(request.getDiscountType(), request.getDiscountValue());

        Promotion promotion = Promotion.builder()
                .code(cleanCode)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .expiryDate(request.getExpiryDate())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : 0L)
                .isActive(true)
                .build();

        Promotion saved = promotionRepository.save(promotion);
        return AdminPromotionResponse.from(saved);
    }

    @Transactional
    public AdminPromotionResponse updatePromotion(Integer id, UpdatePromotionRequest request) {
        Promotion promotion = findPromotionOrThrow(id);
        String cleanCode = request.getCode().trim().toUpperCase();

        if (promotionRepository.existsByCodeAndPromoIdNot(cleanCode, id)) {
            throw new AppException(HttpStatus.CONFLICT, "PROMO_EXISTS", "Mã khuyến mãi '" + cleanCode + "' đã trùng với mã khác");
        }

        validateDiscountValue(request.getDiscountType(), request.getDiscountValue());

        promotion.setCode(cleanCode);
        promotion.setDiscountType(request.getDiscountType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setExpiryDate(request.getExpiryDate());
        if (request.getMinOrderValue() != null) {
            promotion.setMinOrderValue(request.getMinOrderValue());
        }
        if (request.getIsActive() != null) {
            promotion.setIsActive(request.getIsActive());
        }

        Promotion updated = promotionRepository.save(promotion);
        return AdminPromotionResponse.from(updated);
    }

    @Transactional
    public void deletePromotion(Integer id) {
        Promotion promotion = findPromotionOrThrow(id);
        // Không xóa cứng dữ liệu lịch sử, chỉ ngừng mã bằng isActive = false
        promotion.setIsActive(false);
        promotionRepository.save(promotion);
    }

    @Transactional
    public AdminPromotionResponse setPromotionStatus(Integer id, boolean active) {
        Promotion promotion = findPromotionOrThrow(id);
        promotion.setIsActive(active);
        Promotion saved = promotionRepository.save(promotion);
        return AdminPromotionResponse.from(saved);
    }

    private Promotion findPromotionOrThrow(Integer id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy mã khuyến mãi"));
    }

    private void validateDiscountValue(DiscountType discountType, Long discountValue) {
        if (discountType == DiscountType.PERCENT) {
            if (discountValue == null || discountValue < 1 || discountValue > 100) {
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tỷ lệ giảm theo phần trăm phải từ 1 đến 100%");
            }
        } else if (discountType == DiscountType.FIXED) {
            if (discountValue == null || discountValue <= 0) {
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Số tiền giảm phải lớn hơn 0");
            }
        }
    }
}
