package com.akashi.cinema.dto.response;

import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.Role;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Integer userId;
    private String username;
    private String email;
    private String phone;
    private Role role;

    public UserResponse() {
    }

    public UserResponse(Integer userId, String username, String email, String phone, Role role) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.role = role;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static UserResponse from(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public static class Builder {
        private Integer userId;
        private String username;
        private String email;
        private String phone;
        private Role role;

        public Builder userId(Integer userId) {
            this.userId = userId;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder role(Role role) {
            this.role = role;
            return this;
        }

        public UserResponse build() {
            return new UserResponse(userId, username, email, phone, role);
        }
    }
}
