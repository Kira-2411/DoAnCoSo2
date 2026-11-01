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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordPolicy passwordPolicy;

    @Autowired
    public RegistrationService(UserRepository userRepository,
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

    public RegistrationService(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               OtpService otpService,
                               EmailService emailService) {
        this(userRepository, passwordEncoder, otpService, emailService, new PasswordPolicy());
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword();

        // BR-AUTH-02: Mật khẩu tối thiểu 8 ký tự, có ít nhất một chữ và một số, tối đa 72 bytes UTF-8
        passwordPolicy.validate(password, "password");

        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (Boolean.TRUE.equals(existingUser.getEmailVerified())) {
                // Email đã xác thực -> 409 EMAIL_EXISTS
                throw new AppException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email đã tồn tại trên hệ thống");
            }

            // BR-AUTH-04: Đã đăng ký nhưng chưa xác thực -> Cập nhật thông tin và giữ nguyên role
            existingUser.setUsername(request.getUsername().trim());
            existingUser.setPasswordHash(passwordEncoder.encode(password));
            existingUser.setPhone(request.getPhone() != null && !request.getPhone().isBlank()
                    ? request.getPhone().trim()
                    : null);
            userRepository.save(existingUser);
        } else {
            // BR-AUTH-03 & BR-ROLE-03: Đăng ký mới luôn là CUSTOMER, email_verified = false
            User newUser = User.builder()
                    .username(request.getUsername().trim())
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .phone(request.getPhone() != null && !request.getPhone().isBlank()
                            ? request.getPhone().trim()
                            : null)
                    .role(Role.CUSTOMER)
                    .isActive(true)
                    .emailVerified(false)
                    .build();
            userRepository.save(newUser);
        }

        // Tạo mã OTP và gửi thư
        String rawOtp = otpService.generateAndSaveOtp(email, OtpPurpose.REGISTER);
        emailService.sendRegistrationOtp(email, rawOtp, otpService.getExpiryMinutes());

        return new MessageResponse("Đăng ký thành công. Vui lòng kiểm tra email để nhận mã xác thực.");
    }

    @Transactional(noRollbackFor = AppException.class)
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Nếu email không tồn tại hoặc đã xác thực thì trả đúng lỗi INVALID_OTP
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || Boolean.TRUE.equals(userOpt.get().getEmailVerified())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã xác thực không hợp lệ");
        }

        // Xác thực mã OTP (nếu sai thì attempts được lưu do noRollbackFor = AppException.class)
        otpService.verifyOtp(email, OtpPurpose.REGISTER, request.getCode().trim());

        // BR-AUTH-08: Xác thực thành công -> đặt email_verified = true
        User user = userOpt.get();
        user.setEmailVerified(true);
        userRepository.save(user);

        return new MessageResponse("Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.");
    }

    @Transactional
    public MessageResponse resendOtp(ResendOtpRequest request) {
        if (request.getPurpose() != OtpPurpose.REGISTER) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Chỉ hỗ trợ gửi lại mã xác thực cho mục đích REGISTER");
        }

        String email = request.getEmail().trim().toLowerCase();
        String genericMessage = "Nếu email hợp lệ và chưa xác thực, mã OTP đã được gửi.";

        Optional<User> userOpt = userRepository.findByEmail(email);
        // Email không tồn tại hoặc đã xác thực: trả thông báo chung, không gửi thư
        if (userOpt.isEmpty() || Boolean.TRUE.equals(userOpt.get().getEmailVerified())) {
            return new MessageResponse(genericMessage);
        }

        // Tạo mã OTP mới và gửi thư (áp dụng rate limiting trong OtpService)
        String rawOtp = otpService.generateAndSaveOtp(email, OtpPurpose.REGISTER);
        emailService.sendRegistrationOtp(email, rawOtp, otpService.getExpiryMinutes());

        return new MessageResponse(genericMessage);
    }
}
