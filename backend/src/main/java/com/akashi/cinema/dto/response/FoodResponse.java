package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.Food;

public class FoodResponse {

    private Integer foodId;
    private String name;
    private Long price;
    private String category;
    private String img;
    private Boolean isAvailable;

    public FoodResponse() {
    }

    public FoodResponse(Integer foodId, String name, Long price, String category, String img, Boolean isAvailable) {
        this.foodId = foodId;
        this.name = name;
        this.price = price;
        this.category = category;
        this.img = img;
        this.isAvailable = isAvailable;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static FoodResponse from(Food food) {
        if (food == null) {
            return null;
        }
        return FoodResponse.builder()
                .foodId(food.getFoodId())
                .name(food.getName())
                .price(food.getPrice())
                .category(food.getCategory())
                .img(food.getImg())
                .isAvailable(food.getIsAvailable())
                .build();
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public static class Builder {
        private Integer foodId;
        private String name;
        private Long price;
        private String category;
        private String img;
        private Boolean isAvailable;

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

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder img(String img) {
            this.img = img;
            return this;
        }

        public Builder isAvailable(Boolean isAvailable) {
            this.isAvailable = isAvailable;
            return this;
        }

        public FoodResponse build() {
            return new FoodResponse(foodId, name, price, category, img, isAvailable);
        }
    }
}
