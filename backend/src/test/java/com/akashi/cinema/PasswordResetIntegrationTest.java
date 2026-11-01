package com.akashi.cinema;

import com.akashi.cinema.dto.request.ForgotPasswordRequest;
import com.akashi.cinema.dto.request.LoginRequest;
import com.akashi.cinema.dto.request.RegisterRequest;
import com.akashi.cinema.dto.request.ResetPasswordRequest;
import com.akashi.cinema.entity.EmailOtp;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.OtpPurpose;
import com.akashi.cinema.enums.Role;
import com.akashi.cinema.repository.EmailOtpRepository;
import com.akashi.cinema.repository.UserRepository;
import com.akashi.cinema.service.EmailService;
import com.akashi.cinema.service.RegistrationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PasswordResetIntegrationTest {

    private static final String GENERIC_MESSAGE =
            "Nếu email tồn tại, mã OTP đã được gửi. Nếu bạn vừa yêu cầu, vui lòng chờ khoảng 1 phút trước khi thử lại.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private EmailService emailService;

    private final Set<String> testEmails = Collections.synchronizedSet(new HashSet<>());

    private String createTestEmail() {
        String email = UUID.randomUUID() + "@test.invalid";
        testEmails.add(email);
        return email;
    }

    private User createVerifiedUser(String email, String rawPassword) {
        User user = User.builder()
                .username("Test User")
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .isActive(true)
                .build();
        return userRepository.save(user);
    }

    @AfterEach
    void tearDown() {
        for (String email : testEmails) {
            jdbcTemplate.update("DELETE FROM email_otps WHERE email = ?", email);
            jdbcTemplate.update("DELETE FROM users WHERE email = ?", email);
        }
        testEmails.clear();
    }

    @Test
    @DisplayName("(a) forgot-password với tài khoản đã xác thực: 200, có 1 dòng email_otps purpose RESET_PASSWORD, EmailService gọi đúng 1 lần")
    void testA_ForgotPassword_VerifiedAccount_Success() throws Exception {
        String email = createTestEmail();
        createVerifiedUser(email, "OldPassword123");

        ForgotPasswordRequest request = new ForgotPasswordRequest(email);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));

        long count = emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(email, OtpPurpose.RESET_PASSWORD, LocalDateTime.now().minusMinutes(1));
        assertThat(count).isEqualTo(1);

        verify(emailService, timeout(3000).times(1)).sendPasswordResetOtp(eq(email), anyString(), eq(5));
    }

    @Test
    @DisplayName("(b) forgot-password với email lạ, chưa xác thực, bị khóa: cùng 200, cùng thông báo, không có OTP mới, không gửi thư")
    void testB_ForgotPassword_InvalidAccounts_Returns200GenericMessageAndNoEmail() throws Exception {
        // 1. Email lạ (không tồn tại)
        String nonExistentEmail = createTestEmail();
        ForgotPasswordRequest req1 = new ForgotPasswordRequest(nonExistentEmail);
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));

        // 2. Email chưa xác thực (email_verified = false)
        String unverifiedEmail = createTestEmail();
        User unverifiedUser = User.builder()
                .username("Unverified User")
                .email(unverifiedEmail)
                .passwordHash(passwordEncoder.encode("Password123"))
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .isActive(true)
                .build();
        userRepository.save(unverifiedUser);

        ForgotPasswordRequest req2 = new ForgotPasswordRequest(unverifiedEmail);
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));

        // 3. Tài khoản bị khóa (is_active = false)
        String lockedEmail = createTestEmail();
        User lockedUser = User.builder()
                .username("Locked User")
                .email(lockedEmail)
                .passwordHash(passwordEncoder.encode("Password123"))
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .isActive(false)
                .build();
        userRepository.save(lockedUser);

        ForgotPasswordRequest req3 = new ForgotPasswordRequest(lockedEmail);
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));

        // Kiểm tra không có OTP nào được tạo cho 3 email này
        assertThat(emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(nonExistentEmail, OtpPurpose.RESET_PASSWORD, LocalDateTime.now().minusMinutes(5))).isZero();
        assertThat(emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(unverifiedEmail, OtpPurpose.RESET_PASSWORD, LocalDateTime.now().minusMinutes(5))).isZero();
        assertThat(emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(lockedEmail, OtpPurpose.RESET_PASSWORD, LocalDateTime.now().minusMinutes(5))).isZero();

        // Kiểm tra EmailService không được gọi cho bất kỳ trường hợp nào trong số này
        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("(c) Gọi forgot-password lần hai trong 60 giây: vẫn 200, không gửi thư thứ hai")
    void testC_ForgotPassword_SecondCallWithinResendWindow_Returns200AndNoSecondEmail() throws Exception {
        String email = createTestEmail();
        createVerifiedUser(email, "Password123");

        ForgotPasswordRequest request = new ForgotPasswordRequest(email);

        // Lần 1: gửi thành công
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));

        verify(emailService, timeout(3000).times(1)).sendPasswordResetOtp(eq(email), anyString(), eq(5));

        // Lần 2 (ngay lập tức): vẫn trả 200 cùng thông báo chung
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));

        // Thư vẫn chỉ được gửi đúng 1 lần (không gửi thêm lần 2)
        verify(emailService, times(1)).sendPasswordResetOtp(eq(email), anyString(), anyInt());
    }

    @Test
    @DisplayName("(d) reset-password sai mã: 400 INVALID_OTP và attempts == 1 trong DB")
    void testD_ResetPassword_WrongCode_Returns400AndIncrementsAttempts() throws Exception {
        String email = createTestEmail();
        createVerifiedUser(email, "OldPassword123");

        // Yêu cầu OTP
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(email))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000)).sendPasswordResetOtp(eq(email), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();
        String wrongOtp = realOtp.equals("000000") ? "111111" : "000000";

        ResetPasswordRequest resetRequest = new ResetPasswordRequest(email, wrongOtp, "NewPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_OTP"));

        EmailOtp otp = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.RESET_PASSWORD).orElseThrow();
        assertThat(otp.getAttempts()).isEqualTo(1);
        assertThat(otp.getUsed()).isFalse();
    }

    @Test
    @DisplayName("(e) reset-password với mật khẩu yếu: 400 VALIDATION_ERROR, OTP vẫn used=false và attempts=0, nhập lại mật khẩu mạnh vẫn thành công")
    void testE_ResetPassword_WeakPassword_DoesNotConsumeOtp_ThenStrongPasswordSucceeds() throws Exception {
        String email = createTestEmail();
        createVerifiedUser(email, "OldPassword123");

        // Yêu cầu OTP
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(email))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000)).sendPasswordResetOtp(eq(email), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();

        // 1. Nhập mật khẩu yếu (chỉ có chữ, thiếu số)
        ResetPasswordRequest weakReq = new ResetPasswordRequest(email, realOtp, "WeakPassword");
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.newPassword").isNotEmpty());

        // Kiểm tra OTP không bị tiêu hao (attempts == 0, used == false)
        EmailOtp otpAfterWeak = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.RESET_PASSWORD).orElseThrow();
        assertThat(otpAfterWeak.getAttempts()).isZero();
        assertThat(otpAfterWeak.getUsed()).isFalse();

        // 2. Nhập lại mật khẩu mạnh với cùng mã OTP đó -> Thành công!
        ResetPasswordRequest strongReq = new ResetPasswordRequest(email, realOtp, "StrongPassword123");
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(strongReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."));

        EmailOtp otpAfterSuccess = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.RESET_PASSWORD).orElseThrow();
        assertThat(otpAfterSuccess.getUsed()).isTrue();
    }

    @Test
    @DisplayName("(f) reset thành công: login bằng mật khẩu mới trả 200, bằng mật khẩu cũ trả 401")
    void testF_ResetSuccess_LoginWithNewPassword200_OldPassword401() throws Exception {
        String email = createTestEmail();
        String oldPassword = "OldPassword123";
        String newPassword = "NewPassword123";
        createVerifiedUser(email, oldPassword);

        // Yêu cầu OTP
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(email))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000)).sendPasswordResetOtp(eq(email), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();

        // Reset password
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(email, realOtp, newPassword))))
                .andExpect(status().isOk());

        // Login mật khẩu cũ -> 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, oldPassword))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"));

        // Login mật khẩu mới -> 200
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("(g) dùng lại mã đã dùng: INVALID_OTP")
    void testG_ReuseUsedOtp_ReturnsInvalidOtp() throws Exception {
        String email = createTestEmail();
        createVerifiedUser(email, "OldPassword123");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(email))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000)).sendPasswordResetOtp(eq(email), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();

        // Dùng lần 1 -> 200
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(email, realOtp, "NewPassword123"))))
                .andExpect(status().isOk());

        // Dùng lại lần 2 -> 400 INVALID_OTP
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(email, realOtp, "AnotherPassword123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_OTP"));
    }

    @Test
    @DisplayName("(h) mã REGISTER không dùng được cho reset-password")
    void testH_RegisterOtp_CannotBeUsedForResetPassword() throws Exception {
        String email = createTestEmail();
        // Đăng ký tạo OTP mục đích REGISTER
        RegisterRequest registerRequest = new RegisterRequest("User H", email, "Password123", "0901234567");
        registrationService.register(registerRequest);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000)).sendRegistrationOtp(eq(email), otpCaptor.capture(), eq(5));
        String registerOtp = otpCaptor.getValue();

        // Dùng mã REGISTER để gọi reset-password
        ResetPasswordRequest resetRequest = new ResetPasswordRequest(email, registerOtp, "NewPassword123");
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_OTP"));
    }

    @Test
    @DisplayName("(i) reset-password với email lạ: INVALID_OTP")
    void testI_ResetPassword_NonExistentEmail_ReturnsInvalidOtp() throws Exception {
        String nonExistentEmail = createTestEmail();
        ResetPasswordRequest resetRequest = new ResetPasswordRequest(nonExistentEmail, "123456", "NewPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_OTP"));
    }

    @Test
    @DisplayName("(j) forgot-password khi OtpService báo vượt giới hạn trả 200 thông báo chung (không 500)")
    void testJ_ForgotPassword_RateLimitExceeded_Returns200GenericMessage() throws Exception {
        String email = createTestEmail();
        createVerifiedUser(email, "Password123");

        // Gọi lần 1 thành công
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(email))))
                .andExpect(status().isOk());

        // Gọi ngay lập tức lần 2 (vượt giới hạn resend-seconds): trả 200 (không bị 500 do transaction rollback-only)
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").doesNotExist()) // nghĩa là không trả ErrorResponse (HTTP status 200)
                .andExpect(jsonPath("$.message").value(GENERIC_MESSAGE));
    }

    @Test
    @DisplayName("(k) đăng ký hoặc reset với mật khẩu hợp lệ ký tự nhưng dài hơn 72 byte UTF-8 trả 400 VALIDATION_ERROR 'Mật khẩu quá dài'")
    void testK_PasswordExceeds72BytesUtf8_Returns400ValidationError() throws Exception {
        String email = createTestEmail();
        // "Pass123" + 30 chữ "ệ" (30 x 3 byte = 90 byte, tổng cộng 97 byte UTF-8, độ dài 37 ký tự nên pass @Size(max=72))
        String longUtf8Password = "Pass123" + "ệ".repeat(30);

        // 1. Thử đăng ký với mật khẩu dài hơn 72 bytes
        RegisterRequest registerReq = new RegisterRequest("Test User", email, longUtf8Password, null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.password").value("Mật khẩu quá dài"));

        // 2. Thử reset mật khẩu với mật khẩu dài hơn 72 bytes
        createVerifiedUser(email, "OldPassword123");
        ResetPasswordRequest resetReq = new ResetPasswordRequest(email, "123456", longUtf8Password);
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.newPassword").value("Mật khẩu quá dài"));
    }
}

