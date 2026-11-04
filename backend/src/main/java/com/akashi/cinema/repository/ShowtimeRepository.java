package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Integer> {

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.movie m
            JOIN FETCH s.room r
            WHERE s.isActive = true
              AND m.isActive = true
              AND r.isActive = true
              AND s.startTime >= :startOfDay
              AND s.startTime < :startOfNextDay
              AND (:movieId IS NULL OR m.movieId = :movieId)
              AND (:roomId IS NULL OR r.roomId = :roomId)
            ORDER BY s.startTime ASC, s.showId ASC
            """)
    List<Showtime> findActiveShowtimesByDate(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("startOfNextDay") LocalDateTime startOfNextDay,
            @Param("movieId") Integer movieId,
            @Param("roomId") Integer roomId
    );
}

