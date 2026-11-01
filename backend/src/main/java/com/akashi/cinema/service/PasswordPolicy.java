package com.akashi.cinema.service;

import com.akashi.cinema.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class PasswordPolicy {

    /**
     * Kiểm tra độ an toàn của mật khẩu theo quy tắc BR-AUTH-02:
     * - Tối thiểu 8 ký tự, có ít nhất một chữ cái và một chữ số.
     * - Độ dài tối đa 72 bytes theo bảng mã UTF-8 (giới hạn an toàn của thuật toán băm BCrypt).
     *
     * @param password  Mật khẩu dạng văn bản thuần
     * @param fieldName Tên trường trong DTO ("password" hoặc "newPassword")
     */
    public void validate(String password, String fieldName) {
        if (password == null || password.length() < 8
                || !password.matches(".*[a-zA-Z].*")
                || !password.matches(".*\\d.*")) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Mật khẩu không đáp ứng yêu cầu",
                    Map.of(fieldName, "Mật khẩu phải có tối thiểu 8 ký tự, chứa ít nhất một chữ cái và một số")
            );
        }

        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Mật khẩu không đáp ứng yêu cầu",
                    Map.of(fieldName, "Mật khẩu quá dài")
            );
        }
    }
}

