package com.akashi.cinema.controller;

import com.akashi.cinema.config.SecurityConfig;
import com.akashi.cinema.exception.GlobalExceptionHandler;
import com.akashi.cinema.security.CustomAccessDeniedHandler;
import com.akashi.cinema.security.CustomAuthenticationEntryPoint;
import com.akashi.cinema.security.JwtAuthenticationFilter;
import com.akashi.cinema.security.JwtTokenProvider;
import com.akashi.cinema.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class,
        GlobalExceptionHandler.class
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/auth/login với body JSON sai định dạng trả 400 và code VALIDATION_ERROR")
    void login_WithMalformedJson_Returns400AndValidationError() throws Exception {
        String malformedJson = "{ \"email\": \"test@example.com\", \"password\": ";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("Dữ liệu gửi lên không hợp lệ"));
    }

    @Test
    @DisplayName("GET /api/auth/me không có token trả 401 và code UNAUTHORIZED")
    void getCurrentUser_WithoutToken_Returns401AndUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("GET /api/auth/me với token có vai trò không còn tồn tại trả 401 thay vì 500")
    void getCurrentUser_WithInvalidRoleInToken_Returns401AndUnauthorized() throws Exception {
        String dummyToken = "dummy-token";
        when(jwtTokenProvider.validateToken(dummyToken)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(dummyToken)).thenReturn(1);
        when(jwtTokenProvider.getEmailFromToken(dummyToken)).thenReturn("user@example.com");
        when(jwtTokenProvider.getRoleFromToken(dummyToken)).thenReturn("NON_EXISTENT_ROLE");

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + dummyToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
