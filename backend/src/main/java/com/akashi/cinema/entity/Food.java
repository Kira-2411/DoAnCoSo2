package com.akashi.cinema.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "foods")
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "food_id")
    private Integer foodId;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "img", length = 500)
    private String img;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    public Food() {
    }

    public Food(Integer foodId, String name, Long price, String img, String category, Boolean isAvailable) {
        this.foodId = foodId;
        this.name = name;
        this.price = price;
        this.img = img;
        this.category = category;
        this.isAvailable = isAvailable != null ? isAvailable : true;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Integer getFoodId() {
        return foodId;
    }

    public void setFoodId(Integer foodId) {
        this.foodId = foodId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean available) {
        isAvailable = available;
    }

    public static class Builder {
        private Integer foodId;
        private String name;
        private Long price;
        private String img;
        private String category;
        private Boolean isAvailable = true;

        public Builder foodId(Integer foodId) {
            this.foodId = foodId;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder price(Long price) {
            this.price = price;
            return this;
        }

        public Builder img(String img) {
            this.img = img;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder isAvailable(Boolean isAvailable) {
            this.isAvailable = isAvailable;
            return this;
        }

        public Food build() {
            return new Food(foodId, name, price, img, category, isAvailable);
        }
    }
}

