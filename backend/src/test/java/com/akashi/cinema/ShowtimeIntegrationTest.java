package com.akashi.cinema;

import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.entity.Room;
import com.akashi.cinema.entity.Showtime;
import com.akashi.cinema.repository.MovieRepository;
import com.akashi.cinema.repository.ShowtimeRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
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
class ShowtimeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private LocalDate seedDay1;
    private LocalDate seedDay2;
    private LocalDate seedDay3;

    private final List<Integer> createdTestShowIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        // Lấy ngày thực tế của suất chiếu số 1 từ V2__seed_dev_data.sql
        Showtime firstSeedShowtime = showtimeRepository.findById(1).orElseThrow();
        seedDay1 = firstSeedShowtime.getStartTime().toLocalDate();
        seedDay2 = seedDay1.plusDays(1);
        seedDay3 = seedDay1.plusDays(2);
    }

    @AfterEach
    void tearDown() {
        for (Integer showId : createdTestShowIds) {
            jdbcTemplate.update("DELETE FROM showtimes WHERE show_id = ?", showId);
        }
        createdTestShowIds.clear();
    }

    private Showtime createTestShowtime(int movieId, int roomId, LocalDateTime startTime,
                                        LocalDateTime endTime, BigDecimal multiplier, boolean isActive) {
        Movie movie = movieRepository.findById(movieId).orElseThrow();
        Room room = entityManager.getReference(Room.class, roomId);
        Showtime showtime = Showtime.builder()
                .movie(movie)
                .room(room)
                .startTime(startTime)
                .endTime(endTime)
                .priceMultiplier(multiplier)
                .isActive(isActive)
                .build();
        Showtime saved = showtimeRepository.save(showtime);
        createdTestShowIds.add(saved.getShowId());
        return saved;
    }

    @Test
    @DisplayName("1. GET /api/showtimes với ngày trong seed (Public, không token): trả đúng số lượng, các trường, thứ tự startTime tăng dần")
    void getShowtimes_SeedDay1AndDay2_ReturnsOrderedActiveShowtimesWithCorrectFields() throws Exception {
        String day1Str = seedDay1.toString();
        String day2Str = seedDay2.toString();

        // Seed ngày 1 có 4 suất chiếu: showId 1 (18:00), 3 (19:00), 2 (20:30), 4 (21:45)
        MvcResult resultDay1 = mockMvc.perform(get("/api/showtimes").param("date", day1Str))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                // Suất đầu tiên: showId = 1 (18:00 -> 20:15)
                .andExpect(jsonPath("$[0].showId").value(1))
                .andExpect(jsonPath("$[0].movieId").value(1))
                .andExpect(jsonPath("$[0].movieTitle").value("Hành Trình Về Phía Biển"))
                .andExpect(jsonPath("$[0].ageLimit").value("P"))
                .andExpect(jsonPath("$[0].duration").value(120))
                .andExpect(jsonPath("$[0].genre").value("Tâm lý, Gia đình"))
                .andExpect(jsonPath("$[0].roomId").value(1))
                .andExpect(jsonPath("$[0].roomName").value("Phòng 1"))
                .andExpect(jsonPath("$[0].startTime").value(day1Str + "T18:00:00"))
                .andExpect(jsonPath("$[0].endTime").value(day1Str + "T20:15:00"))
                .andExpect(jsonPath("$[0].priceMultiplier").value(1.00))
                // Thứ tự startTime tăng dần: showId 1 (18:00) -> 3 (19:00) -> 2 (20:30) -> 4 (21:45)
                .andExpect(jsonPath("$[1].showId").value(3))
                .andExpect(jsonPath("$[1].startTime").value(day1Str + "T19:00:00"))
                .andExpect(jsonPath("$[2].showId").value(2))
                .andExpect(jsonPath("$[2].startTime").value(day1Str + "T20:30:00"))
                .andExpect(jsonPath("$[3].showId").value(4))
                .andExpect(jsonPath("$[3].startTime").value(day1Str + "T21:45:00"))
                .andReturn();

        // Kiểm tra raw JSON của priceMultiplier có đúng 2 chữ số thập phân (1.00) và không bọc thành chuỗi
        String jsonDay1 = resultDay1.getResponse().getContentAsString();
        assertThat(jsonDay1).contains("\"priceMultiplier\":1.00");

        // Seed ngày 2 có 3 suất chiếu với priceMultiplier = 1.20: showId 5 (14:00), 6 (17:00), 7 (19:30)
        MvcResult resultDay2 = mockMvc.perform(get("/api/showtimes").param("date", day2Str))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].showId").value(5))
                .andExpect(jsonPath("$[0].startTime").value(day2Str + "T14:00:00"))
                .andExpect(jsonPath("$[0].priceMultiplier").value(1.20))
                .andExpect(jsonPath("$[1].showId").value(6))
                .andExpect(jsonPath("$[2].showId").value(7))
                .andReturn();

        String jsonDay2 = resultDay2.getResponse().getContentAsString();
        assertThat(jsonDay2).contains("\"priceMultiplier\":1.20");
    }

    @Test
    @DisplayName("2. Suất chiếu có isActive = false không xuất hiện trong kết quả")
    void getShowtimes_InactiveShowtime_IsExcluded() throws Exception {
        Showtime inactiveShowtime = createTestShowtime(
                1,
                1,
                seedDay1.atTime(10, 0, 0),
                seedDay1.atTime(12, 15, 0),
                new BigDecimal("1.00"),
                false
        );

        mockMvc.perform(get("/api/showtimes").param("date", seedDay1.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[*].showId", not(hasItem(inactiveShowtime.getShowId()))));
    }

    @Test
    @DisplayName("3. Ngày không có suất chiếu trả 200 với mảng rỗng []")
    void getShowtimes_DateWithNoShowtimes_ReturnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/showtimes").param("date", "2000-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("4. Lọc theo movieId, theo roomId, và kết hợp cả hai")
    void getShowtimes_FilterByMovieIdAndRoomId_ReturnsMatchingShowtimes() throws Exception {
        String day1Str = seedDay1.toString();

        // Lọc theo movieId = 3 trên ngày 1 -> có 2 suất (showId 3 và 4 ở Phòng 2)
        mockMvc.perform(get("/api/showtimes")
                        .param("date", day1Str)
                        .param("movieId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].showId").value(3))
                .andExpect(jsonPath("$[1].showId").value(4));

        // Lọc theo roomId = 1 trên ngày 1 -> có 2 suất (showId 1 và 2)
        mockMvc.perform(get("/api/showtimes")
                        .param("date", day1Str)
                        .param("roomId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].showId").value(1))
                .andExpect(jsonPath("$[1].showId").value(2));

        // Kết hợp movieId = 2 và roomId = 1 trên ngày 1 -> có 1 suất (showId = 2)
        mockMvc.perform(get("/api/showtimes")
                        .param("date", day1Str)
                        .param("movieId", "2")
                        .param("roomId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].showId").value(2))
                .andExpect(jsonPath("$[0].movieId").value(2))
                .andExpect(jsonPath("$[0].roomId").value(1));

        // Kết hợp movieId = 2 và roomId = 2 trên ngày 1 -> không có suất nào -> []
        mockMvc.perform(get("/api/showtimes")
                        .param("date", day1Str)
                        .param("movieId", "2")
                        .param("roomId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("5. movieId hoặc roomId không tồn tại trả 200 với mảng rỗng []")
    void getShowtimes_NonExistentMovieOrRoom_Returns200WithEmptyArray() throws Exception {
        String day1Str = seedDay1.toString();

        mockMvc.perform(get("/api/showtimes")
                        .param("date", day1Str)
                        .param("movieId", "99999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get("/api/showtimes")
                        .param("date", day1Str)
                        .param("roomId", "99999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("6. Biên ngày: suất lúc 00:00:00 và 23:59:59 của ngày đó được tính, ngày liền trước/liền sau không tính")
    void getShowtimes_DayBoundaries_IncludesExactStartAndEndOfDayOnly() throws Exception {
        LocalDate targetDate = LocalDate.of(2030, 5, 10);
        LocalDate prevDate = targetDate.minusDays(1);
        LocalDate nextDate = targetDate.plusDays(1);

        // Suất cuối ngày liền trước: 2030-05-09 23:59:59
        createTestShowtime(
                1, 1,
                prevDate.atTime(23, 59, 59),
                targetDate.atTime(2, 14, 59),
                new BigDecimal("1.00"), true
        );

        // Suất đầu ngày đang xét: 2030-05-10 00:00:00
        Showtime atStartOfDay = createTestShowtime(
                1, 2,
                targetDate.atTime(0, 0, 0),
                targetDate.atTime(2, 15, 0),
                new BigDecimal("1.00"), true
        );

        // Suất cuối ngày đang xét: 2030-05-10 23:59:59
        Showtime atEndOfDay = createTestShowtime(
                2, 1,
                targetDate.atTime(23, 59, 59),
                nextDate.atTime(1, 59, 59),
                new BigDecimal("1.00"), true
        );

        // Suất đầu ngày liền sau: 2030-05-11 00:00:00
        createTestShowtime(
                2, 2,
                nextDate.atTime(0, 0, 0),
                nextDate.atTime(2, 0, 0),
                new BigDecimal("1.00"), true
        );

        mockMvc.perform(get("/api/showtimes").param("date", "2030-05-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].showId").value(atStartOfDay.getShowId()))
                .andExpect(jsonPath("$[0].startTime").value("2030-05-10T00:00:00"))
                .andExpect(jsonPath("$[1].showId").value(atEndOfDay.getShowId()))
                .andExpect(jsonPath("$[1].startTime").value("2030-05-10T23:59:59"));
    }

    @Test
    @DisplayName("7. Thiếu tham số date hoặc date sai định dạng trả 400 VALIDATION_ERROR")
    void getShowtimes_MissingOrInvalidDate_Returns400ValidationError() throws Exception {
        // Thiếu date
        mockMvc.perform(get("/api/showtimes"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.timestamp").exists());

        // Sai định dạng date
        mockMvc.perform(get("/api/showtimes").param("date", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        // Sai định dạng DD-MM-YYYY thay vì YYYY-MM-DD
        mockMvc.perform(get("/api/showtimes").param("date", "03-11-2026"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("8. Bảo mật: chỉ mở GET /api/showtimes/**, gọi POST /api/showtimes không có token trả 401 UNAUTHORIZED")
    void postShowtimes_WithoutToken_Returns401Unauthorized() throws Exception {
        mockMvc.perform(post("/api/showtimes"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}

