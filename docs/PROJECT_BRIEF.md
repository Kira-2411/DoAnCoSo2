# 📄 Project Brief - Akashi Cinema

## 1. Giới thiệu dự án
**Akashi Cinema** là hệ thống quản lý rạp chiếu phim và hỗ trợ người dùng đặt vé trực tuyến, được phát triển phục vụ cho môn học Đồ Án Cơ Sở 2. Hệ thống cung cấp trải nghiệm đặt vé nhanh chóng, tiện lợi cho khách hàng và công cụ quản trị toàn diện cho ban quản lý cụm rạp.

## 2. Mục tiêu hệ thống
- Tối ưu quy trình đặt vé và thanh toán trực tuyến cho khách hàng.
- Quản lý danh mục phim, lịch chiếu, phòng chiếu và sơ đồ ghế ngồi theo thời gian thực.
- Thống kê doanh thu, báo cáo số lượng vé bán theo ngày, tuần, tháng.

## 3. Kiến trúc công nghệ
- **Backend**: Java 17, Spring Boot 3, Spring Data JPA, Spring Security, JWT, Flyway, MySQL.
- **Frontend**: React (Vite), React Router, Axios, CSS Modules / Vanilla CSS.
- **Hạ tầng & Triển khai**: Docker, Docker Compose.

## 4. Các phân hệ chính
1. **Khách hàng (Client)**:
   - Tra cứu phim đang chiếu, sắp chiếu, thông tin chi tiết phim.
   - Chọn suất chiếu, rạp chiếu, chọn ghế theo sơ đồ trực quan.
   - Thanh toán và nhận mã vé điện tử (QR Code).
   - Lịch sử đặt vé và tích lũy điểm thành viên.
2. **Quản trị viên (Admin / Manager)**:
   - Quản lý phim, thể loại, đạo diễn, diễn viên.
   - Quản lý rạp, phòng chiếu, loại ghế (Standard, VIP, Sweetbox) và giá vé.
   - Lên lịch suất chiếu tránh trùng phòng/khung giờ.
   - Quản lý nhân viên, người dùng và phân quyền.
   - Báo cáo thống kê doanh thu.
