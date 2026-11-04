package com.akashi.cinema;

import com.akashi.cinema.entity.Food;
import com.akashi.cinema.repository.FoodRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FoodIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Integer> createdTestFoodIds = new ArrayList<>();

    @AfterEach
    void tearDown() {
        for (Integer foodId : createdTestFoodIds) {
            jdbcTemplate.update("DELETE FROM foods WHERE food_id = ?", foodId);
        }
        createdTestFoodIds.clear();
    }

    private Food createUnavailableTestFood(String category) {
        Food unavailableFood = Food.builder()
                .name("Món Ngừng Bán Test")
                .price(50000L)
                .category(category)
                .img(null)
                .isAvailable(false)
                .build();
        Food saved = foodRepository.save(unavailableFood);
        createdTestFoodIds.add(saved.getFoodId());
        return saved;
    }

    @Test
    @DisplayName("1. GET /api/foods không filter (Public, không token): trả đúng 5 món đang bán từ V2 seed theo thứ tự foodId tăng dần")
    void getFoods_NoFilter_ReturnsAllAvailableSeedFoodsInOrder() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/foods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].foodId").value(1))
                .andExpect(jsonPath("$[0].name").value("Bắp ngọt (vừa)"))
                .andExpect(jsonPath("$[0].price").value(45000))
                .andExpect(jsonPath("$[0].category").value("Bắp"))
                .andExpect(jsonPath("$[0].img").value(nullValue()))
                .andExpect(jsonPath("$[1].foodId").value(2))
                .andExpect(jsonPath("$[1].name").value("Bắp phô mai (vừa)"))
                .andExpect(jsonPath("$[1].price").value(55000))
                .andExpect(jsonPath("$[1].category").value("Bắp"))
                .andExpect(jsonPath("$[2].foodId").value(3))
                .andExpect(jsonPath("$[2].name").value("Nước ngọt ly lớn"))
                .andExpect(jsonPath("$[2].price").value(30000))
                .andExpect(jsonPath("$[2].category").value("Nước"))
                .andExpect(jsonPath("$[3].foodId").value(4))
                .andExpect(jsonPath("$[3].name").value("Combo 1 bắp 1 nước"))
                .andExpect(jsonPath("$[3].price").value(65000))
                .andExpect(jsonPath("$[3].category").value("Combo"))
                .andExpect(jsonPath("$[4].foodId").value(5))
                .andExpect(jsonPath("$[4].name").value("Combo 2 bắp 2 nước"))
                .andExpect(jsonPath("$[4].price").value(120000))
                .andExpect(jsonPath("$[4].category").value("Combo"))
                .andReturn();

        // Kiểm tra raw JSON: price là số nguyên (45000) và trường "img":null hiện diện rõ ràng
        String rawJson = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(rawJson).contains("\"price\":45000");
        assertThat(rawJson).doesNotContain("\"price\":45000.00");
        assertThat(rawJson).contains("\"img\":null");
    }

    @Test
    @DisplayName("2. Món có isAvailable = false không xuất hiện trong kết quả (cả khi không lọc và khi lọc category)")
    void getFoods_UnavailableFood_IsExcluded() throws Exception {
        Food unavailableCombo = createUnavailableTestFood("Combo");

        mockMvc.perform(get("/api/foods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[*].foodId", not(hasItem(unavailableCombo.getFoodId()))));

        mockMvc.perform(get("/api/foods").param("category", "Combo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].foodId", not(hasItem(unavailableCombo.getFoodId()))));
    }

    @Test
    @DisplayName("3. Lọc theo category=Combo, category=Bắp, category=Nước (tiếng Việt có dấu) trả đúng nhóm và số lượng từ V2 seed")
    void getFoods_FilterByCategory_ReturnsMatchingSeedFoods() throws Exception {
        // category = Combo -> 2 món (foodId 4, 5)
        mockMvc.perform(get("/api/foods").param("category", "Combo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].foodId").value(4))
                .andExpect(jsonPath("$[0].name").value("Combo 1 bắp 1 nước"))
                .andExpect(jsonPath("$[0].category").value("Combo"))
                .andExpect(jsonPath("$[1].foodId").value(5))
                .andExpect(jsonPath("$[1].name").value("Combo 2 bắp 2 nước"))
                .andExpect(jsonPath("$[1].category").value("Combo"));

        // category = Bắp -> 2 món (foodId 1, 2)
        mockMvc.perform(get("/api/foods").param("category", "Bắp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].foodId").value(1))
                .andExpect(jsonPath("$[0].name").value("Bắp ngọt (vừa)"))
                .andExpect(jsonPath("$[0].category").value("Bắp"))
                .andExpect(jsonPath("$[1].foodId").value(2))
                .andExpect(jsonPath("$[1].name").value("Bắp phô mai (vừa)"))
                .andExpect(jsonPath("$[1].category").value("Bắp"));

        // category = Nước -> 1 món (foodId 3)
        mockMvc.perform(get("/api/foods").param("category", "Nước"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].foodId").value(3))
                .andExpect(jsonPath("$[0].name").value("Nước ngọt ly lớn"))
                .andExpect(jsonPath("$[0].price").value(30000))
                .andExpect(jsonPath("$[0].category").value("Nước"));
    }

    @Test
    @DisplayName("4. category không tồn tại trả 200 với mảng rỗng []")
    void getFoods_NonExistentCategory_Returns200WithEmptyArray() throws Exception {
        mockMvc.perform(get("/api/foods").param("category", "KhongTonTai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("5. Bảo mật: chỉ mở GET /api/foods/**, gọi POST /api/foods không có token trả 401 UNAUTHORIZED")
    void postFoods_WithoutToken_Returns401Unauthorized() throws Exception {
        mockMvc.perform(post("/api/foods"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}

