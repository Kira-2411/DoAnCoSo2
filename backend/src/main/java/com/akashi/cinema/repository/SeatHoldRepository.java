package com.akashi.cinema.repository;

import com.akashi.cinema.entity.SeatHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SeatHoldRepository extends JpaRepository<SeatHold, Integer> {

    @Query("SELECT sh FROM SeatHold sh " +
            "JOIN FETCH sh.seat s " +
            "WHERE sh.booking.bookingId IN :bookingIds " +
            "ORDER BY s.rowNum ASC, s.colNum ASC")
    List<SeatHold> findByBookingIdsWithSeat(@Param("bookingIds") Collection<Integer> bookingIds);
}

