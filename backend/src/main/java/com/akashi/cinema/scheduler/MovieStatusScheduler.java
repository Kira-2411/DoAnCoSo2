package com.akashi.cinema.scheduler;

import com.akashi.cinema.service.MovieService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MovieStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(MovieStatusScheduler.class);
    private final MovieService movieService;

    public MovieStatusScheduler(MovieService movieService) {
        this.movieService = movieService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("MovieStatusScheduler: scanning and updating movie statuses on application startup...");
        movieService.autoUpdateMovieStatuses();
    }

    // Chạy hàng ngày vào lúc 00:00:00 theo giờ Việt Nam (Asia/Ho_Chi_Minh)
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Ho_Chi_Minh")
    public void scheduleDailyStatusUpdate() {
        log.info("MovieStatusScheduler: executing daily scheduled movie status update...");
        movieService.autoUpdateMovieStatuses();
    }
}
