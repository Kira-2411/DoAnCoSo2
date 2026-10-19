package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.LoginRequest;
import com.akashi.cinema.dto.response.LoginResponse;
import com.akashi.cinema.dto.response.UserResponse;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.UserRepository;
import com.akashi.cinema.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    // Dummy BCrypt hash to prevent timing attacks when email does not exist
    private static final String DUMMY_BCRYPT_HASH = "$2a$10$wT0lVl8q7bO3I3m7g8zFqOMYm.lVv1lB1zLz6mN1rR9B7hA9V6Oey";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // Constant-time check: still calculate BCrypt hash to avoid disclosing email existence
            passwordEncoder.matches(request.getPassword(), DUMMY_BCRYPT_HASH);
            throw new AppException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Email hoặc mật khẩu không đúng");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Email hoặc mật khẩu không đúng");
        }

        // BR-AUTH-10: Only when password is correct, check account status
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new AppException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Email chưa được xác thực");
        }

        // BR-AUTH-11: Generate JWT containing userId and role
        String token = jwtTokenProvider.generateToken(user);
        long expiresIn = jwtTokenProvider.getExpirySeconds();

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .user(UserResponse.from(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa");
        }

        return UserResponse.from(user);
    }
}
