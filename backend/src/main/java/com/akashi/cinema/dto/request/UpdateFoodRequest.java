package com.akashi.cinema.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateFoodRequest {

    @NotBlank(message = "Tên món không được để trống")
    @Size(max = 255, message = "Tên món tối đa 255 ký tự")
    private String name;

    @NotNull(message = "Giá bán không được để trống")
    @Min(value = 0, message = "Giá bán không được âm")
    private Long price;

    @Size(max = 100, message = "Danh mục tối đa 100 ký tự")
    private String category;

    @Size(max = 500, message = "Đường dẫn ảnh tối đa 500 ký tự")
    private String img;

    private Boolean isAvailable;

    public UpdateFoodRequest() {
    }

    public UpdateFoodRequest(String name, Long price, String category, String img, Boolean isAvailable) {
        this.name = name;
        this.price = price;
        this.category = category;
        this.img = img;
        this.isAvailable = isAvailable;
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
}
