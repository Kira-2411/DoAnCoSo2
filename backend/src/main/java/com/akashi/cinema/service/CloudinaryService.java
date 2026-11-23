package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.UploadSignatureResponse;
import com.akashi.cinema.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CloudinaryService {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String postersFolder;

    public CloudinaryService(
            @Value("${akashi.cloudinary.cloud-name:}") String cloudName,
            @Value("${akashi.cloudinary.api-key:}") String apiKey,
            @Value("${akashi.cloudinary.api-secret:}") String apiSecret,
            @Value("${akashi.cloudinary.posters-folder:akashi/posters}") String postersFolder
    ) {
        this.cloudName = cloudName != null ? cloudName.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.apiSecret = apiSecret != null ? apiSecret.trim() : "";
        this.postersFolder = (postersFolder != null && !postersFolder.isBlank()) ? postersFolder.trim() : "akashi/posters";
    }

    public boolean isConfigured() {
        return !cloudName.isEmpty() && !apiKey.isEmpty() && !apiSecret.isEmpty();
    }

    public String getCloudName() {
        return cloudName;
    }

    public UploadSignatureResponse generateSignature() {
        if (!isConfigured()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "CLOUDINARY_NOT_CONFIGURED", "Chưa cấu hình lưu trữ ảnh");
        }

        long timestamp = Instant.now().getEpochSecond();
        String allowedFormats = "jpg,png,webp";

        // Sort parameters alphabetically by key: allowed_formats -> folder -> timestamp
        String stringToSign = "allowed_formats=" + allowedFormats
                + "&folder=" + postersFolder
                + "&timestamp=" + timestamp
                + apiSecret;

        String signature = sha1Hex(stringToSign);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("allowed_formats", allowedFormats);
        params.put("folder", postersFolder);
        params.put("timestamp", timestamp);

        return UploadSignatureResponse.builder()
                .cloudName(cloudName)
                .apiKey(apiKey)
                .uploadUrl("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload")
                .signature(signature)
                .params(params)
                .build();
    }

    public String validateAndNormalizePosterUrl(String posterUrl) {
        if (posterUrl == null || posterUrl.isBlank()) {
            return null;
        }

        String trimmed = posterUrl.trim();

        if (cloudName.isEmpty()) {
            Map<String, String> details = Map.of("posterUrl", "Đường dẫn ảnh không hợp lệ");
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Đường dẫn ảnh không hợp lệ", details);
        }

        String expectedPrefix = "https://res.cloudinary.com/" + cloudName + "/";
        if (!trimmed.startsWith(expectedPrefix)) {
            Map<String, String> details = Map.of("posterUrl", "Đường dẫn ảnh không hợp lệ");
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Đường dẫn ảnh không hợp lệ", details);
        }

        return trimmed;
    }

    public String validateAndNormalizeFoodImageUrl(String img) {
        if (img == null || img.isBlank()) {
            return null;
        }

        String trimmed = img.trim();

        if (cloudName.isEmpty()) {
            Map<String, String> details = Map.of("img", "Đường dẫn ảnh không hợp lệ");
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Đường dẫn ảnh không hợp lệ", details);
        }

        String expectedPrefix = "https://res.cloudinary.com/" + cloudName + "/";
        if (!trimmed.startsWith(expectedPrefix)) {
            Map<String, String> details = Map.of("img", "Đường dẫn ảnh phải thuộc Cloudinary của hệ thống");
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Đường dẫn ảnh không hợp lệ", details);
        }

        return trimmed;
    }

    public static String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 algorithm not available", e);
        }
    }
}
