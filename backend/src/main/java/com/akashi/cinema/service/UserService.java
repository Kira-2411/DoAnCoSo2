package com.akashi.cinema.service;

import com.akashi.cinema.dto.request.UpdateProfileRequest;
import com.akashi.cinema.dto.response.BookingHistoryResponse;
import com.akashi.cinema.dto.response.PageResponse;
import com.akashi.cinema.dto.response.UserResponse;
import com.akashi.cinema.entity.Booking;
import com.akashi.cinema.entity.BookingSeat;
import com.akashi.cinema.entity.SeatHold;
import com.akashi.cinema.entity.User;
import com.akashi.cinema.enums.BookingStatus;
import com.akashi.cinema.enums.Role;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.BookingRepository;
import com.akashi.cinema.repository.BookingSeatRepository;
import com.akashi.cinema.repository.SeatHoldRepository;
import com.akashi.cinema.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatHoldRepository seatHoldRepository;

    public UserService(UserRepository userRepository,
                       BookingRepository bookingRepository,
                       BookingSeatRepository bookingSeatRepository,
                       SeatHoldRepository seatHoldRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.seatHoldRepository = seatHoldRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingHistoryResponse> getMyBookings(Integer userId, String statusStr, int page, int size) {
        if (page < 0 || size <= 0 || size > MAX_PAGE_SIZE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Tham số phân trang không hợp lệ (page >= 0, 1 <= size <= " + MAX_PAGE_SIZE + ")"
            );
        }

        BookingStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                status = BookingStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new AppException(
                        HttpStatus.BAD_REQUEST,
                        "VALIDATION_ERROR",
                        "Trạng thái đơn đặt vé không hợp lệ: " + statusStr
                );
            }
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("bookingTime"), Sort.Order.desc("bookingId"))
        );

        Page<Booking> bookingPage = bookingRepository.findByUserIdAndStatus(userId, status, pageable);

        if (bookingPage.isEmpty()) {
            return PageResponse.from(
                    bookingPage,
                    b -> BookingHistoryResponse.from(b, Collections.emptyList())
            );
        }

        List<Integer> bookingIds = new ArrayList<>(bookingPage.getNumberOfElements());
        for (Booking booking : bookingPage.getContent()) {
            bookingIds.add(booking.getBookingId());
        }

        Map<Integer, List<String>> seatsByBookingId = new HashMap<>();

        List<BookingSeat> bookingSeats = bookingSeatRepository.findByBookingIdsWithSeat(bookingIds);
        for (BookingSeat bs : bookingSeats) {
            Integer bId = bs.getBooking().getBookingId();
            seatsByBookingId.computeIfAbsent(bId, k -> new ArrayList<>())
                    .add(bs.getSeat().getFormattedLabel());
        }

        List<SeatHold> seatHolds = seatHoldRepository.findByBookingIdsWithSeat(bookingIds);
        for (SeatHold sh : seatHolds) {
            Integer bId = sh.getBooking().getBookingId();
            if (!bookingSeatsPresentFor(bookingSeats, bId)) {
                seatsByBookingId.computeIfAbsent(bId, k -> new ArrayList<>())
                        .add(sh.getSeat().getFormattedLabel());
            }
        }

        return PageResponse.from(
                bookingPage,
                booking -> BookingHistoryResponse.from(
                        booking,
                        seatsByBookingId.getOrDefault(booking.getBookingId(), Collections.emptyList())
                )
        );
    }

    private boolean bookingSeatsPresentFor(List<BookingSeat> bookingSeats, Integer bookingId) {
        for (BookingSeat bs : bookingSeats) {
            if (bookingId.equals(bs.getBooking().getBookingId())) {
                return true;
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản này đã bị khóa, vui lòng đăng nhập bằng tài khoản khác");
        }

        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy người dùng"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản này đã bị khóa, vui lòng đăng nhập bằng tài khoản khác");
        }

        user.setUsername(request.getUsername().trim());
        user.setPhone(request.getPhone().trim());

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(String roleStr, String keyword, int page, int size) {
        if (page < 0 || size <= 0 || size > MAX_PAGE_SIZE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Tham số phân trang không hợp lệ (page >= 0, 1 <= size <= " + MAX_PAGE_SIZE + ")"
            );
        }

        Role role = null;
        if (roleStr != null && !roleStr.trim().isEmpty() && !roleStr.trim().equalsIgnoreCase("ALL")) {
            try {
                role = Role.valueOf(roleStr.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vai trò không hợp lệ: " + roleStr);
            }
        }

        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.searchUsers(role, kw, pageable);

        return PageResponse.from(userPage, UserResponse::from);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUserRole(Integer targetUserId, Role newRole, Integer currentAdminId) {
        if (newRole == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vai trò không được để trống");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));

        // BR-ROLE-04: Admin không được tự hạ quyền của chính mình
        if (targetUserId.equals(currentAdminId) && newRole != Role.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không thể tự hạ vai trò quản trị của chính mình");
        }

        // BR-ROLE-04: Không được hạ quyền Admin cuối cùng đang hoạt động
        if (target.getRole() == Role.ADMIN && newRole != Role.ADMIN) {
            long activeAdmins = userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
            if (Boolean.TRUE.equals(target.getIsActive()) && activeAdmins <= 1) {
                throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không thể hạ quyền Admin cuối cùng của hệ thống");
            }
        }

        target.setRole(newRole);
        User saved = userRepository.save(target);
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse updateUserStatus(Integer targetUserId, Boolean isActive, Integer currentAdminId) {
        if (isActive == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Trạng thái hoạt động không được để trống");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng"));

        // BR-ROLE-04: Admin không được tự khóa chính mình
        if (targetUserId.equals(currentAdminId) && Boolean.FALSE.equals(isActive)) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không thể tự khóa tài khoản của chính mình");
        }

        // BR-ROLE-04: Không được khóa Admin cuối cùng đang hoạt động
        if (target.getRole() == Role.ADMIN && Boolean.FALSE.equals(isActive)) {
            long activeAdmins = userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
            if (Boolean.TRUE.equals(target.getIsActive()) && activeAdmins <= 1) {
                throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Không thể khóa tài khoản Admin cuối cùng của hệ thống");
            }
        }

        target.setIsActive(isActive);
        User saved = userRepository.save(target);
        return UserResponse.from(saved);
    }
}
