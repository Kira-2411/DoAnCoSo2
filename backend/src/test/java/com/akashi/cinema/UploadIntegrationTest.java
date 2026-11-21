package com.akashi.cinema;

import com.akashi.cinema.dto.response.UploadSignatureResponse;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.UserRepository;
import com.akashi.cinema.security.JwtTokenProvider;
import com.akashi.cinema.service.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "akashi.cloudinary.cloud-name=test-cloud",
        "akashi.cloudinary.api-key=test-key",
        "akashi.cloudinary.api-secret=test-secret"
})
@AutoConfigureMockMvc
class UploadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User adminUser;
    private User staffUser;
    private User customerUser;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findByEmail("admin@example.com").orElse(null);
        staffUser = userRepository.findByEmail("staff@example.com").orElse(null);
        customerUser = userRepository.findByEmail("customer@example.com").orElse(null);
    }

    @Test
    @DisplayName("1. Unit test thuật toán chữ ký SHA-1 khớp test vector chính thức của Cloudinary")
    void signatureAlgorithm_MatchesKnownTestVector() {
        // Test vector 1: Cloudinary official docs example
        // timestamp=1315060510 + api_secret="abcd" -> "a21ad0f63beb4de2e5575204b79ab90bffb02c10"
        String testInput1 = "timestamp=1315060510abcd";
        assertThat(CloudinaryService.sha1Hex(testInput1))
                .isEqualTo("a21ad0f63beb4de2e5575204b79ab90bffb02c10");

        // Test vector 2: With Akashi standard parameters sorted alphabetically
        // "allowed_formats=jpg,png,webp&folder=akashi/posters&timestamp=1700000000SECRET_THU"
        String testInput2 = "allowed_formats=jpg,png,webp&folder=akashi/posters&timestamp=1700000000SECRET_THU";
        assertThat(CloudinaryService.sha1Hex(testInput2))
                .isEqualTo("0f4ac359676b403249b1208a128c22a8f65d8413");
    }

    @Test
    @DisplayName("2. CloudinaryService: chưa cấu hình (thiếu 1 trong 3 biến) ném 503 CLOUDINARY_NOT_CONFIGURED")
    void generateSignature_WhenUnconfigured_Throws503() {
        CloudinaryService unconfigured = new CloudinaryService("", "my-key", "my-secret", "akashi/posters");
        assertThatThrownBy(unconfigured::generateSignature)
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(appEx.getCode()).isEqualTo("CLOUDINARY_NOT_CONFIGURED");
                    assertThat(appEx.getMessage()).isEqualTo("Chưa cấu hình lưu trữ ảnh");
                });
    }

    @Test
    @DisplayName("3. CloudinaryService: validateAndNormalizePosterUrl kiểm tra tiền tố https://res.cloudinary.com/<cloudName>/")
    void validatePosterUrl_ChecksCloudinaryPrefix() {
        CloudinaryService service = new CloudinaryService("akashi-cinema", "key", "secret", "akashi/posters");

        // Hợp lệ: null hoặc rỗng -> trả về null
        assertThat(service.validateAndNormalizePosterUrl(null)).isNull();
        assertThat(service.validateAndNormalizePosterUrl("  ")).isNull();

        // Hợp lệ: đúng tiền tố
        String validUrl = "https://res.cloudinary.com/akashi-cinema/image/upload/v1234/test.jpg";
        assertThat(service.validateAndNormalizePosterUrl(validUrl)).isEqualTo(validUrl);

        // Không hợp lệ: khác domain
        assertThatThrownBy(() -> service.validateAndNormalizePosterUrl("https://example.com/poster.jpg"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getCode()).isEqualTo("VALIDATION_ERROR");
                    Map<?, ?> details = (Map<?, ?>) appEx.getDetails();
                    assertThat(details.get("posterUrl")).isEqualTo("Đường dẫn ảnh không hợp lệ");
                });

        // Không hợp lệ: khác cloudName
        assertThatThrownBy(() -> service.validateAndNormalizePosterUrl("https://res.cloudinary.com/other-cloud/image/upload/test.jpg"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getCode()).isEqualTo("VALIDATION_ERROR");
                });
    }

    @Test
    @DisplayName("4. POST /api/uploads/signature không token trả 401 UNAUTHORIZED")
    void generateSignature_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(post("/api/uploads/signature"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("5. POST /api/uploads/signature với vai trò CUSTOMER hoặc STAFF trả 403 FORBIDDEN")
    void generateSignature_NonAdmin_Returns403() throws Exception {
        if (customerUser != null) {
            String customerToken = jwtTokenProvider.generateToken(customerUser);
            mockMvc.perform(post("/api/uploads/signature")
                            .header("Authorization", "Bearer " + customerToken))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }

        if (staffUser != null) {
            String staffToken = jwtTokenProvider.generateToken(staffUser);
            mockMvc.perform(post("/api/uploads/signature")
                            .header("Authorization", "Bearer " + staffToken))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }
    }

    @Test
    @DisplayName("6. POST /api/uploads/signature với ADMIN trả 200 kèm chữ ký và params, tuyệt đối không lộ apiSecret")
    void generateSignature_Admin_Returns200WithSignatureAndNoSecret() throws Exception {
        if (adminUser != null) {
            String adminToken = jwtTokenProvider.generateToken(adminUser);
            mockMvc.perform(post("/api/uploads/signature")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.cloudName").isNotEmpty())
                    .andExpect(jsonPath("$.apiKey").isNotEmpty())
                    .andExpect(jsonPath("$.uploadUrl").isNotEmpty())
                    .andExpect(jsonPath("$.signature").isNotEmpty())
                    .andExpect(jsonPath("$.params.allowed_formats").value("jpg,png,webp"))
                    .andExpect(jsonPath("$.params.folder").isNotEmpty())
                    .andExpect(jsonPath("$.params.timestamp").isNumber())
                    // Đảm bảo không lộ secret
                    .andExpect(jsonPath("$.apiSecret").doesNotExist())
                    .andExpect(jsonPath("$.secret").doesNotExist());
        }
    }
}
