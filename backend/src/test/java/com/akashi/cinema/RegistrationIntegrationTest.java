package com.akashi.cinema;

import com.akashi.cinema.dto.request.RegisterRequest;
import com.akashi.cinema.dto.request.VerifyEmailRequest;
import com.akashi.cinema.entity.EmailOtp;
import com.akashi.cinema.enums.OtpPurpose;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.EmailOtpRepository;
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
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RegistrationIntegrationTest {

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmailService emailService;

    private final Set<String> testEmails = Collections.synchronizedSet(new HashSet<>());

    private String createTestEmail() {
        String email = UUID.randomUUID() + "@test.invalid";
        testEmails.add(email);
        return email;
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
    @DisplayName("(a) Nhập sai mã: Bắt AppException INVALID_OTP, repository đọc lại thấy attempts == 1")
    void testA_WrongCode_IncrementsAttemptsAndPersists() {
        String testEmail = createTestEmail();
        RegisterRequest registerRequest = new RegisterRequest("User A", testEmail, "Password123", "0901234567");
        registrationService.register(registerRequest);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendRegistrationOtp(eq(testEmail), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();
        String wrongOtp = realOtp.equals("000000") ? "111111" : "000000";

        VerifyEmailRequest verifyRequest = new VerifyEmailRequest(testEmail, wrongOtp);
        AppException ex = assertThrows(AppException.class, () -> registrationService.verifyEmail(verifyRequest));
        assertThat(ex.getCode()).isEqualTo("INVALID_OTP");

        EmailOtp otp = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.REGISTER).orElseThrow();
        assertThat(otp.getAttempts()).isEqualTo(1);
        assertThat(otp.getUsed()).isFalse();
    }

    @Test
    @DisplayName("(b) Nhập sai tới maxAttempts: used == true, sau đó nhập mã đúng vẫn bị từ chối")
    void testB_ExceedMaxAttempts_InvalidatesOtpAndRejectsCorrectCode() {
        String testEmail = createTestEmail();
        RegisterRequest registerRequest = new RegisterRequest("User B", testEmail, "Password123", "0901234567");
        registrationService.register(registerRequest);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendRegistrationOtp(eq(testEmail), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();
        String wrongOtp = realOtp.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            VerifyEmailRequest verifyRequest = new VerifyEmailRequest(testEmail, wrongOtp);
            assertThrows(AppException.class, () -> registrationService.verifyEmail(verifyRequest));
        }

        EmailOtp otp = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.REGISTER).orElseThrow();
        assertThat(otp.getAttempts()).isEqualTo(5);
        assertThat(otp.getUsed()).isTrue();

        VerifyEmailRequest correctRequest = new VerifyEmailRequest(testEmail, realOtp);
        AppException ex = assertThrows(AppException.class, () -> registrationService.verifyEmail(correctRequest));
        assertThat(ex.getCode()).isEqualTo("INVALID_OTP");
    }

    @Test
    @DisplayName("(c) expiresAt trừ createdAt xấp xỉ 5 phút (sai số tối đa 10 giây)")
    void testC_ExpiresAtDiffersFromCreatedAtByApprox5Minutes() {
        String testEmail = createTestEmail();
        RegisterRequest registerRequest = new RegisterRequest("User C", testEmail, "Password123", null);
        registrationService.register(registerRequest);

        EmailOtp otp = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.REGISTER).orElseThrow();
        Duration duration = Duration.between(otp.getCreatedAt(), otp.getExpiresAt());
        long diffSeconds = Math.abs(duration.getSeconds() - 300);
        assertThat(diffSeconds).isLessThanOrEqualTo(10);
    }

    @Test
    @DisplayName("(e) Chạy song song: 12 luồng cùng nhập sai mã, attempts == maxAttempts (5), used == true, không dính lỗi ngoài AppException")
    void testE_ConcurrentWrongAttempts_StrictlyReachesMaxAttempts() throws Exception {
        String testEmail = createTestEmail();
        RegisterRequest registerRequest = new RegisterRequest("User E", testEmail, "Password123", null);
        registrationService.register(registerRequest);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendRegistrationOtp(eq(testEmail), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();
        String wrongOtp = realOtp.equals("000000") ? "111111" : "000000";

        int threadCount = 12;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<Throwable>> results = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            results.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await();
                try {
                    registrationService.verifyEmail(new VerifyEmailRequest(testEmail, wrongOtp));
                    return null;
                } catch (Throwable t) {
                    return t;
                }
            }));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        for (Future<Throwable> f : results) {
            Throwable thrown = f.get(10, TimeUnit.SECONDS);
            assertThat(thrown)
                    .withFailMessage("Mong đợi AppException nhưng nhận được: " + thrown)
                    .isInstanceOf(AppException.class);
        }

        executor.shutdown();

        EmailOtp otp = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(testEmail, OtpPurpose.REGISTER).orElseThrow();
        assertThat(otp.getAttempts()).isEqualTo(5);
        assertThat(otp.getUsed()).isTrue();
    }

    @Test
    @DisplayName("(f) Qua HTTP: POST /api/auth/register rồi POST /api/auth/verify-email với mã sai, trả 400 INVALID_OTP (không phải 500)")
    void testF_HttpWrongCode_Returns400InvalidOtp() throws Exception {
        String testEmail = createTestEmail();
        RegisterRequest registerRequest = new RegisterRequest("User F", testEmail, "Password123", "0901234567");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendRegistrationOtp(eq(testEmail), otpCaptor.capture(), eq(5));
        String realOtp = otpCaptor.getValue();
        String wrongOtp = realOtp.equals("000000") ? "111111" : "000000";

        VerifyEmailRequest verifyRequest = new VerifyEmailRequest(testEmail, wrongOtp);

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("INVALID_OTP"));
    }
}

