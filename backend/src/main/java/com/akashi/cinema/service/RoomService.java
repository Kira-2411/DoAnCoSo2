package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.RoomResponse;
import com.akashi.cinema.entity.Room;
import com.akashi.cinema.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = roomRepository.findAllWithTheaterOrderByRoomIdAsc();
        return rooms.stream()
                .map(RoomResponse::from)
                .toList();
    }
}
