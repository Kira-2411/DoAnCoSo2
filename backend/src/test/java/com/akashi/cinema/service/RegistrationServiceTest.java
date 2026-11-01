package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.RegisterRequest;
import com.akashi.cinema.dto.request.ResendOtpRequest;
import com.akashi.cinema.dto.request.VerifyEmailRequest;
import com.akashi.cinema.dto.response.MessageResponse;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.OtpPurpose;
import com.akashi.cinema.enums.Role;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailService emailService;

    private RegistrationService registrationService;

    @BeforeEach
    void setUp() {
        registrationService = new RegistrationService(userRepository, passwordEncoder, otpService, emailService);
    }

    @Test
    @DisplayName("Đăng ký thành công: Tạo user CUSTOMER, email_verified=false, gửi OTP")
    void register_Success() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "Password123", "0901234567");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password123")).thenReturn("hashedPassword");
        when(otpService.generateAndSaveOtp("test@example.com", OtpPurpose.REGISTER)).thenReturn("123456");
        when(otpService.getExpiryMinutes()).thenReturn(5);

        MessageResponse response = registrationService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("Đăng ký thành công");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getUsername()).isEqualTo("Test User");
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
        assertThat(savedUser.getPasswordHash()).isEqualTo("hashedPassword");
        assertThat(savedUser.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(savedUser.getEmailVerified()).isFalse();
        assertThat(savedUser.getIsActive()).isTrue();

        verify(emailService).sendRegistrationOtp("test@example.com", "123456", 5);
    }

    @Test
    @DisplayName("Mật khẩu yếu khi đăng ký: Ném VALIDATION_ERROR kèm details.password")
    void register_WeakPassword_ThrowsValidationError() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "simple", null);

        AppException ex = assertThrows(AppException.class, () -> registrationService.register(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(ex.getDetails()).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) ex.getDetails();
        assertThat(details).containsKey("password");

        verify(userRepository, never()).save(any());
        verify(otpService, never()).generateAndSaveOtp(anyString(), any());
    }

    @Test
    @DisplayName("Email đã xác thực trùng: Ném lỗi 409 EMAIL_EXISTS")
    void register_AlreadyVerifiedEmail_ThrowsConflict() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "Password123", null);
        User verifiedUser = User.builder()
                .userId(1)
                .email("test@example.com")
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(verifiedUser));

        AppException ex = assertThrows(AppException.class, () -> registrationService.register(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(ex.getCode()).isEqualTo("EMAIL_EXISTS");

        verify(userRepository, never()).save(any());
        verify(otpService, never()).generateAndSaveOtp(anyString(), any());
    }

    @Test
    @DisplayName("Đăng ký lại khi chưa xác thực: Cập nhật thông tin, không làm đổi role, gửi OTP mới")
    void register_UnverifiedEmail_UpdatesUserAndSendsOtp() {
        RegisterRequest request = new RegisterRequest("New Name", "test@example.com", "NewPassword123", "0999888777");
        User unverifiedUser = User.builder()
                .userId(1)
                .username("Old Name")
                .email("test@example.com")
                .passwordHash("oldHash")
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(unverifiedUser));
        when(passwordEncoder.encode("NewPassword123")).thenReturn("newHash");
        when(otpService.generateAndSaveOtp("test@example.com", OtpPurpose.REGISTER)).thenReturn("654321");
        when(otpService.getExpiryMinutes()).thenReturn(5);

        MessageResponse response = registrationService.register(request);

        assertThat(response).isNotNull();
        assertThat(unverifiedUser.getUsername()).isEqualTo("New Name");
        assertThat(unverifiedUser.getPasswordHash()).isEqualTo("newHash");
        assertThat(unverifiedUser.getPhone()).isEqualTo("0999888777");
        assertThat(unverifiedUser.getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).save(unverifiedUser);
        verify(emailService).sendRegistrationOtp("test@example.com", "654321", 5);
    }

    @Test
    @DisplayName("Xác thực đúng: Đặt email_verified = true và lưu user")
    void verifyEmail_Success() {
        VerifyEmailRequest request = new VerifyEmailRequest("test@example.com", "123456");
        User user = User.builder()
                .userId(1)
                .email("test@example.com")
                .emailVerified(false)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        doNothing().when(otpService).verifyOtp("test@example.com", OtpPurpose.REGISTER, "123456");

        MessageResponse response = registrationService.verifyEmail(request);

        assertThat(response).isNotNull();
        assertThat(user.getEmailVerified()).isTrue();
        verify(userRepository).save(user);
        verify(otpService).verifyOtp("test@example.com", OtpPurpose.REGISTER, "123456");
    }

    @Test
    @DisplayName("verify-email với email không tồn tại: Trả lỗi INVALID_OTP (400)")
    void verifyEmail_NonExistentEmail_ThrowsInvalidOtp() {
        VerifyEmailRequest request = new VerifyEmailRequest("notfound@example.com", "123456");

        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> registrationService.verifyEmail(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getCode()).isEqualTo("INVALID_OTP");
        verify(otpService, never()).verifyOtp(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("verify-email với email đã xác thực: Trả lỗi INVALID_OTP (400)")
    void verifyEmail_AlreadyVerified_ThrowsInvalidOtp() {
        VerifyEmailRequest request = new VerifyEmailRequest("verified@example.com", "123456");
        User user = User.builder()
                .userId(1)
                .email("verified@example.com")
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("verified@example.com")).thenReturn(Optional.of(user));

        AppException ex = assertThrows(AppException.class, () -> registrationService.verifyEmail(request));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getCode()).isEqualTo("INVALID_OTP");
        verify(otpService, never()).verifyOtp(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("resend-otp với email không tồn tại: Trả 200 cùng thông báo chung, không gửi thư")
    void resendOtp_NonExistentEmail_Returns200GenericMessage() {
        ResendOtpRequest request = new ResendOtpRequest("notfound@example.com", OtpPurpose.REGISTER);

        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        MessageResponse response = registrationService.resendOtp(request);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("Nếu email hợp lệ và chưa xác thực");
        verify(emailService, never()).sendRegistrationOtp(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("resend-otp với email đã xác thực: Trả 200 cùng thông báo chung, không gửi thư")
    void resendOtp_AlreadyVerified_Returns200GenericMessage() {
        ResendOtpRequest request = new ResendOtpRequest("verified@example.com", OtpPurpose.REGISTER);
        User user = User.builder()
                .email("verified@example.com")
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("verified@example.com")).thenReturn(Optional.of(user));

        MessageResponse response = registrationService.resendOtp(request);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("Nếu email hợp lệ và chưa xác thực");
        verify(emailService, never()).sendRegistrationOtp(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("resend-otp với email chưa xác thực: Gửi OTP mới và trả 200")
    void resendOtp_Unverified_GeneratesAndSendsOtp() {
        ResendOtpRequest request = new ResendOtpRequest("unverified@example.com", OtpPurpose.REGISTER);
        User user = User.builder()
                .email("unverified@example.com")
                .emailVerified(false)
                .build();

        when(userRepository.findByEmail("unverified@example.com")).thenReturn(Optional.of(user));
        when(otpService.generateAndSaveOtp("unverified@example.com", OtpPurpose.REGISTER)).thenReturn("112233");
        when(otpService.getExpiryMinutes()).thenReturn(5);

        MessageResponse response = registrationService.resendOtp(request);

        assertThat(response).isNotNull();
        assertThat(response.getMessage()).contains("Nếu email hợp lệ và chưa xác thực");
        verify(emailService).sendRegistrationOtp("unverified@example.com", "112233", 5);
    }
}
