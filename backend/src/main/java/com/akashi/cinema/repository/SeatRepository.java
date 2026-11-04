package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {

    List<Seat> findByRoomRoomIdOrderByRowNumAscColNumAsc(Integer roomId);
}

