-- Flyway migration V2: dữ liệu mẫu cho môi trường PHÁT TRIỂN.
-- Không dùng cho môi trường chạy thật (có tài khoản với mật khẩu công khai).
--
-- Tài khoản mẫu (cùng mật khẩu dev: Akashi@2026):
--   admin@example.com     ADMIN
--   staff@example.com     STAFF
--   customer@example.com  CUSTOMER
--
-- Các suất chiếu tính theo ngày chạy migration (ngày mai, ngày kia, ngày kế tiếp),
-- nên nếu để lâu rồi dựng lại database thì suất chiếu sẽ tự dời theo ngày mới.

-- 1. Rạp và phòng chiếu
INSERT INTO theaters (theater_id, theater_name, location) VALUES
    (1, 'Akashi Cinema Đà Nẵng', '24 Phan Anh');

INSERT INTO rooms (room_id, theater_id, room_name) VALUES
    (1, 1, 'Phòng 1'),
    (2, 1, 'Phòng 2');

-- 2. Loại ghế và giá gốc
INSERT INTO seat_types (seat_type_id, code, name, base_price, people_count) VALUES
    (1, 'STANDARD', 'Ghế Thường', 60000, 1),
    (2, 'VIP',      'Ghế VIP',    90000, 1),
    (3, 'COUPLE',   'Ghế Couple', 160000, 2);

-- 3. Ghế: mỗi phòng 96 ghế (hàng A-C thường, D-F VIP, mỗi hàng 15 ghế; hàng G couple 6 ghế)
INSERT INTO seats (room_id, seat_type_id, row_num, col_num) VALUES
    (1, 1, 1, 1), (1, 1, 1, 2), (1, 1, 1, 3), (1, 1, 1, 4), (1, 1, 1, 5), (1, 1, 1, 6), (1, 1, 1, 7), (1, 1, 1, 8), (1, 1, 1, 9), (1, 1, 1, 10), (1, 1, 1, 11), (1, 1, 1, 12), (1, 1, 1, 13), (1, 1, 1, 14), (1, 1, 1, 15),
    (1, 1, 2, 1), (1, 1, 2, 2), (1, 1, 2, 3), (1, 1, 2, 4), (1, 1, 2, 5), (1, 1, 2, 6), (1, 1, 2, 7), (1, 1, 2, 8), (1, 1, 2, 9), (1, 1, 2, 10), (1, 1, 2, 11), (1, 1, 2, 12), (1, 1, 2, 13), (1, 1, 2, 14), (1, 1, 2, 15),
    (1, 1, 3, 1), (1, 1, 3, 2), (1, 1, 3, 3), (1, 1, 3, 4), (1, 1, 3, 5), (1, 1, 3, 6), (1, 1, 3, 7), (1, 1, 3, 8), (1, 1, 3, 9), (1, 1, 3, 10), (1, 1, 3, 11), (1, 1, 3, 12), (1, 1, 3, 13), (1, 1, 3, 14), (1, 1, 3, 15),
    (1, 2, 4, 1), (1, 2, 4, 2), (1, 2, 4, 3), (1, 2, 4, 4), (1, 2, 4, 5), (1, 2, 4, 6), (1, 2, 4, 7), (1, 2, 4, 8), (1, 2, 4, 9), (1, 2, 4, 10), (1, 2, 4, 11), (1, 2, 4, 12), (1, 2, 4, 13), (1, 2, 4, 14), (1, 2, 4, 15),
    (1, 2, 5, 1), (1, 2, 5, 2), (1, 2, 5, 3), (1, 2, 5, 4), (1, 2, 5, 5), (1, 2, 5, 6), (1, 2, 5, 7), (1, 2, 5, 8), (1, 2, 5, 9), (1, 2, 5, 10), (1, 2, 5, 11), (1, 2, 5, 12), (1, 2, 5, 13), (1, 2, 5, 14), (1, 2, 5, 15),
    (1, 2, 6, 1), (1, 2, 6, 2), (1, 2, 6, 3), (1, 2, 6, 4), (1, 2, 6, 5), (1, 2, 6, 6), (1, 2, 6, 7), (1, 2, 6, 8), (1, 2, 6, 9), (1, 2, 6, 10), (1, 2, 6, 11), (1, 2, 6, 12), (1, 2, 6, 13), (1, 2, 6, 14), (1, 2, 6, 15),
    (1, 3, 7, 1), (1, 3, 7, 2), (1, 3, 7, 3), (1, 3, 7, 4), (1, 3, 7, 5), (1, 3, 7, 6);

