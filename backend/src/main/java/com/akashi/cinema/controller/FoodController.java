package com.akashi.cinema.controller;

import com.akashi.cinema.dto.response.FoodResponse;
import com.akashi.cinema.service.FoodService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
            @RequestParam(name = "category", required = false) String category
    ) {
        List<FoodResponse> response = foodService.getFoods(category);
        return ResponseEntity.ok(response);
    }
}

