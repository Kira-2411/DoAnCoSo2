package com.akashi.cinema.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "rooms",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_rooms_theater_name", columnNames = {"theater_id", "room_name"})
        }
)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Integer roomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theater_id", nullable = false)
    private Theater theater;

    @Column(name = "room_name", length = 100, nullable = false)
    private String roomName;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Room() {
    }

    public Room(Integer roomId, Theater theater, String roomName, Boolean isActive) {
        this.roomId = roomId;
        this.theater = theater;
        this.roomName = roomName;
        this.isActive = isActive != null ? isActive : true;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public Theater getTheater() {
        return theater;
    }

    public void setTheater(Theater theater) {
        this.theater = theater;
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

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public static class Builder {
        private Integer roomId;
        private Theater theater;
        private String roomName;
        private Boolean isActive = true;

        public Builder roomId(Integer roomId) {
            this.roomId = roomId;
            return this;
        }

        public Builder theater(Theater theater) {
            this.theater = theater;
            return this;
        }

        public Builder roomName(String roomName) {
            this.roomName = roomName;
            return this;
        }

        public Builder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public Room build() {
            return new Room(roomId, theater, roomName, isActive);
        }
    }
}

