package com.akashi.cinema;

import com.akashi.cinema.entity.Booking;
import com.akashi.cinema.entity.BookingSeat;
import com.akashi.cinema.entity.Seat;
import com.akashi.cinema.entity.SeatHold;
import com.akashi.cinema.entity.Showtime;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.BookingChannel;
import com.akashi.cinema.enums.BookingStatus;
import com.akashi.cinema.enums.Role;
import com.akashi.cinema.repository.BookingRepository;
import com.akashi.cinema.repository.BookingSeatRepository;
import com.akashi.cinema.repository.SeatHoldRepository;
import com.akashi.cinema.repository.SeatRepository;
import com.akashi.cinema.repository.ShowtimeRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MyBookingsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingSeatRepository bookingSeatRepository;

    @Autowired
    private SeatHoldRepository seatHoldRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User customerA;
    private String originalCustomerUsername;
    private String originalCustomerPhone;

    private User customerB;
    private User customerEmpty;
    private User adminUser;
    private User staffUser;

    private final List<Integer> createdBookingIds = new ArrayList<>();
    private final List<Integer> createdUserIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        customerA = userRepository.findByEmail("customer@example.com").orElseThrow();
        originalCustomerUsername = customerA.getUsername();
        originalCustomerPhone = customerA.getPhone();

        adminUser = userRepository.findByEmail("admin@example.com").orElseThrow();
        staffUser = userRepository.findByEmail("staff@example.com").orElseThrow();

        customerB = userRepository.save(User.builder()
                .username("Khách hàng B")
                .email("customer.b.test@example.com")
                .passwordHash(passwordEncoder.encode("Akashi@2026"))
                .phone("0911222333")
                .role(Role.CUSTOMER)
                .isActive(true)
                .emailVerified(true)
                .build());
        createdUserIds.add(customerB.getUserId());

        customerEmpty = userRepository.save(User.builder()
                .username("Khách hàng Mới")
                .email("customer.empty.test@example.com")
                .passwordHash(passwordEncoder.encode("Akashi@2026"))
                .phone("0944555666")
                .role(Role.CUSTOMER)
                .isActive(true)
                .emailVerified(true)
                .build());
        createdUserIds.add(customerEmpty.getUserId());

        List<Showtime> showtimes = showtimeRepository.findAll();
        Showtime show1 = showtimes.get(0);
        Showtime show2 = showtimes.size() > 1 ? showtimes.get(1) : showtimes.get(0);

        List<Seat> seatsRoom1 = seatRepository.findByRoomRoomIdOrderByRowNumAscColNumAsc(show1.getRoom().getRoomId());
        // Seat A08 (row 1, col 8 -> index 7) and A09 (row 1, col 9 -> index 8)
        Seat seatA08 = seatsRoom1.stream()
                .filter(s -> s.getRowNum() == 1 && s.getColNum() == 8)
                .findFirst()
                .orElse(seatsRoom1.get(0));
        Seat seatA09 = seatsRoom1.stream()
                .filter(s -> s.getRowNum() == 1 && s.getColNum() == 9)
                .findFirst()
                .orElse(seatsRoom1.get(1));
        Seat seatB01 = seatsRoom1.stream()
                .filter(s -> s.getRowNum() == 2 && s.getColNum() == 1)
                .findFirst()
                .orElse(seatsRoom1.get(2));
        Seat seatC02 = seatsRoom1.stream()
                .filter(s -> s.getRowNum() == 3 && s.getColNum() == 2)
                .findFirst()
                .orElse(seatsRoom1.get(3));

        // 1. Older PAID booking for customerA
        Booking bookingA1 = bookingRepository.save(Booking.builder()
                .bookingCode("AKS-TEST-A001")
                .user(customerA)
                .showtime(show1)
                .channel(BookingChannel.ONLINE)
                .discountAmount(0L)
                .totalPrice(130000L)
                .bookingStatus(BookingStatus.PAID)
                .bookingTime(LocalDateTime.of(2026, 4, 10, 14, 22, 0))
                .build());
        createdBookingIds.add(bookingA1.getBookingId());

        // Insert A09 first, then A08 to verify seats are returned sorted as ["A08", "A09"]
        bookingSeatRepository.save(BookingSeat.builder()
                .booking(bookingA1)
                .showtime(show1)
                .seat(seatA09)
                .price(65000L)
                .build());
        bookingSeatRepository.save(BookingSeat.builder()
                .booking(bookingA1)
                .showtime(show1)
                .seat(seatA08)
                .price(65000L)
                .build());

        // 2. Newer PENDING booking for customerA (seats held in seat_holds)
        Booking bookingA2 = bookingRepository.save(Booking.builder()
                .bookingCode("AKS-TEST-A002")
                .user(customerA)
                .showtime(show1)
                .channel(BookingChannel.ONLINE)
                .discountAmount(0L)
                .totalPrice(65000L)
                .bookingStatus(BookingStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .bookingTime(LocalDateTime.of(2026, 4, 11, 18, 0, 0))
                .build());
        createdBookingIds.add(bookingA2.getBookingId());

        seatHoldRepository.save(SeatHold.builder()
                .showtime(show1)
                .seat(seatB01)
                .holderToken("test-holder-token-a2")
                .booking(bookingA2)
                .price(65000L)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build());

        // 3. Newest CANCELLED booking for customerA
        Booking bookingA3 = bookingRepository.save(Booking.builder()
                .bookingCode("AKS-TEST-A003")
                .user(customerA)
                .showtime(show2)
                .channel(BookingChannel.ONLINE)
                .discountAmount(0L)
                .totalPrice(80000L)
                .bookingStatus(BookingStatus.CANCELLED)
                .bookingTime(LocalDateTime.of(2026, 4, 12, 9, 30, 0))
                .build());
        createdBookingIds.add(bookingA3.getBookingId());

        // 4. PAID booking for customerB (must NEVER leak to customerA)
        Booking bookingB1 = bookingRepository.save(Booking.builder()
                .bookingCode("AKS-TEST-B999")
                .user(customerB)
                .showtime(show1)
                .channel(BookingChannel.ONLINE)
                .discountAmount(0L)
                .totalPrice(80000L)
                .bookingStatus(BookingStatus.PAID)
                .bookingTime(LocalDateTime.of(2026, 4, 12, 20, 0, 0))
                .build());
        createdBookingIds.add(bookingB1.getBookingId());

        bookingSeatRepository.save(BookingSeat.builder()
                .booking(bookingB1)
                .showtime(show1)
                .seat(seatC02)
                .price(80000L)
                .build());
    }

    @AfterEach
    void tearDown() {
        for (Integer bookingId : createdBookingIds) {
            bookingRepository.deleteById(bookingId);
        }
        createdBookingIds.clear();

        for (Integer userId : createdUserIds) {
            userRepository.deleteById(userId);
        }
        createdUserIds.clear();

        if (customerA != null) {
            User freshA = userRepository.findById(customerA.getUserId()).orElse(null);
            if (freshA != null) {
                freshA.setUsername(originalCustomerUsername);
                freshA.setPhone(originalCustomerPhone);
                userRepository.save(freshA);
            }
        }
    }

    @Test
    @DisplayName("1. GET /api/users/me/bookings - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    void getMyBookings_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/users/me/bookings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("2. GET /api/users/me/bookings - Token không hợp lệ trả về 401 UNAUTHORIZED")
    void getMyBookings_InvalidToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/users/me/bookings")
                        .header("Authorization", "Bearer invalid.jwt.token.here"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("3. GET /api/users/me/bookings - Đăng nhập bằng ADMIN hoặc STAFF thành công trả về 200 OK")
    void getMyBookings_AdminOrStaff_Returns200() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(adminUser);
        String staffToken = jwtTokenProvider.generateToken(staffUser);

        mockMvc.perform(get("/api/users/me/bookings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));

        mockMvc.perform(get("/api/users/me/bookings")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    @DisplayName("4 & 5. GET /api/users/me/bookings - CUSTOMER lấy đúng đơn của mình, mới nhất trước, cô lập dữ liệu với user khác")
    void getMyBookings_Customer_ReturnsOwnBookingsSortedAndIsolated() throws Exception {
        String tokenA = jwtTokenProvider.generateToken(customerA);
        String tokenB = jwtTokenProvider.generateToken(customerB);

        // User A sees A003 -> A002 -> A001 and NEVER sees B999
        mockMvc.perform(get("/api/users/me/bookings")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.content[*].bookingCode", not(hasItem("AKS-TEST-B999"))))
                .andExpect(jsonPath("$.content[0].bookingCode", is("AKS-TEST-A003")))
                .andExpect(jsonPath("$.content[0].status", is("CANCELLED")))
                .andExpect(jsonPath("$.content[1].bookingCode", is("AKS-TEST-A002")))
                .andExpect(jsonPath("$.content[1].status", is("PENDING")))
                .andExpect(jsonPath("$.content[1].seats", contains("B01")))
                .andExpect(jsonPath("$.content[2].bookingCode", is("AKS-TEST-A001")))
                .andExpect(jsonPath("$.content[2].status", is("PAID")))
                .andExpect(jsonPath("$.content[2].seats", contains("A08", "A09")))
                .andExpect(jsonPath("$.content[2].totalPrice", is(130000)))
                .andExpect(jsonPath("$.content[2].movieTitle").isNotEmpty())
                .andExpect(jsonPath("$.content[2].roomName").isNotEmpty())
                .andExpect(jsonPath("$.content[2].showtime").isNotEmpty())
                .andExpect(jsonPath("$.content[2].createdAt", is("2026-04-10T14:22:00")));

        // User B sees ONLY B999 and NEVER sees A's bookings
        mockMvc.perform(get("/api/users/me/bookings")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].bookingCode", is("AKS-TEST-B999")))
                .andExpect(jsonPath("$.content[0].seats", contains("C02")))
                .andExpect(jsonPath("$.content[*].bookingCode", not(hasItem("AKS-TEST-A001"))));
    }

    @Test
    @DisplayName("6 & 7. GET /api/users/me/bookings - Lọc theo status PAID, PENDING, CANCELLED chính xác")
    void getMyBookings_FilterByStatus_ReturnsMatchingStatusOnly() throws Exception {
        String tokenA = jwtTokenProvider.generateToken(customerA);

        mockMvc.perform(get("/api/users/me/bookings")
                        .param("status", "PAID")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("PAID"))));

        mockMvc.perform(get("/api/users/me/bookings")
                        .param("status", "PENDING")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("PENDING"))));

        mockMvc.perform(get("/api/users/me/bookings")
                        .param("status", "CANCELLED")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("CANCELLED"))));
    }

    @Test
    @DisplayName("8. GET /api/users/me/bookings - status không hợp lệ trả về 400 VALIDATION_ERROR")
    void getMyBookings_InvalidStatus_Returns400() throws Exception {
        String tokenA = jwtTokenProvider.generateToken(customerA);

        mockMvc.perform(get("/api/users/me/bookings")
                        .param("status", "INVALID")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("9. GET /api/users/me/bookings - User chưa từng đặt vé trả về 200 với content rỗng []")
    void getMyBookings_UserWithNoBookings_ReturnsEmptyList() throws Exception {
        String tokenEmpty = jwtTokenProvider.generateToken(customerEmpty);

        mockMvc.perform(get("/api/users/me/bookings")
                        .header("Authorization", "Bearer " + tokenEmpty))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    @DisplayName("10. PUT /api/users/me - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    void updateProfile_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"Nguyễn Văn A\",\"phone\":\"0912345678\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("11. PUT /api/users/me - Cập nhật username và phone hợp lệ trả về 200, lưu xuống DB và không lộ passwordHash")
    void updateProfile_ValidInput_UpdatesDbAndHidesPassword() throws Exception {
        String tokenA = jwtTokenProvider.generateToken(customerA);

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"Nguyễn Văn Akashi\",\"phone\":\"0987654321\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(customerA.getUserId())))
                .andExpect(jsonPath("$.username", is("Nguyễn Văn Akashi")))
                .andExpect(jsonPath("$.phone", is("0987654321")))
                .andExpect(jsonPath("$.email", is("customer@example.com")))
                .andExpect(jsonPath("$.role", is("CUSTOMER")))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());

        // Verify persistence in DB and via GET /api/users/me
        User updatedInDb = userRepository.findById(customerA.getUserId()).orElseThrow();
        assertThat(updatedInDb.getUsername()).isEqualTo("Nguyễn Văn Akashi");
        assertThat(updatedInDb.getPhone()).isEqualTo("0987654321");

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("Nguyễn Văn Akashi")))
                .andExpect(jsonPath("$.phone", is("0987654321")))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("12. PUT /api/users/me - Cố gửi role=ADMIN và email mới trong body không làm thay đổi role hay email trong DB (BR-USER-01, BR-ROLE-03)")
    void updateProfile_MassAssignmentAttempt_DoesNotChangeRoleOrEmail() throws Exception {
        String tokenA = jwtTokenProvider.generateToken(customerA);

        String maliciousJson = """
                {
                  "username": "Khách Hàng Hợp Lệ",
                  "phone": "0912345678",
                  "role": "ADMIN",
                  "email": "hacked@example.com",
                  "passwordHash": "hacked_hash"
                }
                """;

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("CUSTOMER")))
                .andExpect(jsonPath("$.email", is("customer@example.com")));

        User userInDb = userRepository.findById(customerA.getUserId()).orElseThrow();
        assertThat(userInDb.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(userInDb.getEmail()).isEqualTo("customer@example.com");
    }

    @Test
    @DisplayName("13. PUT /api/users/me - username rỗng hoặc phone sai định dạng trả về 400 VALIDATION_ERROR")
    void updateProfile_InvalidInput_Returns400() throws Exception {
        String tokenA = jwtTokenProvider.generateToken(customerA);

        // Blank username
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"   \",\"phone\":\"0912345678\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

        // Invalid phone format
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"Nguyễn Văn A\",\"phone\":\"12345abc\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }
}

