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

    @Query("""
            SELECT COUNT(s) FROM Showtime s
            WHERE s.movie.movieId = :movieId
              AND s.isActive = true
              AND s.endTime > :now
            """)
    long countActiveUnfinishedShowtimes(
            @Param("movieId") Integer movieId,
            @Param("now") LocalDateTime now
    );

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.movie m
            JOIN FETCH s.room r
            WHERE s.showId = :showId
            """)
    java.util.Optional<Showtime> findByIdWithMovieAndRoom(@Param("showId") Integer showId);

    @Query("""
            SELECT s FROM Showtime s
            WHERE s.isActive = true
              AND s.room.roomId = :roomId
              AND (:excludeShowId IS NULL OR s.showId != :excludeShowId)
              AND s.startTime < :endTime
              AND s.endTime > :startTime
            """)
    List<Showtime> findOverlappingShowtimes(
            @Param("roomId") Integer roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeShowId") Integer excludeShowId
    );

    @Query("""
            SELECT s FROM Showtime s
            JOIN FETCH s.movie m
            JOIN FETCH s.room r
            WHERE (:dateStart IS NULL OR s.startTime >= :dateStart)
              AND (:dateEnd IS NULL OR s.startTime < :dateEnd)
              AND (:movieId IS NULL OR m.movieId = :movieId)
              AND (:roomId IS NULL OR r.roomId = :roomId)
              AND (:keyword IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(r.roomName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY
                CASE
                    WHEN s.isActive = true AND s.endTime >= :now THEN 1
                    WHEN s.isActive = true AND s.endTime < :now THEN 2
                    ELSE 3
                END ASC,
                s.startTime ASC,
                s.showId ASC
            """)
    List<Showtime> searchAdminShowtimes(
            @Param("dateStart") LocalDateTime dateStart,
            @Param("dateEnd") LocalDateTime dateEnd,
            @Param("movieId") Integer movieId,
            @Param("roomId") Integer roomId,
            @Param("keyword") String keyword,
            @Param("now") LocalDateTime now
    );
}

