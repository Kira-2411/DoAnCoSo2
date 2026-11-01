package com.akashi.cinema.service;

import com.akashi.cinema.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendRegistrationOtp(String toEmail, String otpCode, int expiryMinutes) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(toEmail);
            message.setSubject("Mã xác thực đăng ký tài khoản - Akashi Cinema");
            message.setText("Chào bạn,\n\n"
                    + "Mã xác thực (OTP) đăng ký tài khoản Akashi Cinema của bạn là: " + otpCode + "\n"
                    + "Mã này có hiệu lực trong vòng " + expiryMinutes + " phút.\n"
                    + "Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n"
                    + "Trân trọng,\n"
                    + "Đội ngũ Akashi Cinema");
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to recipient: {}", maskEmail(toEmail), ex);
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_SEND_FAILED", "Không gửi được email, vui lòng thử lại sau");
        }
    }

    @Async
    public void sendPasswordResetOtp(String toEmail, String otpCode, int expiryMinutes) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(toEmail);
            message.setSubject("Mã đặt lại mật khẩu Akashi Cinema");
            message.setText("Chào bạn,\n\n"
                    + "Mã xác thực (OTP) đặt lại mật khẩu Akashi Cinema của bạn là: " + otpCode + "\n"
                    + "Mã này có hiệu lực trong vòng " + expiryMinutes + " phút.\n"
                    + "Vui lòng không chia sẻ mã này với bất kỳ ai.\n\n"
                    + "Trân trọng,\n"
                    + "Đội ngũ Akashi Cinema");
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send password reset OTP email to recipient: {}", maskEmail(toEmail), ex);
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        if (atIdx <= 1) return "*@" + email.substring(atIdx + 1);
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}
