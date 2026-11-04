package com.akashi.cinema;

import com.akashi.cinema.entity.News;
import com.akashi.cinema.repository.NewsRepository;
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
import java.time.LocalDateTime;
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
class NewsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Integer> createdTestNewsIds = new ArrayList<>();

    @AfterEach
    void tearDown() {
        for (Integer newsId : createdTestNewsIds) {
            jdbcTemplate.update("DELETE FROM news WHERE news_id = ?", newsId);
        }
        createdTestNewsIds.clear();
    }

    @Test
    @DisplayName("1. GET /api/news (Public, không token): trả đúng 2 bài từ V2 seed, sắp xếp createdAt DESC, newsId DESC")
    void getNews_DefaultPagination_ReturnsSeedNewsOrderedNewestFirst() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].newsId").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Ưu đãi cuối tuần cho thành viên"))
                .andExpect(jsonPath("$.content[0].content").value("Nhập mã GIAM10 để được giảm 10% cho đơn từ 100.000đ."))
                .andExpect(jsonPath("$.content[0].imageUrl").value(nullValue()))
                .andExpect(jsonPath("$.content[0].createdAt").isNotEmpty())
                .andExpect(jsonPath("$.content[1].newsId").value(1))
                .andExpect(jsonPath("$.content[1].title").value("Khai trương Akashi Cinema"))
                .andExpect(jsonPath("$.content[1].content").value("Akashi Cinema chính thức mở cửa với hai phòng chiếu hiện đại."))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(rawJson).contains("\"imageUrl\":null");
    }

    @Test
    @DisplayName("2. Bài viết có createdAt mới hơn luôn xếp trước bài cũ")
    void getNews_NewerArticle_IsPlacedFirst() throws Exception {
        News newerNews = News.builder()
                .title("Tin Mới Nhất Hôm Nay")
                .content("Nội dung bài viết mới nhất.")
                .imageUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg")
                .build();
        News saved = newsRepository.save(newerNews);
        createdTestNewsIds.add(saved.getNewsId());

        // Đảm bảo created_at của bài mới lớn hơn seed
        jdbcTemplate.update("UPDATE news SET created_at = ? WHERE news_id = ?",
                LocalDateTime.of(2030, 1, 1, 10, 0, 0), saved.getNewsId());

        mockMvc.perform(get("/api/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].newsId").value(saved.getNewsId()))
                .andExpect(jsonPath("$.content[0].title").value("Tin Mới Nhất Hôm Nay"))
                .andExpect(jsonPath("$.content[0].imageUrl").value("https://res.cloudinary.com/demo/image/upload/sample.jpg"));
    }

    @Test
    @DisplayName("3. Phân trang page/size hoạt động đúng và trang vượt quá dữ liệu trả content rỗng")
    void getNews_PaginationAndOutOfBoundsPage_WorksCorrectly() throws Exception {
        // Trang 0, size 1 -> bài newsId = 2
        mockMvc.perform(get("/api/news")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].newsId").value(2));

        // Trang 1, size 1 -> bài newsId = 1
        mockMvc.perform(get("/api/news")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].newsId").value(1));

        // Trang vượt quá dữ liệu (page = 5) -> content rỗng []
        mockMvc.perform(get("/api/news")
                        .param("page", "5")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(5))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    @DisplayName("4. Tham số page âm hoặc size <= 0 hoặc size > 50 trả 400 VALIDATION_ERROR")
    void getNews_InvalidPaginationParams_Returns400ValidationError() throws Exception {
        mockMvc.perform(get("/api/news").param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/news").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/news").param("size", "51"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("5. GET /api/news/{id} trả 200 khi tồn tại và 404 khi không tồn tại")
    void getNewsById_ExistingAndNonExisting_Returns200Or404() throws Exception {
        mockMvc.perform(get("/api/news/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newsId").value(1))
                .andExpect(jsonPath("$.title").value("Khai trương Akashi Cinema"));

        mockMvc.perform(get("/api/news/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("6. Bảo mật: chỉ mở GET /api/news/**, gọi POST /api/news không kèm token trả 401 UNAUTHORIZED")
    void postNews_WithoutToken_Returns401Unauthorized() throws Exception {
        mockMvc.perform(post("/api/news"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}

