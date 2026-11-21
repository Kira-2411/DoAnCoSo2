package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Integer> {

    @Query("""
            SELECT m FROM Movie m
            WHERE m.isActive = true
              AND (:status IS NULL OR m.movieStatus = :status)
              AND (:keyword IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Movie> searchActiveMovies(
            @Param("status") MovieStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
            SELECT m FROM Movie m
            WHERE (:includeInactive = true OR m.isActive = true)
              AND (:status IS NULL OR m.movieStatus = :status)
              AND (:keyword IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Movie> searchMovies(
            @Param("status") MovieStatus status,
            @Param("keyword") String keyword,
            @Param("includeInactive") boolean includeInactive,
            Pageable pageable
    );

    @Query(value = """
            SELECT m FROM Movie m
            WHERE (:includeInactive = true OR m.isActive = true)
              AND (:status IS NULL OR m.movieStatus = :status)
              AND (:keyword IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY 
              CASE 
                WHEN m.movieStatus = com.akashi.cinema.enums.MovieStatus.COMING_SOON THEN 1 
                WHEN m.movieStatus = com.akashi.cinema.enums.MovieStatus.NOW_SHOWING THEN 2 
                ELSE 3 
              END ASC,
              m.releaseDate DESC,
              m.createdAt DESC,
              m.movieId DESC
            """,
            countQuery = """
            SELECT COUNT(m) FROM Movie m
            WHERE (:includeInactive = true OR m.isActive = true)
              AND (:status IS NULL OR m.movieStatus = :status)
              AND (:keyword IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Movie> searchMoviesOrderByNewest(
            @Param("status") MovieStatus status,
            @Param("keyword") String keyword,
            @Param("includeInactive") boolean includeInactive,
            Pageable pageable
    );

    Optional<Movie> findByMovieIdAndIsActiveTrue(Integer movieId);

    @Modifying
    @Query("""
            UPDATE Movie m
            SET m.movieStatus = com.akashi.cinema.enums.MovieStatus.NOW_SHOWING
            WHERE m.isActive = true
              AND m.movieStatus = com.akashi.cinema.enums.MovieStatus.COMING_SOON
              AND m.releaseDate IS NOT NULL
              AND m.releaseDate <= :today
              AND m.releaseDate >= :sevenDaysAgo
            """)
    int autoPromoteComingSoonToNowShowing(
            @Param("today") LocalDate today,
            @Param("sevenDaysAgo") LocalDate sevenDaysAgo
    );

    @Modifying
    @Query("""
            UPDATE Movie m
            SET m.movieStatus = com.akashi.cinema.enums.MovieStatus.ENDED
            WHERE m.isActive = true
              AND m.movieStatus != com.akashi.cinema.enums.MovieStatus.ENDED
              AND (
                  (m.releaseDate IS NOT NULL AND m.releaseDate < :sevenDaysAgo)
                  OR
                  (m.releaseDate IS NULL AND m.createdAt < :sevenDaysAgoDateTime)
              )
            """)
    int autoExpireToEnded(
            @Param("sevenDaysAgo") LocalDate sevenDaysAgo,
            @Param("sevenDaysAgoDateTime") LocalDateTime sevenDaysAgoDateTime
    );
}

