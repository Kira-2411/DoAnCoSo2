package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.LoginRequest;
import com.akashi.cinema.dto.response.LoginResponse;
import com.akashi.cinema.dto.response.UserResponse;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.Role;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.UserRepository;
import com.akashi.cinema.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "12345678901234567890123456789012");
        ReflectionTestUtils.setField(jwtTokenProvider, "expiryMinutes", 60L);
        jwtTokenProvider.init();

        authService = new AuthService(userRepository, passwordEncoder, jwtTokenProvider);

        sampleUser = User.builder()
                .userId(1)
                .username("Nguyen Van A")
                .email("test@example.com")
                .passwordHash("$2a$10$realHashValueHereForTesting")
                .phone("0987654321")
                .role(Role.CUSTOMER)
                .isActive(true)
                .emailVerified(true)
                .build();
    }

    @Test
    @DisplayName("Đúng mật khẩu: Đăng nhập thành công và trả về token cùng thông tin user")
    void login_WithCorrectPassword_Success() {
        LoginRequest request = new LoginRequest("test@example.com", "CorrectPassword123");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("CorrectPassword123", sampleUser.getPasswordHash())).thenReturn(true);

        LoginResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotNull();
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getExpiresIn()).isEqualTo(3600L);
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getUserId()).isEqualTo(1);
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        assertThat(response.getUser().getRole()).isEqualTo(Role.CUSTOMER);

        // Verify token can be parsed and decoded by jwtTokenProvider
        assertThat(jwtTokenProvider.validateToken(response.getAccessToken())).isTrue();
        assertThat(jwtTokenProvider.getUserIdFromToken(response.getAccessToken())).isEqualTo(1);
        assertThat(jwtTokenProvider.getEmailFromToken(response.getAccessToken())).isEqualTo("test@example.com");
        assertThat(jwtTokenProvider.getRoleFromToken(response.getAccessToken())).isEqualTo("CUSTOMER");
    }

    @Test
    @DisplayName("Sai mật khẩu: Ném lỗi BAD_CREDENTIALS với status 401")
    void login_WithWrongPassword_ThrowsBadCredentials() {
        LoginRequest request = new LoginRequest("test@example.com", "WrongPassword");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", sampleUser.getPasswordHash())).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(ex.getCode()).isEqualTo("BAD_CREDENTIALS");
        assertThat(ex.getMessage()).isEqualTo("Email hoặc mật khẩu không đúng");
    }

    @Test
    @DisplayName("Email không tồn tại: Vẫn băm dummy hash để tránh lộ timing attack và ném BAD_CREDENTIALS")
    void login_WithNonExistentEmail_PerformsDummyHashAndThrowsBadCredentials() {
        LoginRequest request = new LoginRequest("unknown@example.com", "SomePassword");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(ex.getCode()).isEqualTo("BAD_CREDENTIALS");
        assertThat(ex.getMessage()).isEqualTo("Email hoặc mật khẩu không đúng");

        // Verify that dummy hash check was executed
        verify(passwordEncoder).matches(eq("SomePassword"), anyString());
    }

    @Test
    @DisplayName("Tài khoản bị khóa: Đúng mật khẩu nhưng ném lỗi ACCOUNT_LOCKED với status 403")
    void login_WithLockedAccount_ThrowsAccountLocked() {
        sampleUser.setIsActive(false);
        LoginRequest request = new LoginRequest("test@example.com", "CorrectPassword123");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("CorrectPassword123", sampleUser.getPasswordHash())).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ex.getCode()).isEqualTo("ACCOUNT_LOCKED");
        assertThat(ex.getMessage()).isEqualTo("Tài khoản đã bị khóa");
    }

    @Test
    @DisplayName("Email chưa xác thực: Đúng mật khẩu nhưng ném lỗi EMAIL_NOT_VERIFIED với status 403")
    void login_WithUnverifiedEmail_ThrowsEmailNotVerified() {
        sampleUser.setEmailVerified(false);
        LoginRequest request = new LoginRequest("test@example.com", "CorrectPassword123");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("CorrectPassword123", sampleUser.getPasswordHash())).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ex.getCode()).isEqualTo("EMAIL_NOT_VERIFIED");
        assertThat(ex.getMessage()).isEqualTo("Email chưa được xác thực");
    }

    @Test
    @DisplayName("Lấy thông tin người dùng hiện tại thành công")
    void getCurrentUser_Success() {
        when(userRepository.findById(1)).thenReturn(Optional.of(sampleUser));

        UserResponse response = authService.getCurrentUser(1);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1);
        assertThat(response.getUsername()).isEqualTo("Nguyen Van A");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Lấy thông tin người dùng hiện tại nhưng tài khoản bị khóa")
    void getCurrentUser_WhenLocked_ThrowsAccountLocked() {
        sampleUser.setIsActive(false);
        when(userRepository.findById(1)).thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () -> authService.getCurrentUser(1));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ex.getCode()).isEqualTo("ACCOUNT_LOCKED");
    }
}
