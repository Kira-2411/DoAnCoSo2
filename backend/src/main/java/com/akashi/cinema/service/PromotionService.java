package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.PromotionResponse;
import com.akashi.cinema.entity.Promotion;
import com.akashi.cinema.repository.PromotionRepository;
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
}

