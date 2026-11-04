package com.akashi.cinema.repository;

import com.akashi.cinema.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Integer> {

    @Query("SELECT bs FROM BookingSeat bs " +
            "JOIN FETCH bs.seat s " +
            "WHERE bs.booking.bookingId IN :bookingIds " +
            "ORDER BY s.rowNum ASC, s.colNum ASC")
    List<BookingSeat> findByBookingIdsWithSeat(@Param("bookingIds") Collection<Integer> bookingIds);
}

