package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.CreatePromotionRequest;
import com.akashi.cinema.dto.request.UpdatePromotionRequest;
import com.akashi.cinema.dto.response.AdminPromotionResponse;
import com.akashi.cinema.dto.response.PromotionResponse;
import com.akashi.cinema.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminPromotionResponse>> getPromotions(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive
    ) {
        List<AdminPromotionResponse> response = promotionService.getPromotions(keyword, includeInactive);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminPromotionResponse> getPromotionById(@PathVariable("id") Integer id) {
        AdminPromotionResponse response = promotionService.getPromotionById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminPromotionResponse> createPromotion(@Valid @RequestBody CreatePromotionRequest request) {
        AdminPromotionResponse response = promotionService.createPromotion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminPromotionResponse> updatePromotion(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdatePromotionRequest request
    ) {
        AdminPromotionResponse response = promotionService.updatePromotion(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePromotion(@PathVariable("id") Integer id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminPromotionResponse> setPromotionStatus(
            @PathVariable("id") Integer id,
            @RequestParam("active") boolean active
    ) {
        AdminPromotionResponse response = promotionService.setPromotionStatus(id, active);
        return ResponseEntity.ok(response);
    }
}