INSERT INTO seats (room_id, seat_type_id, row_num, col_num) VALUES
    (2, 1, 1, 1), (2, 1, 1, 2), (2, 1, 1, 3), (2, 1, 1, 4), (2, 1, 1, 5), (2, 1, 1, 6), (2, 1, 1, 7), (2, 1, 1, 8), (2, 1, 1, 9), (2, 1, 1, 10), (2, 1, 1, 11), (2, 1, 1, 12), (2, 1, 1, 13), (2, 1, 1, 14), (2, 1, 1, 15),
    (2, 1, 2, 1), (2, 1, 2, 2), (2, 1, 2, 3), (2, 1, 2, 4), (2, 1, 2, 5), (2, 1, 2, 6), (2, 1, 2, 7), (2, 1, 2, 8), (2, 1, 2, 9), (2, 1, 2, 10), (2, 1, 2, 11), (2, 1, 2, 12), (2, 1, 2, 13), (2, 1, 2, 14), (2, 1, 2, 15),
    (2, 1, 3, 1), (2, 1, 3, 2), (2, 1, 3, 3), (2, 1, 3, 4), (2, 1, 3, 5), (2, 1, 3, 6), (2, 1, 3, 7), (2, 1, 3, 8), (2, 1, 3, 9), (2, 1, 3, 10), (2, 1, 3, 11), (2, 1, 3, 12), (2, 1, 3, 13), (2, 1, 3, 14), (2, 1, 3, 15),
    (2, 2, 4, 1), (2, 2, 4, 2), (2, 2, 4, 3), (2, 2, 4, 4), (2, 2, 4, 5), (2, 2, 4, 6), (2, 2, 4, 7), (2, 2, 4, 8), (2, 2, 4, 9), (2, 2, 4, 10), (2, 2, 4, 11), (2, 2, 4, 12), (2, 2, 4, 13), (2, 2, 4, 14), (2, 2, 4, 15),
    (2, 2, 5, 1), (2, 2, 5, 2), (2, 2, 5, 3), (2, 2, 5, 4), (2, 2, 5, 5), (2, 2, 5, 6), (2, 2, 5, 7), (2, 2, 5, 8), (2, 2, 5, 9), (2, 2, 5, 10), (2, 2, 5, 11), (2, 2, 5, 12), (2, 2, 5, 13), (2, 2, 5, 14), (2, 2, 5, 15),
    (2, 2, 6, 1), (2, 2, 6, 2), (2, 2, 6, 3), (2, 2, 6, 4), (2, 2, 6, 5), (2, 2, 6, 6), (2, 2, 6, 7), (2, 2, 6, 8), (2, 2, 6, 9), (2, 2, 6, 10), (2, 2, 6, 11), (2, 2, 6, 12), (2, 2, 6, 13), (2, 2, 6, 14), (2, 2, 6, 15),
    (2, 3, 7, 1), (2, 3, 7, 2), (2, 3, 7, 3), (2, 3, 7, 4), (2, 3, 7, 5), (2, 3, 7, 6);

-- 4. Tài khoản mẫu (mật khẩu đã băm BCrypt)
INSERT INTO users (user_id, username, email, password_hash, phone, role, is_active, email_verified) VALUES
    (1, 'Quản trị viên', 'admin@example.com',    '$2b$10$P0XacF4Plh.Nb1vgo8qEkOceOYa.muBjBJeN3huDfAvM3I0HGekp6', NULL, 'ADMIN',    1, 1),
    (2, 'Nhân viên quầy', 'staff@example.com',   '$2b$10$YxIpFVE45adhd7hW5Pl4N.oSaqVUDk8DEnuvxySCoybWqIZ915Dke', NULL, 'STAFF',    1, 1),
    (3, 'Khách hàng mẫu', 'customer@example.com','$2b$10$XsKSyji/6Uqity1bIO/SHegeHGXuodWJ7/Mktc8HMl1MNAC8qIl/G', NULL, 'CUSTOMER', 1, 1);

