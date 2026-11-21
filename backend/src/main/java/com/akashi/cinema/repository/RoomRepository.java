package com.akashi.cinema.repository;

import com.akashi.cinema.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {

    @Query("SELECT r FROM Room r JOIN FETCH r.theater ORDER BY r.roomId ASC")
    List<Room> findAllWithTheaterOrderByRoomIdAsc();

    Optional<Room> findByRoomIdAndIsActiveTrue(Integer roomId);
}
