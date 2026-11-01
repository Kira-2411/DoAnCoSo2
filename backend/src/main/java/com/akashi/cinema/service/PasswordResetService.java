package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.ResetPasswordRequest;
import com.akashi.cinema.dto.response.MessageResponse;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.OtpPurpose;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private static final String GENERIC_MESSAGE =
            "Nếu email tồn tại, mã OTP đã được gửi. Nếu bạn vừa yêu cầu, vui lòng chờ khoảng 1 phút trước khi thử lại.";

    // Chuỗi đầu vào giả lập để băm BCrypt khi email không hợp lệ
    private static final String DUMMY_HASH_INPUT = "AkashiCinema@DummyOtpHashForTimingDefense";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordPolicy passwordPolicy;

    public PasswordResetService(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                OtpService otpService,
                                EmailService emailService,
                                PasswordPolicy passwordPolicy) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.emailService = emailService;
        this.passwordPolicy = passwordPolicy;
    }

    // KHÔNG đặt @Transactional trên phương thức này:
    // OtpService.generateAndSaveOtp có @Transactional mặc định; nếu phương thức này cũng chạy
    // trong một transaction và bắt AppException (TOO_MANY_REQUESTS) để trả 200, transaction chung
    // sẽ bị đánh dấu rollback-only dẫn đến UnexpectedRollbackException (client nhận lỗi 500).
    // Để mỗi lời gọi repository/OtpService tự có transaction riêng.
    public MessageResponse forgotPassword(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(email);

        // BR-AUTH-14: Chỉ tạo OTP và gửi thư khi tài khoản tồn tại, email_verified = 1 và is_active = 1
        if (userOpt.isEmpty()
                || !Boolean.TRUE.equals(userOpt.get().getEmailVerified())
                || !Boolean.TRUE.equals(userOpt.get().getIsActive())) {
            // Giảm thiểu rủi ro timing attack: thực hiện một phép băm BCrypt giả lập trước khi trả về 200
            // để thời gian phản hồi xấp xỉ nhánh hợp lệ (vốn cần băm mã OTP 6 chữ số).
            // Lưu ý: đây chỉ là biện pháp giảm thiểu (mitigation), không phải bảo đảm tuyệt đối.
            passwordEncoder.encode(DUMMY_HASH_INPUT);
            return new MessageResponse(GENERIC_MESSAGE);
        }

        try {
            // Tạo mã OTP với purpose RESET_PASSWORD
            String rawOtp = otpService.generateAndSaveOtp(email, OtpPurpose.RESET_PASSWORD);
            // Gửi email bất đồng bộ qua proxy Spring (@Async trên EmailService)
            emailService.sendPasswordResetOtp(email, rawOtp, otpService.getExpiryMinutes());
        } catch (AppException ex) {
            if ("TOO_MANY_REQUESTS".equals(ex.getCode())) {
                log.info("Rate limit reached for forgot-password on email: {}", maskEmail(email));
                return new MessageResponse(GENERIC_MESSAGE);
            }
            throw ex;
        }

        return new MessageResponse(GENERIC_MESSAGE);
    }

    @Transactional(noRollbackFor = AppException.class)
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra newPassword theo BR-AUTH-02 TRƯỚC khi kiểm tra OTP.
        // Mật khẩu yếu trả 400 VALIDATION_ERROR kèm details.newPassword và KHÔNG tiêu hao OTP.
        passwordPolicy.validate(request.getNewPassword(), "newPassword");

        // 2. Email không tồn tại, chưa xác thực, hoặc bị khóa: trả INVALID_OTP (400) giống khi nhập sai mã
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()
                || !Boolean.TRUE.equals(userOpt.get().getEmailVerified())
                || !Boolean.TRUE.equals(userOpt.get().getIsActive())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực không hợp lệ");
        }

        // 3. Dùng OtpService.verifyOtp với purpose RESET_PASSWORD.
        // @Transactional(noRollbackFor = AppException.class) giúp attempts được commit lưu lại khi sai mã.
        otpService.verifyOtp(email, OtpPurpose.RESET_PASSWORD, request.getCode().trim());

        // 4. Thành công: lưu mật khẩu mới bằng BCrypt, không tự đăng nhập và không trả token
        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new MessageResponse("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        if (atIdx <= 1) return "*@" + email.substring(atIdx + 1);
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}

