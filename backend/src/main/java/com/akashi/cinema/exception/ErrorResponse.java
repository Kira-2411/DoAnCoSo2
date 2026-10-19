package com.akashi.cinema.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private int status;
    private String code;
    private String message;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private Object details;

    public ErrorResponse() {
    }

    public ErrorResponse(int status, String code, String message, LocalDateTime timestamp, Object details) {
        this.status = status;
        this.code = code;
        this.message = message;
        this.timestamp = timestamp;
        this.details = details;
    }

    public static Builder builder() {
        return new Builder();
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Object getDetails() {
        return details;
    }

    public void setDetails(Object details) {
        this.details = details;
    }

    public static class Builder {
        private int status;
        private String code;
        private String message;
        private LocalDateTime timestamp;
        private Object details;

        public Builder status(int status) {
            this.status = status;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder details(Object details) {
            this.details = details;
            return this;
        }

        public ErrorResponse build() {
            return new ErrorResponse(status, code, message, timestamp, details);
        }
    }
}
