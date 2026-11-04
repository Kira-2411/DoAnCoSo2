package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.FoodResponse;
import com.akashi.cinema.entity.Food;
import com.akashi.cinema.repository.FoodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    @Transactional(readOnly = true)
    public List<FoodResponse> getFoods(String categoryParam) {
        List<Food> foods;
        if (categoryParam == null || categoryParam.isBlank()) {
            foods = foodRepository.findByIsAvailableTrueOrderByFoodIdAsc();
        } else {
            foods = foodRepository.findByCategoryAndIsAvailableTrueOrderByFoodIdAsc(categoryParam.trim());
        }

        return foods.stream()
                .map(FoodResponse::from)
                .toList();
    }
}

