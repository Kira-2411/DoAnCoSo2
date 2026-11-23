package com.akashi.cinema.dto.request;

import jakarta.validation.constraints.NotNull;

public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;

    public UpdateUserStatusRequest() {
    }

    public UpdateUserStatusRequest(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
