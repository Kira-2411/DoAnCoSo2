package com.akashi.cinema;

import com.akashi.cinema.config.TimeConfig;
import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.AgeLimit;
import com.akashi.cinema.enums.MovieStatus;
import com.akashi.cinema.repository.MovieRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "akashi.cloudinary.cloud-name=test-cloud",
        "akashi.cloudinary.api-key=test-key",
        "akashi.cloudinary.api-secret=test-secret"
})
@AutoConfigureMockMvc
class MovieIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Integer> createdTestMovieIds = new ArrayList<>();
    private final List<Integer> createdTestShowtimeIds = new ArrayList<>();

    private User adminUser;
    private User staffUser;
    private User customerUser;

    @BeforeEach
    void setUp() {
        // Khôi phục trạng thái chuẩn của 5 phim mẫu từ V2 seed data để các test không bị ảnh hưởng bởi dữ liệu test tay
        jdbcTemplate.update("UPDATE movies SET is_active = 1 WHERE movie_id BETWEEN 1 AND 5");
        jdbcTemplate.update("UPDATE movies SET release_date = CURDATE() - INTERVAL 2 DAY, movie_status = 'NOW_SHOWING' WHERE movie_id = 1");
        jdbcTemplate.update("UPDATE movies SET release_date = CURDATE() - INTERVAL 4 DAY, movie_status = 'NOW_SHOWING' WHERE movie_id = 2");
        jdbcTemplate.update("UPDATE movies SET release_date = CURDATE() - INTERVAL 1 DAY, movie_status = 'NOW_SHOWING' WHERE movie_id = 3");
        jdbcTemplate.update("UPDATE movies SET release_date = CURDATE() + INTERVAL 10 DAY, movie_status = 'COMING_SOON' WHERE movie_id = 4");
        jdbcTemplate.update("UPDATE movies SET release_date = CURDATE() - INTERVAL 30 DAY, movie_status = 'ENDED' WHERE movie_id = 5");
        jdbcTemplate.update("DELETE FROM showtimes WHERE movie_id > 5");
        jdbcTemplate.update("DELETE FROM movies WHERE movie_id > 5");

        adminUser = userRepository.findByEmail("admin@example.com").orElse(null);
        staffUser = userRepository.findByEmail("staff@example.com").orElse(null);
        customerUser = userRepository.findByEmail("customer@example.com").orElse(null);
    }

    @AfterEach
    void tearDown() {
        for (Integer showId : createdTestShowtimeIds) {
            jdbcTemplate.update("DELETE FROM showtimes WHERE show_id = ?", showId);
        }
        createdTestShowtimeIds.clear();

        for (Integer movieId : createdTestMovieIds) {
            jdbcTemplate.update("DELETE FROM showtimes WHERE movie_id = ?", movieId);
            jdbcTemplate.update("DELETE FROM movies WHERE movie_id = ?", movieId);
        }
        createdTestMovieIds.clear();
    }

    private Movie createInactiveTestMovie() {
        Movie inactiveMovie = Movie.builder()
                .title("Phim Đã Ẩn Không Hiển Thị")
                .description("Mô tả phim đã ẩn")
                .duration(100)
                .genre("Tâm lý")
                .ageLimit(AgeLimit.T13)
                .releaseDate(LocalDate.now())
                .movieStatus(MovieStatus.NOW_SHOWING)
                .isActive(false)
                .build();
        Movie saved = movieRepository.save(inactiveMovie);
        createdTestMovieIds.add(saved.getMovieId());
        return saved;
    }

    private Movie createActiveTestMovie(String title) {
        Movie activeMovie = Movie.builder()
                .title(title)
                .description("Mô tả phim test")
                .duration(110)
                .genre("Hành động")
                .ageLimit(AgeLimit.T16)
                .releaseDate(LocalDate.now())
                .movieStatus(MovieStatus.NOW_SHOWING)
                .isActive(true)
                .build();
        Movie saved = movieRepository.save(activeMovie);
        createdTestMovieIds.add(saved.getMovieId());
        return saved;
    }

    @Test
    @DisplayName("1. GET /api/movies không filter (Public, không token): trả đúng 5 phim active từ V2 seed, bỏ qua phim inactive")
    void getMovies_NoFilter_ReturnsAllActiveSeedMoviesOnly() throws Exception {
        Movie inactive = createInactiveTestMovie();

        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.content[0].movieId").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Hành Trình Về Phía Biển"))
                .andExpect(jsonPath("$.content[0].genre").value("Tâm lý, Gia đình"))
                .andExpect(jsonPath("$.content[0].duration").value(120))
                .andExpect(jsonPath("$.content[0].ageLimit").value("P"))
                .andExpect(jsonPath("$.content[0].movieStatus").value("NOW_SHOWING"))
                .andExpect(jsonPath("$.content[0].isActive").value(true))
                .andExpect(jsonPath("$.content[*].movieId", not(hasItem(inactive.getMovieId()))));
    }

    @Test
    @DisplayName("2. GET /api/movies lọc theo status=NOW_SHOWING và status=COMING_SOON và status=ENDED khớp V2 seed")
    void getMovies_FilterByStatus_ReturnsMatchingSeedMovies() throws Exception {
        mockMvc.perform(get("/api/movies").param("status", "NOW_SHOWING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].movieId").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Hành Trình Về Phía Biển"))
                .andExpect(jsonPath("$.content[1].movieId").value(2))
                .andExpect(jsonPath("$.content[1].title").value("Thám Tử Phố Cổ"))
                .andExpect(jsonPath("$.content[2].movieId").value(3))
                .andExpect(jsonPath("$.content[2].title").value("Đêm Cuối Ở Hội An"));

        mockMvc.perform(get("/api/movies").param("status", "COMING_SOON"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(4))
                .andExpect(jsonPath("$.content[0].title").value("Tiếng Gọi Từ Rừng Sâu"))
                .andExpect(jsonPath("$.content[0].movieStatus").value("COMING_SOON"));

        mockMvc.perform(get("/api/movies").param("status", "ENDED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(5))
                .andExpect(jsonPath("$.content[0].title").value("Mùa Hè Cuối Cùng"))
                .andExpect(jsonPath("$.content[0].movieStatus").value("ENDED"));
    }

    @Test
    @DisplayName("3. GET /api/movies tìm theo keyword không phân biệt hoa thường và trường hợp không có kết quả")
    void getMovies_FilterByKeyword_CaseInsensitiveAndEmptyResult() throws Exception {
        mockMvc.perform(get("/api/movies").param("keyword", "hội an"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(3))
                .andExpect(jsonPath("$.content[0].title").value("Đêm Cuối Ở Hội An"));

        mockMvc.perform(get("/api/movies").param("keyword", "PHỐ CỔ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Thám Tử Phố Cổ"));

        mockMvc.perform(get("/api/movies").param("keyword", "KhongCoPhimNay12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0))
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    @DisplayName("4. GET /api/movies phân trang page và size hoạt động đúng")
    void getMovies_Pagination_WorksCorrectly() throws Exception {
        mockMvc.perform(get("/api/movies")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].movieId").value(1))
                .andExpect(jsonPath("$.content[1].movieId").value(2));

        mockMvc.perform(get("/api/movies")
                        .param("page", "2")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(5));
    }

    @Test
    @DisplayName("5. GET /api/movies với status không hợp lệ hoặc page/size không hợp lệ trả 400 VALIDATION_ERROR")
    void getMovies_InvalidParams_Returns400ValidationError() throws Exception {
        mockMvc.perform(get("/api/movies").param("status", "INVALID_STATUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.timestamp").exists());

        mockMvc.perform(get("/api/movies").param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/movies").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(get("/api/movies").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("6. GET /api/movies/{id} với phim tồn tại trả 200 kèm đầy đủ thông tin chi tiết và isActive")
    void getMovieById_ExistingActiveMovie_Returns200WithFullDetails() throws Exception {
        mockMvc.perform(get("/api/movies/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(1))
                .andExpect(jsonPath("$.title").value("Hành Trình Về Phía Biển"))
                .andExpect(jsonPath("$.description").value("Hai anh em đi dọc miền Trung để tìm lại ngôi nhà tuổi thơ."))
                .andExpect(jsonPath("$.duration").value(120))
                .andExpect(jsonPath("$.genre").value("Tâm lý, Gia đình"))
                .andExpect(jsonPath("$.ageLimit").value("P"))
                .andExpect(jsonPath("$.movieStatus").value("NOW_SHOWING"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.releaseDate").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());
    }

    @Test
    @DisplayName("7. GET /api/movies/{id} với id không tồn tại hoặc phim inactive trả 404 NOT_FOUND")
    void getMovieById_NonExistentOrInactive_Returns404NotFound() throws Exception {
        mockMvc.perform(get("/api/movies/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.timestamp").exists());

        Movie inactiveMovie = createInactiveTestMovie();
        mockMvc.perform(get("/api/movies/" + inactiveMovie.getMovieId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("8. Bảo mật: gọi POST /api/movies không có token trả 401 UNAUTHORIZED")
    void postMovies_WithoutToken_Returns401Unauthorized() throws Exception {
        mockMvc.perform(post("/api/movies"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("9. ADMIN gọi GET /api/movies?includeInactive=true trả cả phim active và inactive")
    void getMovies_AdminWithIncludeInactive_ReturnsAllMovies() throws Exception {
        Movie inactive = createInactiveTestMovie();
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/movies")
                        .param("includeInactive", "true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].movieId", hasItem(inactive.getMovieId())));
    }

    @Test
    @DisplayName("10. Người dùng thường gọi GET /api/movies?includeInactive=true thì tham số bị bỏ qua")
    void getMovies_NonAdminWithIncludeInactive_IgnoresParam() throws Exception {
        Movie inactive = createInactiveTestMovie();
        String customerToken = jwtTokenProvider.generateToken(customerUser);

        // Khách hàng có token
        mockMvc.perform(get("/api/movies")
                        .param("includeInactive", "true")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].movieId", not(hasItem(inactive.getMovieId()))));

        // Public không token
        mockMvc.perform(get("/api/movies")
                        .param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].movieId", not(hasItem(inactive.getMovieId()))));
    }

    @Test
    @DisplayName("11. ADMIN gọi GET /api/movies/{id} xem được phim đã ẩn, người thường trả 404")
    void getMovieById_AdminCanViewInactiveMovie() throws Exception {
        Movie inactive = createInactiveTestMovie();
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String customerToken = jwtTokenProvider.generateToken(customerUser);

        // ADMIN xem được
        mockMvc.perform(get("/api/movies/" + inactive.getMovieId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(inactive.getMovieId()))
                .andExpect(jsonPath("$.isActive").value(false));

        // CUSTOMER gọi -> 404
        mockMvc.perform(get("/api/movies/" + inactive.getMovieId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("12. Bảo mật: CUSTOMER hoặc STAFF gọi POST/PUT/DELETE /api/movies trả 403 FORBIDDEN")
    void movieMutations_NonAdmin_Returns403Forbidden() throws Exception {
        String customerToken = jwtTokenProvider.generateToken(customerUser);
        String staffToken = jwtTokenProvider.generateToken(staffUser);

        String dummyBody = """
                {
                  "title": "Phim Hack",
                  "duration": 120,
                  "ageLimit": "P",
                  "movieStatus": "NOW_SHOWING"
                }
                """;

        // POST
        mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dummyBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // PUT
        mockMvc.perform(put("/api/movies/1")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dummyBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // DELETE
        mockMvc.perform(delete("/api/movies/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("13. POST /api/movies (ADMIN): tạo phim thành công trả 201 MovieResponse với isActive=true")
    void postMovie_AdminValidInput_Returns201() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String requestJson = """
                {
                  "title": "   Vũ Trụ Nguyên Bản   ",
                  "description": "Một bộ phim khoa học viễn tưởng tuyệt đẹp",
                  "duration": 135,
                  "genre": "Khoa học viễn tưởng",
                  "ageLimit": "T16",
                  "releaseDate": "2026-12-01",
                  "movieStatus": "COMING_SOON",
                  "posterUrl": null
                }
                """;

        String responseContent = mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.movieId").isNumber())
                .andExpect(jsonPath("$.title").value("Vũ Trụ Nguyên Bản"))
                .andExpect(jsonPath("$.duration").value(135))
                .andExpect(jsonPath("$.ageLimit").value("T16"))
                .andExpect(jsonPath("$.movieStatus").value("COMING_SOON"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andReturn().getResponse().getContentAsString();

        // Extract movieId to clean up
        int createdId = Integer.parseInt(responseContent.split("\"movieId\":")[1].split(",")[0].trim());
        createdTestMovieIds.add(createdId);
    }

    @Test
    @DisplayName("14. POST /api/movies (ADMIN): validate lỗi dữ liệu trả 400 VALIDATION_ERROR")
    void postMovie_ValidationErrors_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        // Title blank & duration > 600
        String invalidJson = """
                {
                  "title": "   ",
                  "duration": 999,
                  "ageLimit": "P",
                  "movieStatus": "NOW_SHOWING"
                }
                """;

        mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.title").exists())
                .andExpect(jsonPath("$.details.duration").exists());
    }

    @Test
    @DisplayName("15. POST /api/movies (ADMIN): posterUrl không khớp Cloudinary trả 400 VALIDATION_ERROR")
    void postMovie_InvalidPosterUrl_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String invalidPosterJson = """
                {
                  "title": "Phim Test Poster Lỗi",
                  "duration": 120,
                  "ageLimit": "T13",
                  "releaseDate": "2026-11-20",
                  "movieStatus": "NOW_SHOWING",
                  "posterUrl": "https://hackersite.com/fake-image.jpg"
                }
                """;

        mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPosterJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.posterUrl").value("Đường dẫn ảnh không hợp lệ"));
    }

    @Test
    @DisplayName("16. PUT /api/movies/{id} (ADMIN): cập nhật thông tin thành công trả 200")
    void putMovie_AdminValidInput_Returns200() throws Exception {
        Movie movie = createActiveTestMovie("Phim Để Sửa");
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        String updateJson = """
                {
                  "title": "Phim Đã Được Sửa Tên",
                  "description": "Mô tả mới",
                  "duration": 140,
                  "genre": "Phiêu lưu",
                  "ageLimit": "T18",
                  "releaseDate": "2026-11-20",
                  "movieStatus": "ENDED",
                  "posterUrl": null,
                  "isActive": true
                }
                """;

        mockMvc.perform(put("/api/movies/" + movie.getMovieId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(movie.getMovieId()))
                .andExpect(jsonPath("$.title").value("Phim Đã Được Sửa Tên"))
                .andExpect(jsonPath("$.duration").value(140))
                .andExpect(jsonPath("$.ageLimit").value("T18"))
                .andExpect(jsonPath("$.movieStatus").value("ENDED"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("17. PUT /api/movies/{id} (ADMIN): hiện lại phim đã ẩn (isActive: true) luôn thành công")
    void putMovie_ReactivateInactiveMovie_Returns200() throws Exception {
        Movie inactive = createInactiveTestMovie();
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        String reactivateJson = """
                {
                  "title": "Phim Đã Ẩn Được Hiện Lại",
                  "duration": 100,
                  "ageLimit": "T13",
                  "releaseDate": "2026-11-20",
                  "movieStatus": "NOW_SHOWING",
                  "isActive": true
                }
                """;

        mockMvc.perform(put("/api/movies/" + inactive.getMovieId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reactivateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(inactive.getMovieId()))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("18. PUT /api/movies/{id} và DELETE /api/movies/{id} với ID không tồn tại trả 404 NOT_FOUND")
    void putAndDeleteMovie_NonExistent_Returns404() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String dummyBody = """
                {
                  "title": "Phim Khong Co",
                  "duration": 90,
                  "ageLimit": "P",
                  "releaseDate": "2026-11-20",
                  "movieStatus": "NOW_SHOWING"
                }
                """;

        mockMvc.perform(put("/api/movies/99999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dummyBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mockMvc.perform(delete("/api/movies/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("19. DELETE /api/movies/{id} (ADMIN): ẩn phim thành công trả 204, gọi lại trên phim đã ẩn vẫn 204")
    void deleteMovie_AdminSoftDeletesMovie_Returns204() throws Exception {
        Movie movie = createActiveTestMovie("Phim Để Xóa Mềm");
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        // Lần 1: ẩn phim -> 204
        mockMvc.perform(delete("/api/movies/" + movie.getMovieId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Kiểm tra trong DB: phim vẫn còn dòng, nhưng isActive = false
        Movie dbMovie = movieRepository.findById(movie.getMovieId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(dbMovie.getIsActive()).isFalse();

        // Lần 2: gọi lại trên phim đã ẩn -> vẫn 204
        mockMvc.perform(delete("/api/movies/" + movie.getMovieId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("20. DELETE hoặc PUT isActive=false phim còn suất chiếu chưa kết thúc trả 409 MOVIE_HAS_UPCOMING_SHOWTIMES")
    void deactivateMovie_WithActiveUnfinishedShowtime_Returns409Conflict() throws Exception {
        Movie movie = createActiveTestMovie("Phim Đang Có Suất Chiếu");
        String adminToken = jwtTokenProvider.generateToken(adminUser);

        // Thêm một suất chiếu đang hoạt động và endTime trong tương lai (sau hiện tại)
        LocalDateTime now = LocalDateTime.now(TimeConfig.VIETNAM_ZONE);
        LocalDateTime startTime = now.plusMinutes(30);
        LocalDateTime endTime = now.plusHours(2);

        jdbcTemplate.update("""
                INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price_multiplier, is_active, created_at)
                VALUES (?, 1, ?, ?, 1.00, 1, ?)
                """, movie.getMovieId(), startTime, endTime, now);

        Integer showId = jdbcTemplate.queryForObject(
                "SELECT show_id FROM showtimes WHERE movie_id = ? ORDER BY show_id DESC LIMIT 1",
                Integer.class, movie.getMovieId()
        );
        if (showId != null) {
            createdTestShowtimeIds.add(showId);
        }

        // 1. Thử DELETE -> phải bị chặn 409
        mockMvc.perform(delete("/api/movies/" + movie.getMovieId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MOVIE_HAS_UPCOMING_SHOWTIMES"))
                .andExpect(jsonPath("$.message").value("Phim còn suất chiếu chưa kết thúc, cần hủy các suất đó trước"));

        // 2. Thử PUT với isActive=false -> cũng phải bị chặn 409
        String updateDeactivateJson = """
                {
                  "title": "Phim Đang Có Suất Chiếu Cố Tình Ẩn",
                  "duration": 110,
                  "ageLimit": "T16",
                  "releaseDate": "2026-11-20",
                  "movieStatus": "NOW_SHOWING",
                  "isActive": false
                }
                """;

        mockMvc.perform(put("/api/movies/" + movie.getMovieId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateDeactivateJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MOVIE_HAS_UPCOMING_SHOWTIMES"))
                .andExpect(jsonPath("$.message").value("Phim còn suất chiếu chưa kết thúc, cần hủy các suất đó trước"));

        // 3. Phim vẫn phải còn active
        Movie dbMovie = movieRepository.findById(movie.getMovieId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(dbMovie.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("21. GET /api/movies với sort=newest: phim mới tạo nhất hiển thị ở đầu danh sách (content[0])")
    void getMovies_WithSortNewest_ReturnsNewestMovieFirst() throws Exception {
        LocalDate futureDate = LocalDate.now(TimeConfig.VIETNAM_ZONE).plusDays(30);
        Movie brandNewMovie = Movie.builder()
                .title("TEST-Phim-Moi-Nhat-Vua-Tao-" + java.util.UUID.randomUUID())
                .description("Mô tả phim test")
                .duration(110)
                .genre("Hành động")
                .ageLimit(AgeLimit.T16)
                .releaseDate(futureDate)
                .movieStatus(MovieStatus.COMING_SOON)
                .isActive(true)
                .build();
        Movie saved = movieRepository.save(brandNewMovie);
        createdTestMovieIds.add(saved.getMovieId());

        mockMvc.perform(get("/api/movies")
                        .param("sort", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].movieId").value(saved.getMovieId()))
                .andExpect(jsonPath("$.content[0].title").value(saved.getTitle()));
    }

    @Test
    @DisplayName("22. POST /api/movies: ngày khởi chiếu từ ngày mai nhưng để NOW_SHOWING trả 400 VALIDATION_ERROR")
    void postMovie_FutureReleaseDateWithInvalidStatus_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        LocalDate tomorrow = LocalDate.now(TimeConfig.VIETNAM_ZONE).plusDays(1);

        String invalidStatusJson = String.format("""
                {
                  "title": "Phim Khoi Chieu Ngay Mai",
                  "duration": 120,
                  "ageLimit": "T13",
                  "releaseDate": "%s",
                  "movieStatus": "NOW_SHOWING"
                }
                """, tomorrow);

        mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidStatusJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.movieStatus").value("Phim có ngày khởi chiếu từ ngày mai trở đi phải có trạng thái SẮP CHIẾU (COMING_SOON)"));
    }

    @Test
    @DisplayName("23. POST /api/movies: ngày khởi chiếu quá 7 ngày trước nhưng để COMING_SOON/NOW_SHOWING trả 400 VALIDATION_ERROR")
    void postMovie_OldReleaseDateWithInvalidStatus_Returns400() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        LocalDate oldDate = LocalDate.now(TimeConfig.VIETNAM_ZONE).minusDays(10);

        String invalidStatusJson = String.format("""
                {
                  "title": "Phim Da Chieu Qua 7 Ngay",
                  "duration": 100,
                  "ageLimit": "P",
                  "releaseDate": "%s",
                  "movieStatus": "NOW_SHOWING"
                }
                """, oldDate);

        mockMvc.perform(post("/api/movies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidStatusJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.movieStatus").value("Phim đã quá thời hạn chiếu 7 ngày phải có trạng thái NGỪNG CHIẾU (ENDED)"));
    }

    @Test
    @DisplayName("24. GET /api/movies?sort=newest: đảm bảo thứ tự từ trên xuống là SẮP CHIẾU -> ĐANG CHIẾU -> NGỪNG CHIẾU")
    void getMovies_WithSortNewest_EnforcesStatusHierarchy() throws Exception {
        LocalDate today = LocalDate.now(TimeConfig.VIETNAM_ZONE);
        LocalDate farFuture = today.plusDays(30);

        // Tạo 1 phim SẮP CHIẾU (khởi chiếu xa hơn Movie 4)
        Movie comingSoonMovie = Movie.builder()
                .title("TEST-Sap-Chieu-" + java.util.UUID.randomUUID())
                .duration(120)
                .ageLimit(AgeLimit.T13)
                .releaseDate(farFuture)
                .movieStatus(MovieStatus.COMING_SOON)
                .isActive(true)
                .build();
        Movie savedComingSoon = movieRepository.save(comingSoonMovie);
        createdTestMovieIds.add(savedComingSoon.getMovieId());

        // Tạo 1 phim ĐANG CHIẾU (khởi chiếu hôm nay)
        Movie nowShowingMovie = Movie.builder()
                .title("TEST-Dang-Chieu-" + java.util.UUID.randomUUID())
                .duration(110)
                .ageLimit(AgeLimit.P)
                .releaseDate(today)
                .movieStatus(MovieStatus.NOW_SHOWING)
                .isActive(true)
                .build();
        Movie savedNowShowing = movieRepository.save(nowShowingMovie);
        createdTestMovieIds.add(savedNowShowing.getMovieId());

        // Gọi API sort=newest
        mockMvc.perform(get("/api/movies")
                        .param("sort", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].movieId").value(savedComingSoon.getMovieId()))
                .andExpect(jsonPath("$.content[0].movieStatus").value("COMING_SOON"))
                .andExpect(jsonPath("$.content[1].movieStatus").value("COMING_SOON"))
                .andExpect(jsonPath("$.content[2].movieStatus").value("NOW_SHOWING"))
                .andExpect(jsonPath("$.content[6].movieStatus").value("ENDED"));
    }
}
