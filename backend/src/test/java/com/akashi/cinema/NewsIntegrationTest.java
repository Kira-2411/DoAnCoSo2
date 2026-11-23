package com.akashi.cinema;

import com.akashi.cinema.entity.News;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.repository.NewsRepository;
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
class NewsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Integer> createdTestNewsIds = new ArrayList<>();

    private User adminUser;
    private User staffUser;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM news WHERE news_id > 2");

        adminUser = userRepository.findByEmail("admin@example.com").orElse(null);
        staffUser = userRepository.findByEmail("staff@example.com").orElse(null);
    }

    @AfterEach
    void tearDown() {
        for (Integer newsId : createdTestNewsIds) {
            jdbcTemplate.update("DELETE FROM news WHERE news_id = ?", newsId);
        }
        createdTestNewsIds.clear();
    }

    @Test
    @DisplayName("1. GET /api/news (Public): Trả về danh sách tin tức phân trang")
    void getNews_Public_ReturnsPagedNews() throws Exception {
        mockMvc.perform(get("/api/news")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", not(empty())))
                .andExpect(jsonPath("$.content[0].newsId").isNumber())
                .andExpect(jsonPath("$.content[0].title").isString())
                .andExpect(jsonPath("$.content[0].content").isString())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("2. GET /api/news: Lọc theo từ khóa tìm kiếm")
    void getNews_FilterByKeyword_ReturnsFilteredList() throws Exception {
        News testNews = News.builder()
                .title("Special Festival Announcement")
                .content("Announcement details here")
                .build();
        testNews = newsRepository.save(testNews);
        createdTestNewsIds.add(testNews.getNewsId());

        mockMvc.perform(get("/api/news")
                        .param("keyword", "Festival"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].title", containsString("Festival")));
    }

    @Test
    @DisplayName("3. GET /api/news/{id} (Public): Lấy chi tiết bài viết")
    void getNewsById_Public_ReturnsNewsDetail() throws Exception {
        mockMvc.perform(get("/api/news/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newsId").value(1))
                .andExpect(jsonPath("$.title").exists())
                .andExpect(jsonPath("$.content").exists());
    }

    @Test
    @DisplayName("4. GET /api/news/{id}: ID không tồn tại trả 404 NOT_FOUND")
    void getNewsById_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/news/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("5. POST /api/news: Chưa đăng nhập trả 401 UNAUTHORIZED")
    void postNews_Unauthorized_Returns401() throws Exception {
        String body = """
                {
                  "title": "Sự kiện giao lưu đạo diễn",
                  "content": "Nội dung sự kiện chi tiết..."
                }
                """;

        mockMvc.perform(post("/api/news")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("6. POST /api/news: Quyền STAFF trả 403 FORBIDDEN")
    void postNews_StaffRole_Returns403() throws Exception {
        String staffToken = jwtTokenProvider.generateToken(staffUser);
        String body = """
                {
                  "title": "Sự kiện giao lưu đạo diễn",
                  "content": "Nội dung sự kiện chi tiết..."
                }
                """;

        mockMvc.perform(post("/api/news")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("7. POST /api/news (ADMIN): Đăng bài viết mới thành công (201 CREATED)")
    void postNews_Admin_Success() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "title": "Đại tiệc phim Anime mùa lễ hội",
                  "content": "Akashi Cinema tổ chức tuần lễ phim Anime đặc sắc với nhiều phần quà hấp dẫn.",
                  "imageUrl": "https://res.cloudinary.com/test-cloud/image/upload/v1/anime-fest.jpg"
                }
                """;

        String res = mockMvc.perform(post("/api/news")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.newsId").isNumber())
                .andExpect(jsonPath("$.title").value("Đại tiệc phim Anime mùa lễ hội"))
                .andExpect(jsonPath("$.content").value("Akashi Cinema tổ chức tuần lễ phim Anime đặc sắc với nhiều phần quà hấp dẫn."))
                .andExpect(jsonPath("$.imageUrl").value("https://res.cloudinary.com/test-cloud/image/upload/v1/anime-fest.jpg"))
                .andExpect(jsonPath("$.img").value("https://res.cloudinary.com/test-cloud/image/upload/v1/anime-fest.jpg"))
                .andReturn().getResponse().getContentAsString();

        Integer newsId = com.jayway.jsonpath.JsonPath.read(res, "$.newsId");
        createdTestNewsIds.add(newsId);

        assertTrue(newsRepository.findById(newsId).isPresent());
    }

    @Test
    @DisplayName("8. POST /api/news: Dữ liệu rỗng trả 400 VALIDATION_ERROR")
    void postNews_InvalidData_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "title": "",
                  "content": ""
                }
                """;

        mockMvc.perform(post("/api/news")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("9. POST /api/news: Ảnh không thuộc Cloudinary trả 400 VALIDATION_ERROR")
    void postNews_InvalidImageUrl_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String body = """
                {
                  "title": "Tin tức thử nghiệm",
                  "content": "Nội dung bài viết...",
                  "imageUrl": "https://hackersite.com/fake-news.jpg"
                }
                """;

        mockMvc.perform(post("/api/news")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.imageUrl").exists());
    }

    @Test
    @DisplayName("10. PUT /api/news/{id} (ADMIN): Sửa bài viết thành công")
    void putNews_Admin_Success() throws Exception {
        News news = News.builder()
                .title("Bài viết trước khi sửa")
                .content("Nội dung cũ")
                .build();
        news = newsRepository.save(news);
        createdTestNewsIds.add(news.getNewsId());

        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String updateBody = """
                {
                  "title": "Bài viết sau khi cập nhật",
                  "content": "Nội dung đã được biên tập lại hoàn chỉnh.",
                  "imageUrl": "https://res.cloudinary.com/test-cloud/image/upload/v1/updated.jpg"
                }
                """;

        mockMvc.perform(put("/api/news/" + news.getNewsId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Bài viết sau khi cập nhật"))
                .andExpect(jsonPath("$.content").value("Nội dung đã được biên tập lại hoàn chỉnh."))
                .andExpect(jsonPath("$.imageUrl").value("https://res.cloudinary.com/test-cloud/image/upload/v1/updated.jpg"));
    }

    @Test
    @DisplayName("11. PUT /api/news/{id}: ID không tồn tại trả 404 NOT_FOUND")
    void putNews_NotFound_Returns404() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String updateBody = """
                {
                  "title": "Tiêu đề mới",
                  "content": "Nội dung mới"
                }
                """;

        mockMvc.perform(put("/api/news/999999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("12. DELETE /api/news/{id} (ADMIN): Xóa bài viết thành công (204 No Content)")
    void deleteNews_Admin_Success() throws Exception {
        News news = News.builder()
                .title("Bài viết cần xóa")
                .content("Nội dung bài viết tạm thời")
                .build();
        news = newsRepository.save(news);
        createdTestNewsIds.add(news.getNewsId());

        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(delete("/api/news/" + news.getNewsId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertFalse(newsRepository.findById(news.getNewsId()).isPresent());
    }

    @Test
    @DisplayName("13. DELETE /api/news/{id}: Quyền STAFF trả 403 FORBIDDEN")
    void deleteNews_Staff_Returns403() throws Exception {
        String staffToken = jwtTokenProvider.generateToken(staffUser);

        mockMvc.perform(delete("/api/news/1")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("14. DELETE /api/news/{id}: ID không tồn tại trả 404 NOT_FOUND")
    void deleteNews_NotFound_Returns404() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(delete("/api/news/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
