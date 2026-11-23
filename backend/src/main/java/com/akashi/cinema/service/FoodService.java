package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.CreateFoodRequest;
import com.akashi.cinema.dto.request.UpdateFoodRequest;
import com.akashi.cinema.dto.response.FoodResponse;
import com.akashi.cinema.entity.Food;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.FoodRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;
    private final CloudinaryService cloudinaryService;

    public FoodService(FoodRepository foodRepository, CloudinaryService cloudinaryService) {
        this.foodRepository = foodRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional(readOnly = true)
    public List<FoodResponse> getFoods(String categoryParam, String keywordParam, Boolean includeUnavailableParam) {
        boolean isAdmin = isCurrentUserAdmin();
        boolean includeUnavailable = isAdmin && Boolean.TRUE.equals(includeUnavailableParam);

        String category = (categoryParam != null && !categoryParam.isBlank()) ? categoryParam.trim() : null;
        String keyword = (keywordParam != null && !keywordParam.isBlank()) ? keywordParam.trim() : null;

        List<Food> foods = foodRepository.searchFoods(category, keyword, includeUnavailable);

        return foods.stream()
                .map(FoodResponse::from)
                .toList();
    }

    @Transactional
    public FoodResponse createFood(CreateFoodRequest request) {
        String normalizedImg = cloudinaryService.validateAndNormalizeFoodImageUrl(request.getImg());

        Food food = Food.builder()
                .name(request.getName().trim())
                .price(request.getPrice())
                .category(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null)
                .img(normalizedImg)
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        Food saved = foodRepository.save(food);
        return FoodResponse.from(saved);
    }

    @Transactional
    public FoodResponse updateFood(Integer id, UpdateFoodRequest request) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy món ăn"));

        String normalizedImg = cloudinaryService.validateAndNormalizeFoodImageUrl(request.getImg());

        food.setName(request.getName().trim());
        food.setPrice(request.getPrice());
        food.setCategory(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null);
        food.setImg(normalizedImg);
        if (request.getIsAvailable() != null) {
            food.setIsAvailable(request.getIsAvailable());
        }

        Food saved = foodRepository.save(food);
        return FoodResponse.from(saved);
    }

    @Transactional
    public void deleteFood(Integer id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy món ăn"));

        // Không xóa cứng, chỉ ngừng bán bằng isAvailable = false
        food.setIsAvailable(false);
        foodRepository.save(food);
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
