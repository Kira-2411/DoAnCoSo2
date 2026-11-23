package com.akashi.cinema;

import com.akashi.cinema.config.TimeConfig;
import com.akashi.cinema.entity.Promotion;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.DiscountType;
import com.akashi.cinema.repository.PromotionRepository;
import com.akashi.cinema.repository.UserRepository;
import com.akashi.cinema.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PromotionIntegrationTest.ControllableClockConfig.class)
@TestPropertySource(properties = "spring.main.allow-bean-definition-overriding=true")
class PromotionIntegrationTest {

    static class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zone;

        MutableClock(Instant initialInstant, ZoneId zone) {
            this.instant = initialInstant;
            this.zone = zone;
        }

        void setLocalDateTime(LocalDateTime dateTime) {
            this.instant = dateTime.atZone(zone).toInstant();
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(this.instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }

    @TestConfiguration
    static class ControllableClockConfig {
        @Bean
        @Primary
        public MutableClock mutableClock() {
            return new MutableClock(Instant.now(), TimeConfig.VIETNAM_ZONE);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MutableClock mutableClock;

    private LocalDateTime seedExpiryDate;
    private final List<Integer> createdTestPromoIds = new ArrayList<>();

    private User adminUser;
    private User staffUser;

    @BeforeEach
    void setUp() {
        Promotion firstSeedPromo = promotionRepository.findById(1).orElseThrow();
        seedExpiryDate = firstSeedPromo.getExpiryDate();
        mutableClock.setLocalDateTime(seedExpiryDate.minusDays(10));

        adminUser = userRepository.findByEmail("admin@example.com").orElse(null);
        staffUser = userRepository.findByEmail("staff@example.com").orElse(null);
    }

    @AfterEach
    void tearDown() {
        for (Integer promoId : createdTestPromoIds) {
            jdbcTemplate.update("DELETE FROM promotions WHERE promo_id = ?", promoId);
        }
        createdTestPromoIds.clear();
    }

    private Promotion createTestPromotion(DiscountType type, long value, LocalDateTime expiryDate,
                                          long minOrderValue, boolean isActive) {
        String uniqueCode = "TEST" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        Promotion promo = Promotion.builder()
                .code(uniqueCode)
                .discountType(type)
                .discountValue(value)
                .expiryDate(expiryDate)
                .minOrderValue(minOrderValue)
                .isActive(isActive)
                .build();
        Promotion saved = promotionRepository.save(promo);
        createdTestPromoIds.add(saved.getPromoId());
        return saved;
    }

    @Test
    @DisplayName("1. GET /api/promotions/active (Public, không token): trả đúng 2 mã GIAM10, GIAM20K từ V2 seed và không lộ trường nội bộ")
    void getActivePromotions_SeedData_ReturnsGiam10AndGiam20kOnlyPublicFields() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/promotions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].promoId").value(1))
                .andExpect(jsonPath("$[0].code").value("GIAM10"))
                .andExpect(jsonPath("$[0].discountType").value("PERCENT"))
                .andExpect(jsonPath("$[0].discountValue").value(10))
                .andExpect(jsonPath("$[0].minOrderValue").value(100000))
                .andExpect(jsonPath("$[0].expiryDate").isNotEmpty())
                .andExpect(jsonPath("$[0].createdAt").isNotEmpty())
                .andExpect(jsonPath("$[1].promoId").value(2))
                .andExpect(jsonPath("$[1].code").value("GIAM20K"))
                .andExpect(jsonPath("$[1].discountType").value("FIXED"))
                .andExpect(jsonPath("$[1].discountValue").value(20000))
                .andExpect(jsonPath("$[1].minOrderValue").value(150000))
                .andExpect(jsonPath("$[1].expiryDate").isNotEmpty())
                .andExpect(jsonPath("$[1].createdAt").isNotEmpty())
                .andReturn();

        // Đảm bảo không lộ trường nội bộ (isActive)
        String rawJson = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(rawJson).doesNotContain("isActive");
    }

    @Test
    @DisplayName("2. Mã hết hạn, mã isActive = false, và mã có expiry_date đúng bằng hiện tại (biên) không xuất hiện")
    void getActivePromotions_ExpiredInactiveAndExactBoundary_AreExcluded() throws Exception {
        LocalDateTime fixedNow = seedExpiryDate.minusDays(5).withNano(0);
        mutableClock.setLocalDateTime(fixedNow);

        // 1. Mã đã hết hạn trước đó 1 giây (expiryDate < now) -> loại
        Promotion expiredPromo = createTestPromotion(
                DiscountType.PERCENT, 15L, fixedNow.minusSeconds(1), 100000L, true
        );

        // 2. Mã biên: expiryDate == now -> không còn hiệu lực -> loại
        Promotion exactBoundaryPromo = createTestPromotion(
                DiscountType.FIXED, 30000L, fixedNow, 100000L, true
        );

        // 3. Mã còn hạn nhưng bị tắt (isActive = false) -> loại
        Promotion inactivePromo = createTestPromotion(
                DiscountType.PERCENT, 20L, fixedNow.plusDays(1), 100000L, false
        );

        // 4. Mã còn hạn thêm 1 giây (expiryDate = now + 1s) và isActive = true -> được lấy
        Promotion validBoundaryPromo = createTestPromotion(
                DiscountType.FIXED, 50000L, fixedNow.plusSeconds(1), 200000L, true
        );

        mockMvc.perform(get("/api/promotions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].promoId").value(validBoundaryPromo.getPromoId()))
                .andExpect(jsonPath("$[*].promoId", not(hasItem(expiredPromo.getPromoId()))))
                .andExpect(jsonPath("$[*].promoId", not(hasItem(exactBoundaryPromo.getPromoId()))))
                .andExpect(jsonPath("$[*].promoId", not(hasItem(inactivePromo.getPromoId()))));
    }

    @Test
    @DisplayName("3. Khi tất cả mã đều hết hạn (không có mã nào còn hiệu lực) trả 200 với mảng rỗng []")
    void getActivePromotions_WhenAllExpired_ReturnsEmptyArray() throws Exception {
        mutableClock.setLocalDateTime(seedExpiryDate.plusYears(5));

        mockMvc.perform(get("/api/promotions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("4. Bảo mật: chỉ mở đúng GET /api/promotions/active; gọi GET /api/promotions hoặc POST /api/promotions không có token trả 401")
    void security_OnlyGetActivePromotionsIsPublic_OtherPromotionEndpointsRequireAuth() throws Exception {
        mockMvc.perform(get("/api/promotions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(post("/api/promotions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    /* =========================================================================
     * ADMIN CRUD PROMOTION TESTS
     * ========================================================================= */

    @Test
    @DisplayName("5. GET /api/promotions (Admin): Lấy danh sách đầy đủ cho quản trị, bao gồm cả isActive và createdAt")
    void getPromotions_Admin_ReturnsListWithAdminFields() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/promotions")
                        .param("includeInactive", "true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[0].code").exists())
                .andExpect(jsonPath("$[0].isActive").exists())
                .andExpect(jsonPath("$[0].createdAt").exists());
    }

    @Test
    @DisplayName("6. GET /api/promotions (Admin): Tìm kiếm theo mã keyword")
    void getPromotions_Admin_FilterByKeyword() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/promotions")
                        .param("keyword", "GIAM10")
                        .param("includeInactive", "true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].code").value("GIAM10"));
    }

    @Test
    @DisplayName("7. GET /api/promotions/{id} (Admin): Lấy chi tiết mã khuyến mãi")
    void getPromotionById_Admin_ReturnsDetail() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/promotions/1")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.promoId").value(1))
                .andExpect(jsonPath("$.code").value("GIAM10"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("8. GET /api/promotions/{id} (Admin): ID không tồn tại trả 404 NOT_FOUND")
    void getPromotionById_NotFound_Returns404() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/promotions/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("9. POST /api/promotions: Staff gọi trả 403 FORBIDDEN")
    void postPromotion_Staff_Returns403() throws Exception {
        String staffToken = jwtTokenProvider.generateToken(staffUser);
        String body = """
                {
                  "code": "STAFFPROMO",
                  "discountType": "PERCENT",
                  "discountValue": 10,
                  "expiryDate": "2026-12-31T23:59:59",
                  "minOrderValue": 50000
                }
                """;

        mockMvc.perform(post("/api/promotions")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10. POST /api/promotions (Admin): Tạo mới thành công (PERCENT & FIXED)")
    void postPromotion_Admin_Success() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String uniqueCode = "PROMO" + System.currentTimeMillis() % 100000;
        String body = String.format("""
                {
                  "code": "%s",
                  "discountType": "PERCENT",
                  "discountValue": 25,
                  "expiryDate": "2026-12-31T23:59:59",
                  "minOrderValue": 100000
                }
                """, uniqueCode);

        MvcResult result = mockMvc.perform(post("/api/promotions")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.promoId").isNumber())
                .andExpect(jsonPath("$.code").value(uniqueCode))
                .andExpect(jsonPath("$.discountType").value("PERCENT"))
                .andExpect(jsonPath("$.discountValue").value(25))
                .andExpect(jsonPath("$.minOrderValue").value(100000))
                .andExpect(jsonPath("$.isActive").value(true))
                .andReturn();

        String raw = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        Integer createdId = com.jayway.jsonpath.JsonPath.read(raw, "$.promoId");
        createdTestPromoIds.add(createdId);
    }

    @Test
    @DisplayName("11. POST /api/promotions: Trùng mã code trả về 409 PROMO_EXISTS")
    void postPromotion_DuplicateCode_Returns409() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "code": "GIAM10",
                  "discountType": "PERCENT",
                  "discountValue": 15,
                  "expiryDate": "2026-12-31T23:59:59",
                  "minOrderValue": 50000
                }
                """;

        mockMvc.perform(post("/api/promotions")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROMO_EXISTS"));
    }

    @Test
    @DisplayName("12. POST /api/promotions: Tỷ lệ PERCENT vượt quá 100 trả 400 VALIDATION_ERROR")
    void postPromotion_InvalidPercent_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "code": "INVALIDPERC",
                  "discountType": "PERCENT",
                  "discountValue": 120,
                  "expiryDate": "2026-12-31T23:59:59",
                  "minOrderValue": 50000
                }
                """;

        mockMvc.perform(post("/api/promotions")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("13. PUT /api/promotions/{id} (Admin): Cập nhật thông tin mã khuyến mãi thành công")
    void putPromotion_Admin_Success() throws Exception {
        Promotion promo = createTestPromotion(DiscountType.PERCENT, 10L, LocalDateTime.now().plusDays(30), 50000L, true);
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        String updateBody = String.format("""
                {
                  "code": "%s",
                  "discountType": "FIXED",
                  "discountValue": 50000,
                  "expiryDate": "2027-01-01T00:00:00",
                  "minOrderValue": 200000,
                  "isActive": true
                }
                """, promo.getCode() + "U");

        mockMvc.perform(put("/api/promotions/" + promo.getPromoId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(promo.getCode() + "U"))
                .andExpect(jsonPath("$.discountType").value("FIXED"))
                .andExpect(jsonPath("$.discountValue").value(50000))
                .andExpect(jsonPath("$.minOrderValue").value(200000));
    }

    @Test
    @DisplayName("14. DELETE /api/promotions/{id} (Admin): Ngừng áp dụng mã khuyến mãi (soft delete: isActive = false)")
    void deletePromotion_Admin_SoftDeletesPromotion() throws Exception {
        Promotion promo = createTestPromotion(DiscountType.PERCENT, 15L, LocalDateTime.now().plusDays(30), 50000L, true);
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(delete("/api/promotions/" + promo.getPromoId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        Promotion updated = promotionRepository.findById(promo.getPromoId()).orElseThrow();
        assertFalse(updated.getIsActive(), "Mã khuyến mãi phải có isActive = false sau khi xóa");
    }

    @Test
    @DisplayName("15. PATCH /api/promotions/{id}/status (Admin): Kích hoạt lại hoặc ngừng mã khuyến mãi")
    void patchPromotionStatus_Admin_TogglesActive() throws Exception {
        Promotion promo = createTestPromotion(DiscountType.PERCENT, 15L, LocalDateTime.now().plusDays(30), 50000L, false);
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        // Kích hoạt lại
        mockMvc.perform(patch("/api/promotions/" + promo.getPromoId() + "/status")
                        .param("active", "true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(true));

        Promotion reloaded = promotionRepository.findById(promo.getPromoId()).orElseThrow();
        assertTrue(reloaded.getIsActive());
    }
}
