package com.akashi.cinema;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.enums.AgeLimit;
import com.akashi.cinema.enums.MovieStatus;
import com.akashi.cinema.repository.MovieRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MovieIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Integer> createdTestMovieIds = new ArrayList<>();

    @AfterEach
    void tearDown() {
        for (Integer movieId : createdTestMovieIds) {
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
                .andExpect(jsonPath("$.content[*].movieId", not(hasItem(inactive.getMovieId()))));
    }

    @Test
    @DisplayName("2. GET /api/movies lọc theo status=NOW_SHOWING và status=COMING_SOON và status=ENDED khớp V2 seed")
    void getMovies_FilterByStatus_ReturnsMatchingSeedMovies() throws Exception {
        // Seed V2 có 3 phim NOW_SHOWING: movieId 1, 2, 3
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

        // Seed V2 có 1 phim COMING_SOON: movieId 4 ("Tiếng Gọi Từ Rừng Sâu")
        mockMvc.perform(get("/api/movies").param("status", "COMING_SOON"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(4))
                .andExpect(jsonPath("$.content[0].title").value("Tiếng Gọi Từ Rừng Sâu"))
                .andExpect(jsonPath("$.content[0].movieStatus").value("COMING_SOON"));

        // Seed V2 có 1 phim ENDED: movieId 5 ("Mùa Hè Cuối Cùng")
        mockMvc.perform(get("/api/movies").param("status", "ENDED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(5))
                .andExpect(jsonPath("$.content[0].title").value("Mùa Hè Cuối Cùng"))
                .andExpect(jsonPath("$.content[0].movieStatus").value("ENDED"));
    }

    @Test
    @DisplayName("3. GET /api/movies tìm theo keyword không phân biệt hoa thường và trường hợp không có kết quả")
    void getMovies_FilterByKeyword_CaseInsensitiveAndEmptyResult() throws Exception {
        // Tìm chữ thường "hội an" -> khớp "Đêm Cuối Ở Hội An" (movieId = 3)
        mockMvc.perform(get("/api/movies").param("keyword", "hội an"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(3))
                .andExpect(jsonPath("$.content[0].title").value("Đêm Cuối Ở Hội An"));

        // Tìm chữ hoa "PHỐ CỔ" -> khớp "Thám Tử Phố Cổ" (movieId = 2)
        mockMvc.perform(get("/api/movies").param("keyword", "PHỐ CỔ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].movieId").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Thám Tử Phố Cổ"));

        // Tìm keyword không tồn tại -> content rỗng, totalElements = 0
        mockMvc.perform(get("/api/movies").param("keyword", "KhongCoPhimNay12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0))
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    @DisplayName("4. GET /api/movies phân trang page và size hoạt động đúng")
    void getMovies_Pagination_WorksCorrectly() throws Exception {
        // Trang 0, size 2 -> trả phim 1, 2; totalElements = 5, totalPages = 3
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

        // Trang 2 (trang cuối), size 2 -> trả 1 phim (movieId = 5)
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
        // status sai
        mockMvc.perform(get("/api/movies").param("status", "INVALID_STATUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.timestamp").exists());

        // page âm
        mockMvc.perform(get("/api/movies").param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        // size vượt quá 100
        mockMvc.perform(get("/api/movies").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        // size <= 0
        mockMvc.perform(get("/api/movies").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("6. GET /api/movies/{id} với phim tồn tại trả 200 kèm đầy đủ thông tin chi tiết")
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
                .andExpect(jsonPath("$.releaseDate").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());
    }

    @Test
    @DisplayName("7. GET /api/movies/{id} với id không tồn tại hoặc phim inactive trả 404 NOT_FOUND")
    void getMovieById_NonExistentOrInactive_Returns404NotFound() throws Exception {
        // ID không tồn tại
        mockMvc.perform(get("/api/movies/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.timestamp").exists());

        // Phim tồn tại nhưng isActive = false
        Movie inactiveMovie = createInactiveTestMovie();
        mockMvc.perform(get("/api/movies/" + inactiveMovie.getMovieId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("8. Bảo mật: chỉ mở GET /api/movies/**, gọi POST /api/movies không có token trả 401 UNAUTHORIZED")
    void postMovies_WithoutToken_Returns401Unauthorized() throws Exception {
        mockMvc.perform(post("/api/movies"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
