package com.akashi.cinema.repository;

import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = true")
    long countByRoleAndIsActiveTrue(@Param("role") Role role);

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :keyword, '%')))
        ORDER BY CASE u.role WHEN com.akashi.cinema.enums.Role.ADMIN THEN 1 WHEN com.akashi.cinema.enums.Role.STAFF THEN 2 ELSE 3 END ASC, u.userId ASC
    """)
    Page<User> searchUsers(@Param("role") Role role, @Param("keyword") String keyword, Pageable pageable);
}
