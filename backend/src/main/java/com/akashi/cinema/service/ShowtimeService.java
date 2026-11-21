package com.akashi.cinema.service;

import com.akashi.cinema.config.TimeConfig;
import com.akashi.cinema.dto.request.CreateShowtimeRequest;
import com.akashi.cinema.dto.request.UpdateShowtimeRequest;
import com.akashi.cinema.dto.response.ShowtimeResponse;
import com.akashi.cinema.entity.Booking;
import com.akashi.cinema.entity.Movie;
import com.akashi.cinema.entity.Room;
import com.akashi.cinema.entity.Showtime;
import com.akashi.cinema.enums.BookingStatus;
import com.akashi.cinema.enums.MovieStatus;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.BookingRepository;
import com.akashi.cinema.repository.MovieRepository;
import com.akashi.cinema.repository.RoomRepository;
import com.akashi.cinema.repository.SeatHoldRepository;
import com.akashi.cinema.repository.ShowtimeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShowtimeService {

    private static final Logger log = LoggerFactory.getLogger(ShowtimeService.class);
    private static final int CLEANING_MINUTES = 15; // BR-SHOW-01

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final SeatHoldRepository seatHoldRepository;

    public ShowtimeService(ShowtimeRepository showtimeRepository,
                           MovieRepository movieRepository,
                           RoomRepository roomRepository,
                           BookingRepository bookingRepository,
                           SeatHoldRepository seatHoldRepository) {
        this.showtimeRepository = showtimeRepository;
        this.movieRepository = movieRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.seatHoldRepository = seatHoldRepository;
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimes(LocalDate date, Integer movieId, Integer roomId) {
        if (date == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tham số ngày (date) là bắt buộc");
        }

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime startOfNextDay = date.plusDays(1).atStartOfDay();

        List<Showtime> showtimes = showtimeRepository.findActiveShowtimesByDate(
                startOfDay,
                startOfNextDay,
                movieId,
                roomId
        );

        return showtimes.stream()
                .map(s -> {
                    boolean hasPaid = bookingRepository.countPaidBookingsByShowId(s.getShowId()) > 0;
                    return ShowtimeResponse.from(s, hasPaid);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getAdminShowtimes(LocalDate date, Integer movieId, Integer roomId, String keyword) {
        LocalDateTime dateStart = date != null ? date.atStartOfDay() : null;
        LocalDateTime dateEnd = date != null ? date.plusDays(1).atStartOfDay() : null;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        LocalDateTime now = LocalDateTime.now(TimeConfig.VIETNAM_ZONE);

        List<Showtime> showtimes = showtimeRepository.searchAdminShowtimes(dateStart, dateEnd, movieId, roomId, kw, now);

        return showtimes.stream()
                .sorted((s1, s2) -> {
                    int p1 = !Boolean.TRUE.equals(s1.getIsActive()) ? 3 : (s1.getEndTime().isBefore(now) ? 2 : 1);
                    int p2 = !Boolean.TRUE.equals(s2.getIsActive()) ? 3 : (s2.getEndTime().isBefore(now) ? 2 : 1);
                    if (p1 != p2) {
                        return Integer.compare(p1, p2);
                    }
                    if (p1 == 1) {
                        return s1.getStartTime().compareTo(s2.getStartTime());
                    } else {
                        return s2.getStartTime().compareTo(s1.getStartTime());
                    }
                })
                .map(s -> {
                    boolean hasPaid = bookingRepository.countPaidBookingsByShowId(s.getShowId()) > 0;
                    return ShowtimeResponse.from(s, hasPaid);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ShowtimeResponse getShowtimeById(Integer showId) {
        Showtime showtime = showtimeRepository.findByIdWithMovieAndRoom(showId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy suất chiếu"));
        boolean hasPaid = bookingRepository.countPaidBookingsByShowId(showId) > 0;
        return ShowtimeResponse.from(showtime, hasPaid);
    }

    @Transactional
    public ShowtimeResponse createShowtime(CreateShowtimeRequest request) {
        // 1. Phim phải tồn tại, isActive = true và movieStatus != ENDED (BR-SHOW-03)
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phim không tồn tại"));
        if (!Boolean.TRUE.equals(movie.getIsActive())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phim đã bị ẩn, không thể tạo suất chiếu");
        }
        if (movie.getMovieStatus() == MovieStatus.ENDED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phim đã kết thúc chiếu (ENDED), không thể tạo suất chiếu");
        }

        // 2. Phòng chiếu phải tồn tại và isActive = true (BR-SHOW-03)
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phòng chiếu không tồn tại"));
        if (!Boolean.TRUE.equals(room.getIsActive())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phòng chiếu đã ngừng hoạt động");
        }

        // 3. Không tạo suất chiếu trong quá khứ (BR-SHOW-03)
        LocalDateTime now = LocalDateTime.now(TimeConfig.VIETNAM_ZONE);
        if (request.getStartTime().isBefore(now)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Không được tạo suất chiếu trong quá khứ");
        }

        // 4. Tự động tính endTime = startTime + duration + cleaning (BR-SHOW-01)
        LocalDateTime endTime = request.getStartTime()
                .plusMinutes(movie.getDuration())
                .plusMinutes(CLEANING_MINUTES);

        // 5. Kiểm tra không chồng giờ trong cùng phòng chiếu (BR-SHOW-02)
        List<Showtime> overlapping = showtimeRepository.findOverlappingShowtimes(
                room.getRoomId(),
                request.getStartTime(),
                endTime,
                null
        );
        if (!overlapping.isEmpty()) {
            throw new AppException(HttpStatus.CONFLICT, "SHOWTIME_OVERLAP", "Phòng chiếu đã có suất chiếu khác trùng thời gian này");
        }

        BigDecimal multiplier = request.getPriceMultiplier() != null ? request.getPriceMultiplier() : BigDecimal.valueOf(1.00);

        Showtime showtime = Showtime.builder()
                .movie(movie)
                .room(room)
                .startTime(request.getStartTime())
                .endTime(endTime)
                .priceMultiplier(multiplier)
                .isActive(true)
                .build();

        Showtime saved = showtimeRepository.save(showtime);
        log.info("Admin created showtime [showId={}, movie='{}', room='{}', start={}]",
                saved.getShowId(), movie.getTitle(), room.getRoomName(), saved.getStartTime());

        return ShowtimeResponse.from(saved, false);
    }

    @Transactional
    public ShowtimeResponse updateShowtime(Integer showId, UpdateShowtimeRequest request) {
        Showtime showtime = showtimeRepository.findByIdWithMovieAndRoom(showId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy suất chiếu"));

        // 1. Kiểm tra đơn đã thanh toán: không được đổi phòng, giờ bắt đầu hoặc phim (BR-SHOW-05)
        long paidCount = bookingRepository.countPaidBookingsByShowId(showId);
        boolean hasPaid = paidCount > 0;
        if (hasPaid) {
            boolean movieChanged = !showtime.getMovie().getMovieId().equals(request.getMovieId());
            boolean roomChanged = !showtime.getRoom().getRoomId().equals(request.getRoomId());
            boolean timeChanged = !showtime.getStartTime().isEqual(request.getStartTime());
            if (movieChanged || roomChanged || timeChanged) {
                throw new AppException(HttpStatus.CONFLICT, "HAS_PAID_BOOKINGS", "Suất chiếu đã có đơn thanh toán, không thể thay đổi thông tin");
            }
        }

        // 2. Validate phim (BR-SHOW-03)
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phim không tồn tại"));
        if (!Boolean.TRUE.equals(movie.getIsActive())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phim đã bị ẩn");
        }
        if (movie.getMovieStatus() == MovieStatus.ENDED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phim đã kết thúc chiếu (ENDED)");
        }

        // 3. Validate phòng (BR-SHOW-03)
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phòng chiếu không tồn tại"));
        if (!Boolean.TRUE.equals(room.getIsActive())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Phòng chiếu đã ngừng hoạt động");
        }

        // 4. Validate thời gian
        LocalDateTime now = LocalDateTime.now(TimeConfig.VIETNAM_ZONE);
        if (request.getStartTime().isBefore(now)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Không được đặt suất chiếu trong quá khứ");
        }

        // 5. Tự động tính endTime
        LocalDateTime endTime = request.getStartTime()
                .plusMinutes(movie.getDuration())
                .plusMinutes(CLEANING_MINUTES);

        // 6. Kiểm tra chồng giờ (bỏ qua chính showId này)
        List<Showtime> overlapping = showtimeRepository.findOverlappingShowtimes(
                room.getRoomId(),
                request.getStartTime(),
                endTime,
                showId
        );
        if (!overlapping.isEmpty()) {
            throw new AppException(HttpStatus.CONFLICT, "SHOWTIME_OVERLAP", "Phòng chiếu đã có suất chiếu khác trùng thời gian này");
        }

        showtime.setMovie(movie);
        showtime.setRoom(room);
        showtime.setStartTime(request.getStartTime());
        showtime.setEndTime(endTime);
        if (request.getPriceMultiplier() != null) {
            showtime.setPriceMultiplier(request.getPriceMultiplier());
        }

        Showtime updated = showtimeRepository.save(showtime);
        log.info("Admin updated showtime [showId={}, movie='{}', room='{}']",
                updated.getShowId(), movie.getTitle(), room.getRoomName());

        return ShowtimeResponse.from(updated, hasPaid);
    }

    @Transactional
    public void cancelShowtime(Integer showId) {
        Showtime showtime = showtimeRepository.findById(showId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy suất chiếu"));

        // Nếu đã hủy thì no-op
        if (!Boolean.TRUE.equals(showtime.getIsActive())) {
            return;
        }

        // Không hủy được khi còn đơn PAID (BR-SHOW-06)
        long paidCount = bookingRepository.countPaidBookingsByShowId(showId);
        if (paidCount > 0) {
            throw new AppException(HttpStatus.CONFLICT, "HAS_PAID_BOOKINGS", "Suất chiếu đã có đơn thanh toán, cần hủy các đơn đó trước");
        }

        // Hủy các đơn PENDING (BR-SHOW-06)
        List<Booking> pendingBookings = bookingRepository.findPendingBookingsByShowId(showId);
        for (Booking b : pendingBookings) {
            b.setBookingStatus(BookingStatus.CANCELLED);
        }
        bookingRepository.saveAll(pendingBookings);

        // Hủy/xóa các seat_holds của suất chiếu này (BR-SHOW-06)
        seatHoldRepository.deleteByShowId(showId);

        // Đặt isActive = false
        showtime.setIsActive(false);
        showtimeRepository.save(showtime);
        log.info("Admin cancelled showtime [showId={}]", showId);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveUnfinishedShowtimes(Integer movieId, LocalDateTime now) {
        return showtimeRepository.countActiveUnfinishedShowtimes(movieId, now) > 0;
    }
}
