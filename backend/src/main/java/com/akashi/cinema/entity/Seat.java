package com.akashi.cinema.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_id")
    private Integer seatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_type_id", nullable = false)
    private SeatType seatType;

    @Column(name = "row_num", nullable = false)
    private Integer rowNum;

    @Column(name = "col_num", nullable = false)
    private Integer colNum;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Seat() {
    }

    public Seat(Integer seatId, Room room, SeatType seatType, Integer rowNum, Integer colNum, Boolean isActive) {
        this.seatId = seatId;
        this.room = room;
        this.seatType = seatType;
        this.rowNum = rowNum;
        this.colNum = colNum;
        this.isActive = isActive != null ? isActive : true;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getFormattedLabel() {
        if (rowNum == null || colNum == null) {
            return "";
        }
        char rowChar = (char) ('A' + rowNum - 1);
        return String.format("%c%02d", rowChar, colNum);
    }

    public Integer getSeatId() {
        return seatId;
    }

    public void setSeatId(Integer seatId) {
        this.seatId = seatId;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public SeatType getSeatType() {
        return seatType;
    }

    public void setSeatType(SeatType seatType) {
        this.seatType = seatType;
    }

    public Integer getRowNum() {
        return rowNum;
    }

    public void setRowNum(Integer rowNum) {
        this.rowNum = rowNum;
    }

    public Integer getColNum() {
        return colNum;
    }

    public void setColNum(Integer colNum) {
        this.colNum = colNum;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public static class Builder {
        private Integer seatId;
        private Room room;
        private SeatType seatType;
        private Integer rowNum;
        private Integer colNum;
        private Boolean isActive = true;

        public Builder seatId(Integer seatId) {
            this.seatId = seatId;
            return this;
        }

        public Builder room(Room room) {
            this.room = room;
            return this;
        }

        public Builder seatType(SeatType seatType) {
            this.seatType = seatType;
            return this;
        }

        public Builder rowNum(Integer rowNum) {
            this.rowNum = rowNum;
            return this;
        }

        public Builder colNum(Integer colNum) {
            this.colNum = colNum;
            return this;
        }

        public Builder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public Seat build() {
            return new Seat(seatId, room, seatType, rowNum, colNum, isActive);
        }
    }
}

