package com.akashi.cinema;

import com.akashi.cinema.config.TimeConfig;
import com.akashi.cinema.entity.Promotion;
import com.akashi.cinema.enums.DiscountType;
import com.akashi.cinema.repository.PromotionRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MutableClock mutableClock;

    private LocalDateTime seedExpiryDate;
    private final List<Integer> createdTestPromoIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        // Lấy hạn của mã khuyến mãi số 1 (GIAM10) từ V2__seed_dev_data.sql
        Promotion firstSeedPromo = promotionRepository.findById(1).orElseThrow();
        seedExpiryDate = firstSeedPromo.getExpiryDate();
        // Đặt đồng hồ test vào thời điểm trước hạn của seed 10 ngày để test luôn ổn định theo thời gian
        mutableClock.setLocalDateTime(seedExpiryDate.minusDays(10));
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
                .andExpect(jsonPath("$[1].promoId").value(2))
                .andExpect(jsonPath("$[1].code").value("GIAM20K"))
                .andExpect(jsonPath("$[1].discountType").value("FIXED"))
                .andExpect(jsonPath("$[1].discountValue").value(20000))
                .andExpect(jsonPath("$[1].minOrderValue").value(150000))
                .andExpect(jsonPath("$[1].expiryDate").isNotEmpty())
                .andReturn();

        // Đảm bảo không lộ trường nội bộ (isActive, createdAt)
        String rawJson = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(rawJson).doesNotContain("isActive");
        assertThat(rawJson).doesNotContain("createdAt");
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

        // 2. Mã biên: expiryDate == now -> không còn hiệu lực (vì điều kiện là expiry_date > now) -> loại
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
                // Gồm validBoundaryPromo (hạn gần nhất) + 2 mã seed (GIAM10, GIAM20K) = 3 mã
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].promoId").value(validBoundaryPromo.getPromoId()))
                .andExpect(jsonPath("$[*].promoId", not(hasItem(expiredPromo.getPromoId()))))
                .andExpect(jsonPath("$[*].promoId", not(hasItem(exactBoundaryPromo.getPromoId()))))
                .andExpect(jsonPath("$[*].promoId", not(hasItem(inactivePromo.getPromoId()))));
    }

    @Test
    @DisplayName("3. Khi tất cả mã đều hết hạn (không có mã nào còn hiệu lực) trả 200 với mảng rỗng []")
    void getActivePromotions_WhenAllExpired_ReturnsEmptyArray() throws Exception {
        // Đặt thời gian hiện tại vượt qua hạn của toàn bộ mã trong seed
        mutableClock.setLocalDateTime(seedExpiryDate.plusYears(5));

        mockMvc.perform(get("/api/promotions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("4. Bảo mật: chỉ mở đúng GET /api/promotions/active; gọi GET /api/promotions hoặc POST /api/promotions không có token trả 401")
    void security_OnlyGetActivePromotionsIsPublic_OtherPromotionEndpointsRequireAuth() throws Exception {
        // GET /api/promotions (endpoint của ADMIN) không có token phải trả 401
        mockMvc.perform(get("/api/promotions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        // POST /api/promotions không có token phải trả 401
        mockMvc.perform(post("/api/promotions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}

