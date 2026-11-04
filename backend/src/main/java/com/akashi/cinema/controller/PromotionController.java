package com.akashi.cinema.controller;

import com.akashi.cinema.dto.response.PromotionResponse;
import com.akashi.cinema.service.PromotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<PromotionResponse>> getActivePromotions() {
        List<PromotionResponse> response = promotionService.getActivePromotions();
        return ResponseEntity.ok(response);
    }
}

