package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Booking;
import com.akashi.cinema.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    @Query(
            value = "SELECT b FROM Booking b " +
                    "JOIN FETCH b.showtime s " +
                    "JOIN FETCH s.movie " +
                    "JOIN FETCH s.room " +
                    "WHERE b.user.userId = :userId " +
                    "AND (:status IS NULL OR b.bookingStatus = :status)",
            countQuery = "SELECT COUNT(b) FROM Booking b " +
                    "WHERE b.user.userId = :userId " +
                    "AND (:status IS NULL OR b.bookingStatus = :status)"
    )
    Page<Booking> findByUserIdAndStatus(@Param("userId") Integer userId,
                                        @Param("status") BookingStatus status,
                                        Pageable pageable);

    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.showtime.showId = :showId
              AND b.bookingStatus = com.akashi.cinema.enums.BookingStatus.PAID
            """)
    long countPaidBookingsByShowId(@Param("showId") Integer showId);

    @Query("""
            SELECT b FROM Booking b
            WHERE b.showtime.showId = :showId
              AND b.bookingStatus = com.akashi.cinema.enums.BookingStatus.PENDING
            """)
    java.util.List<Booking> findPendingBookingsByShowId(@Param("showId") Integer showId);
}

