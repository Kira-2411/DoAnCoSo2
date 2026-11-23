package com.akashi.cinema;

import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.Role;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User staffUser;
    private User customerUser;

    private final List<Integer> createdUserIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM users WHERE email LIKE 'admin2_%' OR email LIKE 'locked_%'");
        jdbcTemplate.update("UPDATE users SET is_active = 0 WHERE role = 'ADMIN' AND email != 'admin@example.com'");

        adminUser = userRepository.findByEmail("admin@example.com").orElseThrow();
        staffUser = userRepository.findByEmail("staff@example.com").orElseThrow();
        customerUser = userRepository.findByEmail("customer@example.com").orElseThrow();

        // Đảm bảo trạng thái ban đầu của seed users luôn chuẩn
        adminUser.setIsActive(true);
        adminUser.setRole(Role.ADMIN);
        userRepository.save(adminUser);

        customerUser.setIsActive(true);
        customerUser.setRole(Role.CUSTOMER);
        userRepository.save(customerUser);
    }

    @AfterEach
    void tearDown() {
        for (Integer userId : createdUserIds) {
            jdbcTemplate.update("DELETE FROM users WHERE user_id = ?", userId);
        }
        createdUserIds.clear();

        // Khôi phục lại trạng thái cho customerUser
        customerUser.setIsActive(true);
        customerUser.setRole(Role.CUSTOMER);
        userRepository.save(customerUser);
    }

    private User createTestUser(String username, String email, Role role, boolean isActive) {
        User u = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123"))
                .phone("0901234567")
                .role(role)
                .emailVerified(true)
                .isActive(isActive)
                .build();
        User saved = userRepository.save(u);
        createdUserIds.add(saved.getUserId());
        return saved;
    }

    @Test
    @DisplayName("1. GET /api/users: Admin lấy danh sách người dùng phân trang thành công")
    void getUsers_Admin_ReturnsPagedUsers() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.content[0].userId").isNumber())
                .andExpect(jsonPath("$.content[0].username").isString())
                .andExpect(jsonPath("$.content[0].email").isString())
                .andExpect(jsonPath("$.content[0].role").isString())
                .andExpect(jsonPath("$.content[0].isActive").isBoolean())
                .andExpect(jsonPath("$.totalPages").isNumber())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("2. GET /api/users: Lọc theo vai trò và tìm kiếm từ khóa")
    void getUsers_FilterByRoleAndKeyword() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .param("role", "STAFF")
                        .param("keyword", "staff"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].email").value("staff@example.com"))
                .andExpect(jsonPath("$.content[0].role").value("STAFF"));
    }

    @Test
    @DisplayName("3. GET /api/users/{id}: Admin xem chi tiết người dùng và xử lý 404 khi không tồn tại")
    void getUserById_Admin_SuccessAndNotFound() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        // Xem thành công
        mockMvc.perform(get("/api/users/" + customerUser.getUserId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(customerUser.getUserId()))
                .andExpect(jsonPath("$.email").value("customer@example.com"));

        // ID không tồn tại
        mockMvc.perform(get("/api/users/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("4. Bảo mật: Chưa đăng nhập trả 401, STAFF gọi trả 403 FORBIDDEN")
    void getUsers_Security_RequiresAdmin() throws Exception {
        // Chưa đăng nhập
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());

        // STAFF gọi
        String staffToken = jwtTokenProvider.generateToken(staffUser);
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("5. PATCH /api/users/{id}/role: Admin đổi vai trò của người dùng thành công")
    void updateUserRole_Admin_Success() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        String body = """
                {
                  "role": "STAFF"
                }
                """;

        mockMvc.perform(patch("/api/users/" + customerUser.getUserId() + "/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STAFF"));

        User reloaded = userRepository.findById(customerUser.getUserId()).orElseThrow();
        assertThat(reloaded.getRole()).isEqualTo(Role.STAFF);
    }

    @Test
    @DisplayName("6. BR-ROLE-04: Admin không được tự hạ quyền của chính mình")
    void updateUserRole_AdminCannotDemoteSelf() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        String body = """
                {
                  "role": "CUSTOMER"
                }
                """;

        mockMvc.perform(patch("/api/users/" + adminUser.getUserId() + "/role")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("7. BR-ROLE-04: Không được hạ quyền Admin cuối cùng của hệ thống")
    void updateUserRole_CannotDemoteLastActiveAdmin() throws Exception {
        // Tạo thêm admin2 để có token hợp lệ của Admin gọi API
        String uniqueEmail = "admin2_" + UUID.randomUUID().toString().substring(0, 6) + "@example.com";
        User secondAdmin = createTestUser("Admin 2", uniqueEmail, Role.ADMIN, true);
        String secondAdminToken = jwtTokenProvider.generateToken(secondAdmin);

        // Vô hiệu hóa secondAdmin để secondAdmin không còn là admin active -> hệ thống chỉ còn đúng 1 active admin là adminUser
        secondAdmin.setIsActive(false);
        userRepository.saveAndFlush(secondAdmin);

        // secondAdmin dùng token để cố hạ quyền adminUser (Admin active duy nhất còn lại)
        String body = """
                {
                  "role": "STAFF"
                }
                """;

        mockMvc.perform(patch("/api/users/" + adminUser.getUserId() + "/role")
                        .header("Authorization", "Bearer " + secondAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Không thể hạ quyền Admin cuối cùng của hệ thống"));
    }

    @Test
    @DisplayName("8. PATCH /api/users/{id}/status: Admin khóa và mở khóa tài khoản thành công")
    void updateUserStatus_Admin_LocksAndUnlocksUser() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        // 1. Khóa tài khoản
        String lockBody = """
                {
                  "isActive": false
                }
                """;

        mockMvc.perform(patch("/api/users/" + customerUser.getUserId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(lockBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));

        User lockedUser = userRepository.findById(customerUser.getUserId()).orElseThrow();
        assertFalse(lockedUser.getIsActive());

        // 2. Mở khóa lại
        String unlockBody = """
                {
                  "isActive": true
                }
                """;

        mockMvc.perform(patch("/api/users/" + customerUser.getUserId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unlockBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(true));

        User unlockedUser = userRepository.findById(customerUser.getUserId()).orElseThrow();
        assertTrue(unlockedUser.getIsActive());
    }

    @Test
    @DisplayName("9. BR-ROLE-04: Admin không được tự khóa chính mình")
    void updateUserStatus_AdminCannotLockSelf() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        String body = """
                {
                  "isActive": false
                }
                """;

        mockMvc.perform(patch("/api/users/" + adminUser.getUserId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("10. BR-AUTH-10: Khi tài khoản bị khóa, đăng nhập trả đúng mã lỗi và thông báo theo yêu cầu")
    void login_WhenAccountLocked_ReturnsSpecificErrorMessage() throws Exception {
        String token = jwtTokenProvider.generateToken(adminUser);

        // Tạo tài khoản test riêng với mật khẩu biết trước "Password123"
        String uniqueEmail = "locked_" + UUID.randomUUID().toString().substring(0, 6) + "@example.com";
        User lockedUser = createTestUser("Locked User", uniqueEmail, Role.CUSTOMER, true);

        // Khóa tài khoản
        String lockBody = """
                {
                  "isActive": false
                }
                """;

        mockMvc.perform(patch("/api/users/" + lockedUser.getUserId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(lockBody))
                .andExpect(status().isOk());

        // Thử đăng nhập bằng tài khoản bị khóa với đúng mật khẩu Password123
        String loginBody = String.format("""
                {
                  "email": "%s",
                  "password": "Password123"
                }
                """, uniqueEmail);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"))
                .andExpect(jsonPath("$.message").value("Tài khoản này đã bị khóa, vui lòng đăng nhập bằng tài khoản khác"));
    }
}
