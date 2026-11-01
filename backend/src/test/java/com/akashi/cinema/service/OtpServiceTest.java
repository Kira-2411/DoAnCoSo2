package com.akashi.cinema.service;

import com.akashi.cinema.entity.EmailOtp;
import com.akashi.cinema.enums.OtpPurpose;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.EmailOtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private EmailOtpRepository emailOtpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService(emailOtpRepository, passwordEncoder);
        ReflectionTestUtils.setField(otpService, "expiryMinutes", 5);
        ReflectionTestUtils.setField(otpService, "maxAttempts", 5);
        ReflectionTestUtils.setField(otpService, "resendSeconds", 60);
        ReflectionTestUtils.setField(otpService, "maxPerHour", 5);
    }

    @Test
    @DisplayName("Sai mã OTP: Tăng attempts, lưu vào database và ném lỗi INVALID_OTP")
    void verifyOtp_WrongCode_IncrementsAttemptsAndSaves() {
        String email = "user@example.com";
        String rawCode = "111111";
        EmailOtp otp = EmailOtp.builder()
                .otpId(1L)
                .email(email)
                .purpose(OtpPurpose.REGISTER)
                .codeHash("hashed_value")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(1)
                .used(false)
                .build();

        when(emailOtpRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches(rawCode, "hashed_value")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () ->
                otpService.verifyOtp(email, OtpPurpose.REGISTER, rawCode));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getCode()).isEqualTo("INVALID_OTP");
        assertThat(otp.getAttempts()).isEqualTo(2);
        assertThat(otp.getUsed()).isFalse();
        verify(emailOtpRepository).save(otp);
    }

    @Test
    @DisplayName("Vượt quá số lần sai: Vô hiệu hóa mã (used = true) và ném lỗi INVALID_OTP")
    void verifyOtp_ExceedMaxAttempts_InvalidatesOtp() {
        String email = "user@example.com";
        String rawCode = "111111";
        EmailOtp otp = EmailOtp.builder()
                .otpId(1L)
                .email(email)
                .purpose(OtpPurpose.REGISTER)
                .codeHash("hashed_value")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(4)
                .used(false)
                .build();

        when(emailOtpRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches(rawCode, "hashed_value")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () ->
                otpService.verifyOtp(email, OtpPurpose.REGISTER, rawCode));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getCode()).isEqualTo("INVALID_OTP");
        assertThat(otp.getAttempts()).isEqualTo(5);
        assertThat(otp.getUsed()).isTrue();
        verify(emailOtpRepository).save(otp);
    }

    @Test
    @DisplayName("Mã hết hạn: Đánh dấu used = true và ném lỗi OTP_EXPIRED (400)")
    void verifyOtp_ExpiredCode_ThrowsOtpExpired() {
        String email = "user@example.com";
        String rawCode = "123456";
        EmailOtp otp = EmailOtp.builder()
                .otpId(1L)
                .email(email)
                .purpose(OtpPurpose.REGISTER)
                .codeHash("hashed_value")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .attempts(0)
                .used(false)
                .build();

        when(emailOtpRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(otp));

        AppException ex = assertThrows(AppException.class, () ->
                otpService.verifyOtp(email, OtpPurpose.REGISTER, rawCode));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getCode()).isEqualTo("OTP_EXPIRED");
        assertThat(otp.getUsed()).isTrue();
        verify(emailOtpRepository).save(otp);
    }

    @Test
    @DisplayName("Gửi lại quá sớm (< 60s): Ném lỗi TOO_MANY_REQUESTS (429)")
    void generateAndSaveOtp_ResendTooSoon_ThrowsTooManyRequests() {
        String email = "user@example.com";
        EmailOtp latestOtp = EmailOtp.builder()
                .createdAt(LocalDateTime.now().minusSeconds(20))
                .build();

        when(emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(eq(email), eq(OtpPurpose.REGISTER), any()))
                .thenReturn(1L);
        when(emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.of(latestOtp));

        AppException ex = assertThrows(AppException.class, () ->
                otpService.generateAndSaveOtp(email, OtpPurpose.REGISTER));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(ex.getCode()).isEqualTo("TOO_MANY_REQUESTS");
    }

    @Test
    @DisplayName("Vượt quá giới hạn mỗi giờ (>= 5): Ném lỗi TOO_MANY_REQUESTS (429)")
    void generateAndSaveOtp_HourlyLimitExceeded_ThrowsTooManyRequests() {
        String email = "user@example.com";

        when(emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(eq(email), eq(OtpPurpose.REGISTER), any()))
                .thenReturn(5L);

        AppException ex = assertThrows(AppException.class, () ->
                otpService.generateAndSaveOtp(email, OtpPurpose.REGISTER));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(ex.getCode()).isEqualTo("TOO_MANY_REQUESTS");
    }

    @Test
    @DisplayName("Tạo mã mới: Các mã cũ cùng email và purpose bị vô hiệu hóa (used = true)")
    void generateAndSaveOtp_InvalidatesOldOtps() {
        String email = "user@example.com";
        EmailOtp oldOtp1 = EmailOtp.builder().otpId(1L).used(false).build();
        EmailOtp oldOtp2 = EmailOtp.builder().otpId(2L).used(false).build();
        List<EmailOtp> oldList = new ArrayList<>(List.of(oldOtp1, oldOtp2));

        when(emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(eq(email), eq(OtpPurpose.REGISTER), any()))
                .thenReturn(0L);
        when(emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.REGISTER))
                .thenReturn(Optional.empty());
        when(emailOtpRepository.findByEmailAndPurposeAndUsedFalse(email, OtpPurpose.REGISTER))
                .thenReturn(oldList);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_new_code");

        String generatedCode = otpService.generateAndSaveOtp(email, OtpPurpose.REGISTER);

        assertThat(generatedCode).isNotNull().hasSize(6);
        assertThat(oldOtp1.getUsed()).isTrue();
        assertThat(oldOtp2.getUsed()).isTrue();
        verify(emailOtpRepository).saveAll(oldList);

        ArgumentCaptor<EmailOtp> captor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(captor.capture());
        EmailOtp savedOtp = captor.getValue();
        assertThat(savedOtp.getEmail()).isEqualTo(email);
        assertThat(savedOtp.getPurpose()).isEqualTo(OtpPurpose.REGISTER);
        assertThat(savedOtp.getCodeHash()).isEqualTo("hashed_new_code");
        assertThat(savedOtp.getUsed()).isFalse();
        assertThat(savedOtp.getAttempts()).isEqualTo(0);
    }
}

