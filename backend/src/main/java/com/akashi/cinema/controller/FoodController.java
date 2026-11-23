package com.akashi.cinema.controller;

import com.akashi.cinema.dto.request.CreateFoodRequest;
import com.akashi.cinema.dto.request.UpdateFoodRequest;
import com.akashi.cinema.dto.response.FoodResponse;
import com.akashi.cinema.service.FoodService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @GetMapping
    public ResponseEntity<List<FoodResponse>> getFoods(
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "includeUnavailable", required = false, defaultValue = "false") Boolean includeUnavailable
    ) {
        List<FoodResponse> response = foodService.getFoods(category, keyword, includeUnavailable);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FoodResponse> createFood(@Valid @RequestBody CreateFoodRequest request) {
        FoodResponse response = foodService.createFood(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FoodResponse> updateFood(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateFoodRequest request
    ) {
        FoodResponse response = foodService.updateFood(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFood(@PathVariable("id") Integer id) {
        foodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }
}
