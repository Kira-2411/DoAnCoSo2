package com.akashi.cinema.entity;

import com.akashi.cinema.enums.OtpPurpose;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_otps")
public class EmailOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "otp_id")
    private Long otpId;

    @Column(name = "email", length = 150, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, columnDefinition = "ENUM('REGISTER', 'RESET_PASSWORD')")
    private OtpPurpose purpose;

    @Column(name = "code_hash", length = 255, nullable = false)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "attempts", nullable = false)
    private Integer attempts = 0;

    @Column(name = "used", nullable = false)
    private Boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public EmailOtp() {
    }

    public EmailOtp(Long otpId, String email, OtpPurpose purpose, String codeHash,
                    LocalDateTime expiresAt, Integer attempts, Boolean used, LocalDateTime createdAt) {
        this.otpId = otpId;
        this.email = email;
        this.purpose = purpose;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.attempts = attempts != null ? attempts : 0;
        this.used = used != null ? used : false;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getOtpId() {
        return otpId;
    }

    public void setOtpId(Long otpId) {
        this.otpId = otpId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public OtpPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(OtpPurpose purpose) {
        this.purpose = purpose;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public void setCodeHash(String codeHash) {
        this.codeHash = codeHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Boolean getUsed() {
        return used;
    }

    public void setUsed(Boolean used) {
        this.used = used;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class Builder {
        private Long otpId;
        private String email;
        private OtpPurpose purpose;
        private String codeHash;
        private LocalDateTime expiresAt;
        private Integer attempts = 0;
        private Boolean used = false;
        private LocalDateTime createdAt;

        public Builder otpId(Long otpId) {
            this.otpId = otpId;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder purpose(OtpPurpose purpose) {
            this.purpose = purpose;
            return this;
        }

        public Builder codeHash(String codeHash) {
            this.codeHash = codeHash;
            return this;
        }

        public Builder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public Builder attempts(Integer attempts) {
            this.attempts = attempts;
            return this;
        }

        public Builder used(Boolean used) {
            this.used = used;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public EmailOtp build() {
            return new EmailOtp(otpId, email, purpose, codeHash, expiresAt, attempts, used, createdAt);
        }
    }
}

