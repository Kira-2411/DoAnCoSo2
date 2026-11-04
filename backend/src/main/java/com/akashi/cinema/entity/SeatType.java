package com.akashi.cinema.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "seat_types")
public class SeatType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_type_id")
    private Integer seatTypeId;

    @Column(name = "code", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Column(name = "base_price", nullable = false)
    private Long basePrice;

    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "people_count", nullable = false, columnDefinition = "TINYINT")
    private Integer peopleCount = 1;

    public SeatType() {
    }

    public SeatType(Integer seatTypeId, String code, String name, Long basePrice, Integer peopleCount) {
        this.seatTypeId = seatTypeId;
        this.code = code;
        this.name = name;
        this.basePrice = basePrice;
        this.peopleCount = peopleCount != null ? peopleCount : 1;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getSeatTypeId() {
        return seatTypeId;
    }

    public void setSeatTypeId(Integer seatTypeId) {
        this.seatTypeId = seatTypeId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(Long basePrice) {
        this.basePrice = basePrice;
    }

    public Integer getPeopleCount() {
        return peopleCount;
    }

    public void setPeopleCount(Integer peopleCount) {
        this.peopleCount = peopleCount;
    }

    public static class Builder {
        private Integer seatTypeId;
        private String code;
        private String name;
        private Long basePrice;
        private Integer peopleCount = 1;

        public Builder seatTypeId(Integer seatTypeId) {
            this.seatTypeId = seatTypeId;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder basePrice(Long basePrice) {
            this.basePrice = basePrice;
            return this;
        }

        public Builder peopleCount(Integer peopleCount) {
            this.peopleCount = peopleCount;
            return this;
        }

        public SeatType build() {
            return new SeatType(seatTypeId, code, name, basePrice, peopleCount);
        }
    }
}

