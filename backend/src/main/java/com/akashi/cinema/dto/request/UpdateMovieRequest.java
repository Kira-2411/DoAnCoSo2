package com.akashi.cinema.dto.request;

import com.akashi.cinema.enums.AgeLimit;
import com.akashi.cinema.enums.MovieStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class UpdateMovieRequest {

    @NotBlank(message = "Tên phim không được để trống")
    @Size(max = 255, message = "Tên phim tối đa 255 ký tự")
    private String title;

    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    @NotNull(message = "Thời lượng phim là bắt buộc")
    @Min(value = 1, message = "Thời lượng phim phải từ 1 đến 600 phút")
    @Max(value = 600, message = "Thời lượng phim phải từ 1 đến 600 phút")
    private Integer duration;

    @Size(max = 100, message = "Thể loại tối đa 100 ký tự")
    private String genre;

    @NotNull(message = "Giới hạn độ tuổi là bắt buộc")
    private AgeLimit ageLimit;

    @NotNull(message = "Ngày khởi chiếu là bắt buộc")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate releaseDate;

    @NotNull(message = "Trạng thái phim là bắt buộc")
    private MovieStatus movieStatus;

    @Size(max = 500, message = "Đường dẫn poster tối đa 500 ký tự")
    private String posterUrl;

    private Boolean isActive;

    public UpdateMovieRequest() {
    }

    public UpdateMovieRequest(String title, String description, Integer duration, String genre,
                              AgeLimit ageLimit, LocalDate releaseDate, MovieStatus movieStatus,
                              String posterUrl, Boolean isActive) {
        this.title = title != null ? title.trim() : null;
        this.description = description;
        this.duration = duration;
        this.genre = genre;
        this.ageLimit = ageLimit;
        this.releaseDate = releaseDate;
        this.movieStatus = movieStatus;
        this.posterUrl = posterUrl;
        this.isActive = isActive;
    }

    public String getTitle() {
        return title != null ? title.trim() : null;
    }

    public void setTitle(String title) {
        this.title = title != null ? title.trim() : null;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public AgeLimit getAgeLimit() {
        return ageLimit;
    }

    public void setAgeLimit(AgeLimit ageLimit) {
        this.ageLimit = ageLimit;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDate releaseDate) {
        this.releaseDate = releaseDate;
    }

    public MovieStatus getMovieStatus() {
        return movieStatus;
    }

    public void setMovieStatus(MovieStatus movieStatus) {
        this.movieStatus = movieStatus;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public void setPosterUrl(String posterUrl) {
        this.posterUrl = posterUrl;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String title;
        private String description;
        private Integer duration;
        private String genre;
        private AgeLimit ageLimit;
        private LocalDate releaseDate;
        private MovieStatus movieStatus;
        private String posterUrl;
        private Boolean isActive;

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder duration(Integer duration) {
            this.duration = duration;
            return this;
        }

        public Builder genre(String genre) {
            this.genre = genre;
            return this;
        }

        public Builder ageLimit(AgeLimit ageLimit) {
            this.ageLimit = ageLimit;
            return this;
        }

        public Builder releaseDate(LocalDate releaseDate) {
            this.releaseDate = releaseDate;
            return this;
        }

        public Builder movieStatus(MovieStatus movieStatus) {
            this.movieStatus = movieStatus;
            return this;
        }

        public Builder posterUrl(String posterUrl) {
            this.posterUrl = posterUrl;
            return this;
        }

        public Builder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public UpdateMovieRequest build() {
            return new UpdateMovieRequest(title, description, duration, genre, ageLimit, releaseDate, movieStatus, posterUrl, isActive);
        }
    }
}
