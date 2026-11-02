# KẾ HOẠCH PHÂN CHIA TASK CHO DEV BACKEND: THAY THẾ MOCK DATA THÀNH DỮ LIỆU THẬT

> **Mục tiêu:** Xây dựng các API truy vấn dữ liệu (Read/Query APIs) từ database MySQL để thay thế toàn bộ Mock Data hiện tại ở Frontend (`HomePage`, `ShowtimePage`, `MoviePage`, `FoodPage`, `NewsPage`, `UserPage`).  
> **Phạm vi nghiêm ngặt:** Chỉ viết API đọc/lấy dữ liệu từ database, **CHƯA viết các logic chức năng phức tạp** (như giữ ghế realtime, tính giá khuyến mãi phức tạp, tạo đơn, thanh toán Casso, hay CRUD quản trị Admin).  
> **Quy chuẩn bắt buộc:** Đọc kỹ và tuân thủ tuyệt đối [AGENTS.md](file:///d:/DoAnCoSo/DoAnCoSo2/AGENTS.md) và hợp đồng [docs/API.md](file:///d:/DoAnCoSo/DoAnCoSo2/docs/API.md).

---

## 📌 TASK 1: API Phim (Movies API) – Thay thế Mock Data Trang Chủ & Trang Phim
- **Người thực hiện đề xuất:** Backend Dev 1
- **Nhãn (Labels):** `backend`, `api-read`, `movies`
- **Mục tiêu thay thế:** Thay thế `HOT_MOVIES` trong `HomePage.jsx` và `NOW_SHOWING_MOVIES`, `COMING_SOON_MOVIES` trong `MoviePage.jsx`.

### 1. Đặc tả Endpoint (Theo `docs/API.md` mục 3)
1. **Lấy danh sách phim:**
   - **Endpoint:** `GET /api/movies`
   - **Quyền:** `Public`
   - **Query Params:**
     - `status`: `NOW_SHOWING` | `COMING_SOON` | `ENDED` (tùy chọn)
     - `keyword`: Tìm kiếm theo tên phim (tùy chọn)
     - `page`: Số trang (mặc định 0)
     - `size`: Số phần tử (mặc định 20)
   - **Response `200`:**
     ```json
     {
       "content": [
         {
           "movieId": 1,
           "title": "Hành Trình Về Phía Biển",
           "genre": "Tâm lý, Gia đình",
           "duration": 120,
           "ageLimit": "P",
           "releaseDate": "2026-10-18",
           "movieStatus": "NOW_SHOWING",
           "posterUrl": "https://..."
         }
       ],
       "page": 0,
       "size": 20,
       "totalElements": 5,
       "totalPages": 1
     }
     ```
2. **Chi tiết phim:**
   - **Endpoint:** `GET /api/movies/{id}`
   - **Quyền:** `Public`
   - **Response `200`:** Thông tin đầy đủ (gồm cả `description`, `duration`, `director`, `cast`...).

### 2. Checklist công việc
- [ ] Ánh xạ Entity `Movie` khớp 100% bảng `movies` (Hibernate validate).
- [ ] Tạo `MovieRepository` kế thừa `JpaRepository` với các hàm lọc theo `movieStatus` và `isActive = true`.
- [ ] Tạo `MovieResponse` và `MovieDetailResponse` DTO (tên trường `camelCase`).
- [ ] Tạo `MovieService` và `MovieController`.
- [ ] Cấu hình `SecurityConfig`: `permitAll` cho `GET /api/movies/**`.
- [ ] Viết test `MovieIntegrationTest` kiểm tra trả đúng dữ liệu từ database `V2__seed_dev_data.sql`.
- [ ] Báo cho người phụ trách giao diện khi hoàn thành.

---

## 📌 TASK 2: API Suất Chiếu (Showtimes API) – Thay thế Mock Data Trang Lịch Chiếu
- **Người thực hiện đề xuất:** Backend Dev 2
- **Nhãn (Labels):** `backend`, `api-read`, `showtimes`
- **Mục tiêu thay thế:** Thay thế `MOVIES_SHOWTIMES_DATA` trong `ShowtimePage.jsx`.

### 1. Đặc tả Endpoint (Theo `docs/API.md` mục 4)
- **Endpoint:** `GET /api/showtimes`
- **Quyền:** `Public`
- **Query Params:**
  - `date`: Định dạng `YYYY-MM-DD` (bắt buộc, ví dụ `2026-11-02`)
  - `movieId`: ID phim (tùy chọn)
  - `roomId`: ID phòng (tùy chọn)
- **Response `200`:** Danh sách suất chiếu trong ngày, chỉ lấy các suất chiếu `isActive = true` và thời gian bắt đầu trong ngày đó.
  ```json
  [
    {
      "showId": 1,
      "movieId": 1,
      "movieTitle": "Hành Trình Về Phía Biển",
      "ageLimit": "P",
      "duration": 120,
      "genre": "Tâm lý, Gia đình",
      "roomId": 1,
      "roomName": "Phòng 1",
      "startTime": "2026-11-03T18:00:00",
      "endTime": "2026-11-03T20:15:00",
      "priceMultiplier": 1.00
    }
  ]
  ```

### 2. Checklist công việc
- [ ] Ánh xạ Entity `Showtime`, `Room`, `Theater` khớp cấu trúc bảng Flyway.
- [ ] Tạo `ShowtimeRepository` tìm kiếm theo khoảng thời gian trong ngày (`start_time BETWEEN ... AND ...`) và `is_active = true`.
- [ ] Tạo `ShowtimeResponse` DTO.
- [ ] Tạo `ShowtimeService` và `ShowtimeController`.
- [ ] Cấu hình `SecurityConfig`: `permitAll` cho `GET /api/showtimes/**`.
- [ ] Viết test `ShowtimeIntegrationTest` kiểm tra query theo ngày thực tế.
- [ ] Báo cho người phụ trách giao diện khi hoàn thành.

---

## 📌 TASK 3: API Đồ Ăn & Combo (Foods API) – Thay thế Mock Data Trang Đồ Ăn
- **Người thực hiện đề xuất:** Backend Dev 1 hoặc 3
- **Nhãn (Labels):** `backend`, `api-read`, `foods`
- **Mục tiêu thay thế:** Thay thế `FOOD_ITEMS` trong `FoodPage.jsx`.

### 1. Đặc tả Endpoint (Theo `docs/API.md` mục 9)
- **Endpoint:** `GET /api/foods`
- **Quyền:** `Public`
- **Query Params:**
  - `category`: `Combo` | `Bắp` | `Nước` (tùy chọn)
- **Response `200`:** Chỉ trả về các món đang bán (`isAvailable = true` hoặc khớp cột DB).
  ```json
  [
    {
      "foodId": 1,
      "name": "Bắp ngọt (vừa)",
      "price": 45000,
      "category": "Bắp",
      "description": "Bắp rang bơ đường truyền thống",
      "img": null
    },
    {
      "foodId": 4,
      "name": "Combo 1 bắp 1 nước",
      "price": 65000,
      "category": "Combo",
      "description": "1 Bắp ngọt vừa + 1 Nước ngọt size vừa",
      "img": null
    }
  ]
  ```

### 2. Checklist công việc
- [ ] Ánh xạ Entity `Food` khớp bảng `foods`.
- [ ] Tạo `FoodRepository` với hàm `findByCategory` hoặc lấy tất cả món đang bán.
- [ ] Tạo `FoodResponse` DTO (`foodId`, `name`, `price`, `category`, `description`, `img`).
- [ ] Tạo `FoodService` và `FoodController`.
- [ ] Cấu hình `SecurityConfig`: `permitAll` cho `GET /api/foods`.
- [ ] Viết test `FoodIntegrationTest`.
- [ ] Báo cho người phụ trách giao diện khi hoàn thành.

---

## 📌 TASK 4: API Tin Tức & Khuyến Mãi (News & Promotions) – Thay thế Mock Data Trang Tin Tức
- **Người thực hiện đề xuất:** Backend Dev 2 hoặc 3
- **Nhãn (Labels):** `backend`, `api-read`, `news`, `promotions`
- **Mục tiêu thay thế:** Thay thế `INITIAL_POSTS` trong `NewsPage.jsx`.

### 1. Đặc tả Endpoint (Theo `docs/API.md` mục 10 & 11)
1. **Lấy danh sách tin tức:**
   - **Endpoint:** `GET /api/news`
   - **Quyền:** `Public`
   - **Query Params:** `page`, `size`
   - **Response `200`:** Danh sách tin bài từ bảng `news`, sắp xếp mới nhất lên trước (`created_at DESC`).
2. **Lấy danh sách mã khuyến mãi đang có hiệu lực:**
   - **Endpoint:** `GET /api/promotions/active`
   - **Quyền:** `Public`
   - **Response `200`:** Danh sách mã còn hạn (`expiry_date > NOW()` và `isActive = true`), ví dụ mã `GIAM10`, `GIAM20K`.

### 2. Checklist công việc
- [ ] Ánh xạ Entity `News` và `Promotion` khớp bảng Flyway.
- [ ] Tạo `NewsRepository`, `PromotionRepository`.
- [ ] Tạo DTO `NewsResponse`, `PromotionResponse`.
- [ ] Tạo Controller & Service tương ứng.
- [ ] Cấu hình `SecurityConfig`: `permitAll` cho các endpoint đọc tin tức và mã khuyến mãi.
- [ ] Viết test kiểm tra.
- [ ] Báo cho người phụ trách giao diện khi hoàn thành.

---

## 📌 TASK 5: API Lịch Sử Đặt Vé & Hồ Sơ (My Bookings & Profile) – Thay thế Trang Chủ & Trang Cá Nhân
- **Người thực hiện đề xuất:** Backend Dev Leader
- **Nhãn (Labels):** `backend`, `api-read`, `orders`, `profile`
- **Mục tiêu thay thế:** Thay thế `SAMPLE_TICKETS` trong `HomePage.jsx` và thông tin vé/profile trong `UserPage.jsx`.

### 1. Đặc tả Endpoint (Theo `docs/API.md` mục 2 & mục 6)
1. **Lịch sử đặt vé của tôi:**
   - **Endpoint:** `GET /api/users/me/bookings`
   - **Quyền:** `CUSTOMER` (yêu cầu gửi header `Authorization: Bearer <accessToken>`)
   - **Query Params:** `status` (`PENDING`, `PAID`, `CANCELLED` - tùy chọn), `page`, `size`
   - **Response `200`:** Danh sách các đơn đặt vé của chính người dùng đăng nhập (join bảng `orders`, `showtimes`, `movies`, `rooms`, `tickets`, `seats`), gồm:
     - `bookingId`, `bookingCode`
     - `status` (`PAID`, `CANCELLED`, `PENDING`)
     - `movieTitle`, `roomName`, `showtime`
     - `seats` (danh sách nhãn ghế ví dụ `A08`, `C07`)
     - `totalPrice`, `createdAt`
2. **Cập nhật thông tin cá nhân:**
   - **Endpoint:** `PUT /api/users/me`
   - **Quyền:** `Auth`
   - **Request Body:** `{ "username": "Gia Bảo", "phone": "0912345678" }`
   - **Response `200`:** Thông tin người dùng sau khi cập nhật.

### 2. Checklist công việc
- [ ] Ánh xạ các Entity liên quan: `Order`, `Ticket`, `Seat` (nếu chưa có).
- [ ] Query danh sách đơn theo `userId` lấy từ JWT `SecurityContextHolder`. Tuyệt đối không nhận `userId` từ client (BR-ROLE-02).
- [ ] Tạo DTO `BookingHistoryResponse`.
- [ ] Viết hàm cập nhật tên và số điện thoại trong `UserService` (validate định dạng SĐT).
- [ ] Viết test `MyBookingsIntegrationTest` (chỉ user nào xem được đơn của user đó).
- [ ] Báo cho người phụ trách giao diện khi hoàn thành.

---

## ⚠️ NGUYÊN TẮC BẮT BUỘC KHI LÀM TASK (Trích từ AGENTS.md)
1. **Ranh giới:** Backend Dev **chỉ sửa trong `backend/`**, tuyệt đối **không sửa `frontend/`**.
2. **Hợp đồng:** Đúng đường dẫn, đúng method, tên trường `camelCase`, đúng mã HTTP và cấu trúc lỗi `status`, `code`, `message`, `timestamp`.
3. **Kiểm thử:** Trước khi gửi PR, bắt buộc chạy `mvn test` trong `backend/` và toàn bộ phải xanh (`BUILD SUCCESS`).
4. **Bảo mật:** Không in mật khẩu, OTP, token ra log/console; không commit `.env`.

