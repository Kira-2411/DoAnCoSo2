package com.akashi.cinema.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "theaters")
public class Theater {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "theater_id")
    private Integer theaterId;

    @Column(name = "theater_name", length = 255, nullable = false)
    private String theaterName;

    @Column(name = "location", length = 500)
    private String location;

    public Theater() {
    }

    public Theater(Integer theaterId, String theaterName, String location) {
        this.theaterId = theaterId;
        this.theaterName = theaterName;
        this.location = location;
    }

    public static Builder builder() {
        return new Builder();
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public static class Builder {
        private Integer theaterId;
        private String theaterName;
        private String location;

        public Builder theaterId(Integer theaterId) {
            this.theaterId = theaterId;
            return this;
        }

        public Builder theaterName(String theaterName) {
            this.theaterName = theaterName;
            return this;
        }

        public Builder location(String location) {
            this.location = location;
            return this;
        }

        public Theater build() {
            return new Theater(theaterId, theaterName, location);
        }
    }
}

