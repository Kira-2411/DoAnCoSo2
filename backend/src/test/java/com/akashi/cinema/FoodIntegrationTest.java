package com.akashi.cinema;

import com.akashi.cinema.entity.Food;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.repository.FoodRepository;
import com.akashi.cinema.repository.UserRepository;
import com.akashi.cinema.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "akashi.cloudinary.cloud-name=test-cloud",
        "akashi.cloudinary.api-key=test-key",
        "akashi.cloudinary.api-secret=test-secret"
})
@AutoConfigureMockMvc
class FoodIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Integer> createdTestFoodIds = new ArrayList<>();

    private User adminUser;
    private User staffUser;
    private User customerUser;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("UPDATE foods SET is_available = 1 WHERE food_id <= 5");
        jdbcTemplate.update("DELETE FROM booking_foods WHERE food_id > 5");
        jdbcTemplate.update("DELETE FROM foods WHERE food_id > 5");

        adminUser = userRepository.findByEmail("admin@example.com").orElse(null);
        staffUser = userRepository.findByEmail("staff@example.com").orElse(null);
        customerUser = userRepository.findByEmail("customer@example.com").orElse(null);
    }

    @AfterEach
    void tearDown() {
        for (Integer foodId : createdTestFoodIds) {
            jdbcTemplate.update("DELETE FROM booking_foods WHERE food_id = ?", foodId);
            jdbcTemplate.update("DELETE FROM foods WHERE food_id = ?", foodId);
        }
        createdTestFoodIds.clear();
    }

    @Test
    @DisplayName("1. GET /api/foods (Public): Trả về danh sách món đang bán")
    void getFoods_Public_ReturnsAvailableFoods() throws Exception {
        mockMvc.perform(get("/api/foods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].foodId").isNumber())
                .andExpect(jsonPath("$[0].name").isString())
                .andExpect(jsonPath("$[0].price").isNumber())
                .andExpect(jsonPath("$[0].isAvailable").value(true));
    }

    @Test
    @DisplayName("2. GET /api/foods: Lọc theo danh mục và từ khóa")
    void getFoods_FilterByCategoryAndKeyword_ReturnsFilteredList() throws Exception {
        mockMvc.perform(get("/api/foods")
                        .param("category", "Bắp")
                        .param("keyword", "phô mai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Bắp phô mai (vừa)"));
    }

    @Test
    @DisplayName("3. GET /api/foods: Khách vãng lai truyền includeUnavailable=true vẫn chỉ nhận món đang bán")
    void getFoods_AnonymousIncludeUnavailable_IgnoresFlag() throws Exception {
        // Tạo một món ngừng bán
        Food stoppedFood = Food.builder()
                .name("Món Đã Ngừng Bán")
                .price(30000L)
                .category("Bắp")
                .isAvailable(false)
                .build();
        stoppedFood = foodRepository.save(stoppedFood);
        createdTestFoodIds.add(stoppedFood.getFoodId());

        mockMvc.perform(get("/api/foods")
                        .param("includeUnavailable", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].foodId", not(hasItem(stoppedFood.getFoodId()))));
    }

    @Test
    @DisplayName("4. GET /api/foods: Admin truyền includeUnavailable=true nhận cả món đã ngừng bán")
    void getFoods_AdminIncludeUnavailable_ReturnsAllFoods() throws Exception {
        Food stoppedFood = Food.builder()
                .name("Món Đã Ngừng Bán")
                .price(30000L)
                .category("Bắp")
                .isAvailable(false)
                .build();
        stoppedFood = foodRepository.save(stoppedFood);
        createdTestFoodIds.add(stoppedFood.getFoodId());

        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/foods")
                        .param("includeUnavailable", "true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].foodId", hasItem(stoppedFood.getFoodId())));
    }

    @Test
    @DisplayName("5. POST /api/foods: Chưa đăng nhập trả 401 UNAUTHORIZED")
    void postFood_Unauthorized_Returns401() throws Exception {
        String body = """
                {
                  "name": "Bắp Caramels",
                  "price": 50000,
                  "category": "POPCORN"
                }
                """;

        mockMvc.perform(post("/api/foods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("6. POST /api/foods: Quyền STAFF trả 403 FORBIDDEN")
    void postFood_StaffRole_Returns403() throws Exception {
        String staffToken = jwtTokenProvider.generateToken(staffUser);
        String body = """
                {
                  "name": "Bắp Caramels",
                  "price": 50000,
                  "category": "POPCORN"
                }
                """;

        mockMvc.perform(post("/api/foods")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("7. POST /api/foods (ADMIN): Thêm món thành công (201 CREATED)")
    void postFood_Admin_Success() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "name": "Bắp Rang Phô Mai Đặc Biệt",
                  "price": 65000,
                  "category": "POPCORN",
                  "img": "https://res.cloudinary.com/test-cloud/image/upload/v1/popcorn.jpg",
                  "isAvailable": true
                }
                """;

        String res = mockMvc.perform(post("/api/foods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foodId").isNumber())
                .andExpect(jsonPath("$.name").value("Bắp Rang Phô Mai Đặc Biệt"))
                .andExpect(jsonPath("$.price").value(65000))
                .andExpect(jsonPath("$.category").value("POPCORN"))
                .andExpect(jsonPath("$.img").value("https://res.cloudinary.com/test-cloud/image/upload/v1/popcorn.jpg"))
                .andExpect(jsonPath("$.isAvailable").value(true))
                .andReturn().getResponse().getContentAsString();

        Integer foodId = com.jayway.jsonpath.JsonPath.read(res, "$.foodId");
        createdTestFoodIds.add(foodId);

        assertTrue(foodRepository.findById(foodId).isPresent());
    }

    @Test
    @DisplayName("8. POST /api/foods: Dữ liệu không hợp lệ (tên rỗng, giá âm) trả 400 VALIDATION_ERROR")
    void postFood_InvalidData_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "name": "",
                  "price": -10000
                }
                """;

        mockMvc.perform(post("/api/foods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("9. POST /api/foods: Ảnh không thuộc Cloudinary trả 400 VALIDATION_ERROR")
    void postFood_InvalidImageUrl_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "name": "Bắp Hạt Dẻ",
                  "price": 55000,
                  "category": "POPCORN",
                  "img": "https://unsafe-site.com/fake.jpg"
                }
                """;

        mockMvc.perform(post("/api/foods")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.img").exists());
    }

    @Test
    @DisplayName("10. PUT /api/foods/{id} (ADMIN): Sửa món ăn thành công")
    void putFood_Admin_Success() throws Exception {
        Food food = Food.builder()
                .name("Món Trước Khi Sửa")
                .price(40000L)
                .category("DRINK")
                .isAvailable(true)
                .build();
        food = foodRepository.save(food);
        createdTestFoodIds.add(food.getFoodId());

        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String updateBody = """
                {
                  "name": "Món Sau Khi Sửa Đổi",
                  "price": 45000,
                  "category": "DRINK",
                  "img": "https://res.cloudinary.com/test-cloud/image/upload/drink.jpg",
                  "isAvailable": false
                }
                """;

        mockMvc.perform(put("/api/foods/" + food.getFoodId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Món Sau Khi Sửa Đổi"))
                .andExpect(jsonPath("$.price").value(45000))
                .andExpect(jsonPath("$.isAvailable").value(false));

        Food updated = foodRepository.findById(food.getFoodId()).orElseThrow();
        assertFalse(updated.getIsAvailable());
    }

    @Test
    @DisplayName("11. PUT /api/foods/{id}: ID không tồn tại trả 404 NOT_FOUND")
    void putFood_NotFound_Returns404() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String updateBody = """
                {
                  "name": "Món Không Tồn Tại",
                  "price": 50000
                }
                """;

        mockMvc.perform(put("/api/foods/999999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("12. DELETE /api/foods/{id} (ADMIN): Ngừng bán món ăn (soft delete, 204 No Content)")
    void deleteFood_Admin_SoftDeletesFood() throws Exception {
        Food food = Food.builder()
                .name("Món Thử Nghiệm Ngừng Bán")
                .price(50000L)
                .category("COMBO")
                .isAvailable(true)
                .build();
        food = foodRepository.save(food);
        createdTestFoodIds.add(food.getFoodId());

        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(delete("/api/foods/" + food.getFoodId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Kiểm tra cơ sở dữ liệu: bản ghi vẫn còn, nhưng isAvailable = false (BR-FOOD-01)
        Food check = foodRepository.findById(food.getFoodId()).orElseThrow();
        assertFalse(check.getIsAvailable());
    }

    @Test
    @DisplayName("13. DELETE /api/foods/{id}: Quyền STAFF trả 403 FORBIDDEN")
    void deleteFood_Staff_Returns403() throws Exception {
        String staffToken = jwtTokenProvider.generateToken(staffUser);

        mockMvc.perform(delete("/api/foods/1")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("14. DELETE /api/foods/{id}: ID không tồn tại trả 404 NOT_FOUND")
    void deleteFood_NotFound_Returns404() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(delete("/api/foods/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
