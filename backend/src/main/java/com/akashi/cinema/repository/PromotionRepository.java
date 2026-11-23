package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {

    @Query("""
            SELECT p FROM Promotion p
            WHERE p.isActive = true
              AND p.expiryDate > :now
            ORDER BY p.expiryDate ASC, p.promoId ASC
            """)
    List<Promotion> findActivePromotions(@Param("now") LocalDateTime now);

    Optional<Promotion> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndPromoIdNot(String code, Integer promoId);

    @Query("""
            SELECT p FROM Promotion p
            WHERE (:keyword IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:includeInactive = true OR p.isActive = true)
            ORDER BY p.promoId DESC
            """)
    List<Promotion> searchPromotions(@Param("keyword") String keyword, @Param("includeInactive") boolean includeInactive);
}
