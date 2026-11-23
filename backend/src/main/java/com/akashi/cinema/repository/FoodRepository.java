package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Integer> {

    List<Food> findByIsAvailableTrueOrderByFoodIdAsc();

    List<Food> findByCategoryAndIsAvailableTrueOrderByFoodIdAsc(String category);

    @Query("""
        SELECT f FROM Food f
        WHERE (:includeUnavailable = true OR f.isAvailable = true)
          AND (:category IS NULL OR :category = '' OR f.category = :category)
          AND (:keyword IS NULL OR :keyword = '' OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY f.isAvailable DESC, f.foodId ASC
    """)
    List<Food> searchFoods(
            @Param("category") String category,
            @Param("keyword") String keyword,
            @Param("includeUnavailable") boolean includeUnavailable
    );
}
