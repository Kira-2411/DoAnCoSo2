package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Room;

public class RoomResponse {

    private Integer roomId;
    private Integer theaterId;
    private String theaterName;
    private String roomName;
    private Boolean isActive;

    public RoomResponse() {
    }

    public RoomResponse(Integer roomId, Integer theaterId, String theaterName, String roomName, Boolean isActive) {
        this.roomId = roomId;
        this.theaterId = theaterId;
        this.theaterName = theaterName;
        this.roomName = roomName;
        this.isActive = isActive;
    }

    public static RoomResponse from(Room room) {
        if (room == null) return null;
        Integer theaterId = room.getTheater() != null ? room.getTheater().getTheaterId() : null;
        String theaterName = room.getTheater() != null ? room.getTheater().getTheaterName() : null;
        return new RoomResponse(
                room.getRoomId(),
                theaterId,
                theaterName,
                room.getRoomName(),
                room.getIsActive()
        );
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public Integer getTheaterId() {
        return theaterId;
    }

    public void setTheaterId(Integer theaterId) {
        this.theaterId = theaterId;
    }

    public String getTheaterName() {
        return theaterName;
    }

    public void setTheaterName(String theaterName) {
        this.theaterName = theaterName;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
