package com.akashi.cinema.service;

import com.akashi.cinema.entity.EmailOtp;
import com.akashi.cinema.enums.OtpPurpose;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.EmailOtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OtpService {

    private final EmailOtpRepository emailOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${akashi.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${akashi.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${akashi.otp.resend-seconds:60}")
    private int resendSeconds;

    @Value("${akashi.otp.max-per-hour:5}")
    private int maxPerHour;

    public OtpService(EmailOtpRepository emailOtpRepository, PasswordEncoder passwordEncoder) {
        this.emailOtpRepository = emailOtpRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public int getExpiryMinutes() {
        return expiryMinutes;
    }

    @Transactional
    public String generateAndSaveOtp(String email, OtpPurpose purpose) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Kiểm tra giới hạn số mã trong vòng 1 giờ
        LocalDateTime oneHourAgo = now.minusHours(1);
        long countLastHour = emailOtpRepository.countByEmailAndPurposeAndCreatedAtAfter(email, purpose, oneHourAgo);
        if (countLastHour >= maxPerHour) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_REQUESTS",
                    "Bạn đã vượt quá số lần yêu cầu mã OTP trong 1 giờ. Vui lòng thử lại sau.");
        }

        // 2. Kiểm tra giãn cách giữa 2 lần gửi liên tiếp (resend-seconds)
        Optional<EmailOtp> latestOtp = emailOtpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose);
        if (latestOtp.isPresent()) {
            long secondsSinceLast = Duration.between(latestOtp.get().getCreatedAt(), now).getSeconds();
            if (secondsSinceLast < resendSeconds) {
                long waitSeconds = resendSeconds - secondsSinceLast;
                throw new AppException(HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_REQUESTS",
                        String.format("Vui lòng chờ %d giây trước khi yêu cầu mã mới", waitSeconds));
            }
        }

        // 3. Vô hiệu hóa các mã cũ cùng email và purpose chưa dùng
        List<EmailOtp> oldActiveOtps = emailOtpRepository.findByEmailAndPurposeAndUsedFalse(email, purpose);
        for (EmailOtp oldOtp : oldActiveOtps) {
            oldOtp.setUsed(true);
        }
        if (!oldActiveOtps.isEmpty()) {
            emailOtpRepository.saveAll(oldActiveOtps);
        }

        // 4. Tạo mã ngẫu nhiên 6 chữ số
        String rawCode = String.format("%06d", secureRandom.nextInt(1_000_000));

        // 5. Băm mã và lưu vào database (createdAt được gán rõ ràng từ JVM)
        EmailOtp newOtp = EmailOtp.builder()
                .email(email)
                .purpose(purpose)
                .codeHash(passwordEncoder.encode(rawCode))
                .createdAt(now)
                .expiresAt(now.plusMinutes(expiryMinutes))
                .attempts(0)
                .used(false)
                .build();
        emailOtpRepository.save(newOtp);

        return rawCode;
    }

    // Tránh bị đánh dấu rollback-only khi ném AppException, để attempts và used được lưu xuống DB
    @Transactional(noRollbackFor = AppException.class)
    public void verifyOtp(String email, OtpPurpose purpose, String rawCode) {
        // Dùng phương thức có khóa bi quan để đồng bộ các request song song
        Optional<EmailOtp> otpOpt = emailOtpRepository.findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose);
        if (otpOpt.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực không hợp lệ");
        }

        EmailOtp otp = otpOpt.get();

        // Kiểm tra nếu đã vượt số lần thử sai
        if (otp.getAttempts() >= maxAttempts) {
            otp.setUsed(true);
            emailOtpRepository.save(otp);
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực không hợp lệ");
        }

        // Kiểm tra hạn sử dụng
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otp.setUsed(true);
            emailOtpRepository.save(otp);
            throw new AppException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "Mã xác thực đã hết hạn");
        }

        // Kiểm tra mã nhập vào
        if (!passwordEncoder.matches(rawCode, otp.getCodeHash())) {
            int newAttempts = otp.getAttempts() + 1;
            otp.setAttempts(newAttempts);
            if (newAttempts >= maxAttempts) {
                otp.setUsed(true);
            }
            emailOtpRepository.save(otp);
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực không hợp lệ");
        }

        // Đúng mã -> đánh dấu đã dùng
        otp.setUsed(true);
        emailOtpRepository.save(otp);
    }
}