-- 5. Phim (nội dung tự đặt cho môi trường thử)
INSERT INTO movies (movie_id, title, description, duration, genre, age_limit, release_date, movie_status) VALUES
    (1, 'Hành Trình Về Phía Biển', 'Hai anh em đi dọc miền Trung để tìm lại ngôi nhà tuổi thơ.', 120, 'Tâm lý, Gia đình', 'P',   CURDATE() - INTERVAL 10 DAY, 'NOW_SHOWING'),
    (2, 'Thám Tử Phố Cổ',          'Một vụ mất tích bí ẩn giữa những con phố cổ về đêm.',          105, 'Hình sự, Bí ẩn',   'T16', CURDATE() - INTERVAL 7 DAY,  'NOW_SHOWING'),
    (3, 'Đêm Cuối Ở Hội An',       'Chuyến du lịch cuối năm của nhóm bạn thân thay đổi mọi thứ.',  130, 'Lãng mạn, Hài',    'T13', CURDATE() - INTERVAL 3 DAY,  'NOW_SHOWING'),
    (4, 'Tiếng Gọi Từ Rừng Sâu',   'Đoàn thám hiểm lạc vào cánh rừng không có trên bản đồ.',       115, 'Phiêu lưu',        'T13', CURDATE() + INTERVAL 14 DAY, 'COMING_SOON'),
    (5, 'Mùa Hè Cuối Cùng',        'Câu chuyện tình bạn trong mùa hè trước khi rời ghế nhà trường.', 98, 'Học đường',        'P',   CURDATE() - INTERVAL 90 DAY, 'ENDED');

-- 6. Suất chiếu (end_time = giờ bắt đầu + thời lượng phim + 15 phút dọn phòng)
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price_multiplier) VALUES
    (1, 1, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '18:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '18:00:00') + INTERVAL 135 MINUTE, 1.00),
    (2, 1, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '20:30:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '20:30:00') + INTERVAL 120 MINUTE, 1.00),
    (3, 2, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '19:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '19:00:00') + INTERVAL 145 MINUTE, 1.00),
    (3, 2, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '21:45:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '21:45:00') + INTERVAL 145 MINUTE, 1.00),
    (1, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:00:00') + INTERVAL 135 MINUTE, 1.20),
    (3, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '17:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '17:00:00') + INTERVAL 145 MINUTE, 1.20),
    (2, 2, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '19:30:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '19:30:00') + INTERVAL 120 MINUTE, 1.20),
    (2, 1, TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '19:00:00'), TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '19:00:00') + INTERVAL 120 MINUTE, 1.00),
    (1, 2, TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '20:00:00'), TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '20:00:00') + INTERVAL 135 MINUTE, 1.00);

-- 7. Đồ ăn, nước uống
INSERT INTO foods (food_id, name, price, category) VALUES
    (1, 'Bắp ngọt (vừa)',        45000,  'Bắp'),
    (2, 'Bắp phô mai (vừa)',     55000,  'Bắp'),
    (3, 'Nước ngọt ly lớn',      30000,  'Nước'),
    (4, 'Combo 1 bắp 1 nước',    65000,  'Combo'),
    (5, 'Combo 2 bắp 2 nước',    120000, 'Combo');

-- 8. Khuyến mãi
INSERT INTO promotions (promo_id, code, discount_type, discount_value, expiry_date, min_order_value) VALUES
    (1, 'GIAM10',  'PERCENT', 10,    TIMESTAMP(CURDATE() + INTERVAL 60 DAY, '23:59:59'), 100000),
    (2, 'GIAM20K', 'FIXED',   20000, TIMESTAMP(CURDATE() + INTERVAL 60 DAY, '23:59:59'), 150000);

-- 9. Tin tức
INSERT INTO news (title, content) VALUES
    ('Khai trương Akashi Cinema', 'Akashi Cinema chính thức mở cửa với hai phòng chiếu hiện đại.'),
    ('Ưu đãi cuối tuần cho thành viên', 'Nhập mã GIAM10 để được giảm 10% cho đơn từ 100.000đ.');
