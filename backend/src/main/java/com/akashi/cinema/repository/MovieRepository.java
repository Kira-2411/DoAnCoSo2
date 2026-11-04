package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

    Optional<Movie> findByMovieIdAndIsActiveTrue(Integer movieId);
}

