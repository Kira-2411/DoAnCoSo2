package com.akashi.cinema.service;

import com.akashi.cinema.dto.response.ShowtimeResponse;
import com.akashi.cinema.entity.Showtime;
import com.akashi.cinema.exception.AppException;
import com.akashi.cinema.repository.ShowtimeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;

    public ShowtimeService(ShowtimeRepository showtimeRepository) {
        this.showtimeRepository = showtimeRepository;
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
                .map(ShowtimeResponse::from)
                .toList();
    }
}

