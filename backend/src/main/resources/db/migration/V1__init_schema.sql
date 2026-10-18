-- Flyway migration V1: tạo toàn bộ bảng của Akashi Cinema (MySQL 8.0)
-- Database Akashi_Cinema do Docker tạo sẵn (MYSQL_DATABASE), file này không tạo database.


-- =====================================================================
-- 1. NHÓM HẠ TẦNG
-- =====================================================================

-- Rạp phim
CREATE TABLE theaters (
    theater_id    INT AUTO_INCREMENT PRIMARY KEY,
    theater_name  VARCHAR(255) NOT NULL,
    location      VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phòng chiếu
CREATE TABLE rooms (
    room_id     INT AUTO_INCREMENT PRIMARY KEY,
    theater_id  INT NOT NULL,
    room_name   VARCHAR(100) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT uk_rooms_theater_name UNIQUE (theater_id, room_name),
    CONSTRAINT fk_rooms_theater FOREIGN KEY (theater_id)
        REFERENCES theaters (theater_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loại ghế và giá gốc (đổi giá một loại ghế chỉ sửa 1 dòng ở đây)
CREATE TABLE seat_types (
    seat_type_id  INT AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(20) NOT NULL,          -- STANDARD, VIP, COUPLE
    name          VARCHAR(50) NOT NULL,          -- Ghế Thường, Ghế VIP, Ghế Couple
    base_price    BIGINT NOT NULL,               -- giá gốc ngày thường (VNĐ)
    people_count  TINYINT NOT NULL DEFAULT 1,    -- số người ngồi trên 1 ghế (Couple = 2)
    CONSTRAINT uk_seat_types_code UNIQUE (code),
    CONSTRAINT chk_seat_types_price CHECK (base_price >= 0),
    CONSTRAINT chk_seat_types_people CHECK (people_count >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ghế
CREATE TABLE seats (
    seat_id       INT AUTO_INCREMENT PRIMARY KEY,
    room_id       INT NOT NULL,
    seat_type_id  INT NOT NULL,
    row_num       INT NOT NULL,                  -- 1 = hàng A, 2 = hàng B, ...
    col_num       INT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT 1,    -- 0 = ghế hỏng, không cho chọn
    CONSTRAINT uk_seats_position UNIQUE (room_id, row_num, col_num),
    CONSTRAINT fk_seats_room FOREIGN KEY (room_id)
        REFERENCES rooms (room_id) ON DELETE RESTRICT,
    CONSTRAINT fk_seats_type FOREIGN KEY (seat_type_id)
        REFERENCES seat_types (seat_type_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. NHÓM NGƯỜI DÙNG VÀ XÁC THỰC
-- =====================================================================

-- Tài khoản (ADMIN, STAFF, CUSTOMER)
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,       -- chuỗi băm BCrypt, KHÔNG lưu mật khẩu gốc
    phone           VARCHAR(20) NULL,
    role            ENUM('ADMIN', 'STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    is_active       BOOLEAN NOT NULL DEFAULT 1,
    email_verified  BOOLEAN NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mã OTP gửi qua email (đăng ký, quên mật khẩu). Không có FK tới users
-- vì lúc đăng ký tài khoản chưa tồn tại.
CREATE TABLE email_otps (
    otp_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(150) NOT NULL,
    purpose     ENUM('REGISTER', 'RESET_PASSWORD') NOT NULL,
    code_hash   VARCHAR(255) NOT NULL,           -- OTP đã băm
    expires_at  DATETIME NOT NULL,
    attempts    INT NOT NULL DEFAULT 0,          -- số lần nhập sai
    used        BOOLEAN NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_otps_email_purpose (email, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. NHÓM PHIM VÀ SUẤT CHIẾU
-- =====================================================================

-- Phim
CREATE TABLE movies (
    movie_id      INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NULL,
    duration      INT NOT NULL,                  -- số phút
    genre         VARCHAR(100) NULL,
    age_limit     ENUM('P', 'T13', 'T16', 'T18') NOT NULL DEFAULT 'T13',
    release_date  DATE NULL,
    movie_status  ENUM('COMING_SOON', 'NOW_SHOWING', 'ENDED') NOT NULL DEFAULT 'COMING_SOON',
    poster_url    VARCHAR(500) NULL,
    is_active     BOOLEAN NOT NULL DEFAULT 1,    -- xóa mềm
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_movies_duration CHECK (duration > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suất chiếu
CREATE TABLE showtimes (
    show_id           INT AUTO_INCREMENT PRIMARY KEY,
    movie_id          INT NOT NULL,
    room_id           INT NOT NULL,
    start_time        DATETIME NOT NULL,
    end_time          DATETIME NOT NULL,         -- giờ bắt đầu + thời lượng + thời gian dọn phòng
    price_multiplier  DECIMAL(3,2) NOT NULL DEFAULT 1.00,  -- 1.00 thường, 1.20 ngày lễ
    is_active         BOOLEAN NOT NULL DEFAULT 1,          -- 0 = hủy suất
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_showtimes_room_start (room_id, start_time),
    INDEX idx_showtimes_movie_start (movie_id, start_time),
    CONSTRAINT fk_showtimes_movie FOREIGN KEY (movie_id)
        REFERENCES movies (movie_id) ON DELETE RESTRICT,
    CONSTRAINT fk_showtimes_room FOREIGN KEY (room_id)
        REFERENCES rooms (room_id) ON DELETE RESTRICT,
    CONSTRAINT chk_showtimes_time CHECK (end_time > start_time),
    CONSTRAINT chk_showtimes_multiplier CHECK (price_multiplier > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. NHÓM ĐỒ ĂN VÀ KHUYẾN MÃI
-- =====================================================================

-- Đồ ăn, nước uống
CREATE TABLE foods (
    food_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    price         BIGINT NOT NULL,               -- giá hiện tại (VNĐ)
    img           VARCHAR(500) NULL,
    category      VARCHAR(100) NULL,
    is_available  BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT chk_foods_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khuyến mãi
CREATE TABLE promotions (
    promo_id         INT AUTO_INCREMENT PRIMARY KEY,
    code             VARCHAR(50) NOT NULL,
    discount_type    ENUM('PERCENT', 'FIXED') NOT NULL,
    discount_value   BIGINT NOT NULL,            -- PERCENT: 1-100, FIXED: số tiền VNĐ
    expiry_date      DATETIME NOT NULL,
    min_order_value  BIGINT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT 1,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_promotions_code UNIQUE (code),
    CONSTRAINT chk_promotions_value CHECK (
        (discount_type = 'PERCENT' AND discount_value BETWEEN 1 AND 100)
        OR (discount_type = 'FIXED' AND discount_value > 0)
    ),
    CONSTRAINT chk_promotions_min CHECK (min_order_value >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. NHÓM ĐẶT VÉ
-- =====================================================================

-- Đơn đặt vé
CREATE TABLE bookings (
    booking_id       INT AUTO_INCREMENT PRIMARY KEY,
    booking_code     VARCHAR(20) NOT NULL,       -- mã công khai: in trên vé, QR, nội dung chuyển khoản
    user_id          INT NULL,                   -- NULL khi bán tại quầy cho khách vãng lai
    show_id          INT NOT NULL,
    promo_id         INT NULL,
    channel          ENUM('ONLINE', 'COUNTER') NOT NULL DEFAULT 'ONLINE',
    created_by       INT NULL,                   -- nhân viên bán tại quầy
    discount_amount  BIGINT NOT NULL DEFAULT 0,
    total_price      BIGINT NOT NULL,            -- số tiền phải trả sau giảm giá
    booking_status   ENUM('PENDING', 'PAID', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    expires_at       DATETIME NULL,              -- hạn thanh toán của đơn PENDING
    booking_time     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_bookings_code UNIQUE (booking_code),
    INDEX idx_bookings_user_time (user_id, booking_time),
    INDEX idx_bookings_show (show_id),
    INDEX idx_bookings_status_expires (booking_status, expires_at),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_show FOREIGN KEY (show_id)
        REFERENCES showtimes (show_id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_promo FOREIGN KEY (promo_id)
        REFERENCES promotions (promo_id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_created_by FOREIGN KEY (created_by)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_bookings_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_bookings_total CHECK (total_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ghế đang được giữ tạm (UNIQUE chặn 2 người giữ cùng 1 ghế)
CREATE TABLE seat_holds (
    hold_id       INT AUTO_INCREMENT PRIMARY KEY,
    show_id       INT NOT NULL,
    seat_id       INT NOT NULL,
    holder_token  VARCHAR(64) NOT NULL,          -- mã phiên của người giữ ghế
    booking_id    INT NULL,                      -- gán khi đơn được tạo
    price         BIGINT NOT NULL,               -- giá đã tính lúc giữ ghế
    expires_at    DATETIME NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_seat_holds_show_seat UNIQUE (show_id, seat_id),
    INDEX idx_seat_holds_expires (expires_at),
    CONSTRAINT fk_seat_holds_show FOREIGN KEY (show_id)
        REFERENCES showtimes (show_id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_holds_seat FOREIGN KEY (seat_id)
        REFERENCES seats (seat_id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_holds_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (booking_id) ON DELETE CASCADE,
    CONSTRAINT chk_seat_holds_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ghế đã bán trong đơn (UNIQUE chặn bán trùng 1 ghế trong cùng suất chiếu)
CREATE TABLE booking_seats (
    booking_seat_id  INT AUTO_INCREMENT PRIMARY KEY,
    booking_id       INT NOT NULL,
    show_id          INT NOT NULL,               -- lặp lại từ đơn để tạo được ràng buộc UNIQUE
    seat_id          INT NOT NULL,
    price            BIGINT NOT NULL,            -- giá ghế chốt tại thời điểm đặt
    CONSTRAINT uk_booking_seats_show_seat UNIQUE (show_id, seat_id),
    INDEX idx_booking_seats_booking (booking_id),
    CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_seats_show FOREIGN KEY (show_id)
        REFERENCES showtimes (show_id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id)
        REFERENCES seats (seat_id) ON DELETE RESTRICT,
    CONSTRAINT chk_booking_seats_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Đồ ăn trong đơn
CREATE TABLE booking_foods (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    booking_id  INT NOT NULL,
    food_id     INT NOT NULL,
    quantity    INT NOT NULL,
    unit_price  BIGINT NOT NULL,                 -- đơn giá chốt tại thời điểm đặt
    CONSTRAINT uk_booking_foods_booking_food UNIQUE (booking_id, food_id),
    CONSTRAINT fk_booking_foods_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_foods_food FOREIGN KEY (food_id)
        REFERENCES foods (food_id) ON DELETE RESTRICT,
    CONSTRAINT chk_booking_foods_qty CHECK (quantity > 0),
    CONSTRAINT chk_booking_foods_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. NHÓM THANH TOÁN
-- =====================================================================

-- Các lần thanh toán của một đơn (1 đơn có thể có nhiều lần)
CREATE TABLE payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    payment_method  ENUM('BANK_TRANSFER', 'CASH') NOT NULL,
    amount          BIGINT NOT NULL,
    transaction_id  VARCHAR(255) NULL,           -- mã giao dịch Casso; NULL với tiền mặt
    payment_status  ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    paid_at         DATETIME NULL,
    raw_payload     TEXT NULL,                   -- nguyên văn webhook Casso, phục vụ đối soát
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payments_transaction UNIQUE (transaction_id),
    INDEX idx_payments_booking (booking_id),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (booking_id) ON DELETE RESTRICT,
    CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. NHÓM NỘI DUNG WEBSITE
-- =====================================================================

-- Tin tức
CREATE TABLE news (
    news_id     INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    content     TEXT NULL,
    image_url   VARCHAR(500) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

