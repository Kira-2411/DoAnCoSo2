package com.akashi.cinema.dto.response;

public class LoginResponse {

    private String accessToken;
    private String tokenType;
    private Long expiresIn;
    private UserResponse user;

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, String tokenType, Long expiresIn, UserResponse user) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public static class Builder {
        private String accessToken;
        private String tokenType;
        private Long expiresIn;
        private UserResponse user;

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public Builder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public Builder expiresIn(Long expiresIn) {
            this.expiresIn = expiresIn;
            return this;
        }

        public Builder user(UserResponse user) {
            this.user = user;
            return this;
        }

        public LoginResponse build() {
            return new LoginResponse(accessToken, tokenType, expiresIn, user);
        }
    }
}
