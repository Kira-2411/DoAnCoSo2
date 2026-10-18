# API – Akashi Cinema

Phiên bản 1.0 – 17/10/2026. Đặc tả REST API của backend. Quy tắc nghiệp vụ nằm ở `BUSINESS_RULES.md` (mã `BR-...` được trích dẫn bên dưới), dữ liệu nằm ở `V1__init_schema.sql`.
Khi backend chạy, Swagger UI là nguồn tham chiếu chi tiết nhất cho từng trường dữ liệu.

---

## 0. Quy ước chung

| Mục | Quy ước |
|---|---|
| Tiền tố | Mọi endpoint bắt đầu bằng `/api` |
| Định dạng | JSON, UTF-8. Tên trường dùng `camelCase` |
| Xác thực | Header `Authorization: Bearer <accessToken>` |
| Thời gian | ISO-8601 theo giờ Việt Nam, không kèm múi giờ, ví dụ `2026-10-20T19:30:00` |
| Tiền | Số nguyên, đơn vị VNĐ, ví dụ `72000` |
| Phân trang | Tham số `page` (bắt đầu từ 0) và `size` (mặc định 20). Trả về `{ content, page, size, totalElements, totalPages }` |
| Thành công | Trả thẳng dữ liệu (không bọc thêm lớp). Tạo mới trả `201`, xóa/ẩn thành công trả `204` |
| Phân quyền | Cột “Quyền”: `Public` (không cần token), `Auth` (bất kỳ người đã đăng nhập), hoặc liệt kê vai trò `CUSTOMER`, `STAFF`, `ADMIN` |

### Định dạng lỗi

```json
{
  "status": 409,
  "code": "SEAT_UNAVAILABLE",
  "message": "Một số ghế đã có người giữ hoặc đã bán",
  "timestamp": "2026-10-20T19:30:00",
  "details": { "conflictSeatIds": [12, 13] }
}
```

`code` là mã máy đọc được để frontend xử lý; `details` chỉ có khi cần.

| HTTP | Khi nào | Ví dụ `code` |
|---|---|---|
| 400 | Dữ liệu gửi lên sai định dạng hoặc vi phạm điều kiện | `VALIDATION_ERROR`, `INVALID_OTP`, `OTP_EXPIRED` |
| 401 | Chưa đăng nhập, token sai hoặc hết hạn, sai email/mật khẩu | `UNAUTHORIZED`, `BAD_CREDENTIALS` |
| 403 | Đã đăng nhập nhưng không đủ quyền; tài khoản bị khóa hoặc chưa xác thực email | `FORBIDDEN`, `ACCOUNT_LOCKED`, `EMAIL_NOT_VERIFIED` |
| 404 | Không tìm thấy, hoặc đơn của người khác (BR-ROLE-02) | `NOT_FOUND` |
| 409 | Xung đột nghiệp vụ | `SEAT_UNAVAILABLE`, `HOLD_EXPIRED`, `SHOWTIME_OVERLAP`, `SHOWTIME_CLOSED`, `HAS_PAID_BOOKINGS`, `EMAIL_EXISTS` |
| 429 | Gửi OTP hoặc đăng nhập quá giới hạn (BR-AUTH-07, BR-AUTH-12) | `TOO_MANY_REQUESTS` |

---

## 1. Xác thực (`/api/auth`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Public | Đăng ký CUSTOMER, gửi OTP xác thực email (BR-AUTH-01 đến 04) |
| POST | `/auth/verify-email` | Public | Nhập OTP để xác thực email (BR-AUTH-05 đến 08) |
| POST | `/auth/resend-otp` | Public | Gửi lại OTP, body có `purpose` (BR-AUTH-07) |
| POST | `/auth/login` | Public | Đăng nhập, nhận JWT (BR-AUTH-09 đến 12) |
| POST | `/auth/forgot-password` | Public | Yêu cầu OTP đặt lại mật khẩu (BR-AUTH-14) |
| POST | `/auth/reset-password` | Public | Đặt mật khẩu mới bằng OTP (BR-AUTH-15) |
| GET | `/auth/me` | Auth | Thông tin tài khoản hiện tại, dùng để khôi phục phiên khi tải lại trang |

`POST /auth/login`

```json
// Request
{ "email": "customer@example.com", "password": "Passw0rd!" }

// 200
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { "userId": 3, "username": "An", "email": "customer@example.com", "role": "CUSTOMER" }
}

// 401  { "status": 401, "code": "BAD_CREDENTIALS", "message": "Email hoặc mật khẩu không đúng", ... }
```

`POST /auth/register` body: `{ "username", "email", "password", "phone" (tùy chọn) }` → `201`.
`POST /auth/verify-email` body: `{ "email", "code" }`.
`POST /auth/resend-otp` body: `{ "email", "purpose": "REGISTER" | "RESET_PASSWORD" }`.
`POST /auth/reset-password` body: `{ "email", "code", "newPassword" }`.

---

## 2. Người dùng (`/api/users`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| PUT | `/users/me` | Auth | Sửa tên, số điện thoại của mình (BR-USER-01) |
| PUT | `/users/me/password` | Auth | Đổi mật khẩu, cần mật khẩu cũ: `{ "oldPassword", "newPassword" }` |
| GET | `/users/me/bookings` | CUSTOMER | Lịch sử đặt vé của mình, lọc `status`, có phân trang |
| GET | `/users` | ADMIN | Danh sách người dùng, lọc `role`, `keyword`, phân trang |
| GET | `/users/{id}` | ADMIN | Chi tiết người dùng |
| POST | `/users` | ADMIN | Tạo tài khoản STAFF hoặc ADMIN (BR-ROLE-03) |
| PATCH | `/users/{id}/role` | ADMIN | Đổi vai trò (BR-ROLE-04) |
| PATCH | `/users/{id}/status` | ADMIN | Khóa hoặc mở khóa: `{ "isActive": false }` (BR-USER-02, BR-ROLE-04) |

Không có endpoint xóa người dùng (BR-USER-02). Phản hồi không bao giờ chứa mật khẩu (BR-USER-03).

---

## 3. Phim (`/api/movies`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/movies` | Public | Danh sách phim đang hiển thị, lọc `status`, `keyword`, phân trang. ADMIN thêm `includeInactive=true` để xem cả phim đã ẩn |
| GET | `/movies/{id}` | Public | Chi tiết phim |
| POST | `/movies` | ADMIN | Thêm phim (BR-MOV-01) |
| PUT | `/movies/{id}` | ADMIN | Sửa phim, gồm cả `movieStatus` |
| DELETE | `/movies/{id}` | ADMIN | **Ẩn** phim: đặt `isActive = false`, không xóa cứng (BR-MOV-03). Trả `204` |

---

## 4. Suất chiếu và sơ đồ ghế (`/api/showtimes`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/showtimes` | Public | Tra cứu suất chiếu, lọc `movieId`, `date`, `roomId`. Chỉ trả suất trong cửa sổ `showtime-booking-window-days` (BR-SHOW-07) |
| GET | `/showtimes/{id}` | Public | Chi tiết một suất chiếu |
| GET | `/showtimes/{id}/seats` | Public | Sơ đồ ghế của suất kèm trạng thái `AVAILABLE`, `HELD`, `SOLD` và giá từng ghế (BR-HOLD-07) |
| GET | `/showtimes/{id}/seat-events` | Public | Luồng SSE (`text/event-stream`) đẩy thay đổi trạng thái ghế (BR-RT-01 đến 04) |
| POST | `/showtimes` | ADMIN | Tạo suất chiếu: `{ movieId, roomId, startTime, priceMultiplier }`. `endTime` do hệ thống tính (BR-SHOW-01 đến 04) |
| PUT | `/showtimes/{id}` | ADMIN | Sửa suất chiếu (BR-SHOW-05). `409 HAS_PAID_BOOKINGS` nếu đã có đơn thanh toán |
| DELETE | `/showtimes/{id}` | ADMIN | **Hủy** suất: đặt `isActive = false` (BR-SHOW-06). `409 HAS_PAID_BOOKINGS` nếu còn đơn đã thanh toán |

`GET /showtimes/{id}/seats` (rút gọn):

```json
{
  "showId": 15,
  "seats": [
    { "seatId": 1, "label": "A1", "rowNum": 1, "colNum": 1, "seatType": "STANDARD",
      "peopleCount": 1, "price": 60000, "status": "AVAILABLE" },
    { "seatId": 2, "label": "A2", "rowNum": 1, "colNum": 2, "seatType": "STANDARD",
      "peopleCount": 1, "price": 60000, "status": "HELD", "heldByMe": false }
  ]
}
```

Sự kiện SSE: `event: seat-update`, dữ liệu `{ "showId": 15, "seatIds": [1, 2], "status": "HELD" }` (hoặc `AVAILABLE`, `SOLD`). Khi mất kết nối rồi nối lại, client tải lại toàn bộ `/seats` (BR-RT-03).

---

## 5. Giữ ghế (`/api/seat-holds`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/seat-holds` | CUSTOMER, STAFF | Giữ ghế, tất cả hoặc không gì cả (BR-HOLD-01 đến 05, 08) |
| POST | `/seat-holds/release` | CUSTOMER, STAFF | Nhả ghế đang giữ (BR-HOLD-06) |

`POST /seat-holds`

```json
// Request. holderToken để trống ở lần giữ đầu, gửi lại token đã nhận khi muốn giữ thêm hoặc đổi ghế
{ "showId": 15, "seatIds": [1, 2, 3], "holderToken": null }

// 201
{
  "holderToken": "q8Zk...64ký-tự",
  "expiresAt": "2026-10-20T19:40:00",
  "seats": [ { "seatId": 1, "label": "A1", "price": 60000 } ]
}

// 409 SEAT_UNAVAILABLE, details.conflictSeatIds = [2]
```

`POST /seat-holds/release` body: `{ "showId": 15, "holderToken": "...", "seatIds": [1] }` (bỏ `seatIds` để nhả hết). Chỉ chủ của `holderToken` nhả được. Thời hạn giữ lấy theo `seat-hold-minutes`, không cố định trong API.

---

## 6. Đơn đặt vé (`/api/bookings`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/bookings/preview` | CUSTOMER, STAFF | Xem trước giá (ghế, đồ ăn, khuyến mãi) mà **không** tạo đơn (BR-PRC-04, BR-PROMO-01 đến 03) |
| POST | `/bookings` | CUSTOMER, STAFF | Tạo đơn `PENDING` từ các ghế đang giữ (BR-BOOK-01 đến 06) |
| GET | `/bookings/{id}` | Chủ đơn, STAFF, ADMIN | Chi tiết đơn. Frontend gọi định kỳ (3 đến 5 giây) trên trang thanh toán để biết khi nào đơn thành `PAID` |
| GET | `/bookings/code/{bookingCode}` | STAFF, ADMIN | Tra cứu đơn theo mã đặt vé (BR-CTR-04) |
| GET | `/bookings` | STAFF, ADMIN | Danh sách đơn, lọc `status`, `channel`, `showId`, `from`, `to`, phân trang |
| POST | `/bookings/{id}/cancel` | Chủ đơn, STAFF, ADMIN | Hủy đơn. Chủ đơn và STAFF/ADMIN hủy được đơn `PENDING`; chỉ STAFF/ADMIN hủy được đơn `PAID` và trước giờ chiếu `paid-cancel-cutoff-minutes` (BR-CAN-01, BR-CAN-03, BR-CAN-05) |
| POST | `/bookings/{id}/resend-ticket` | Chủ đơn | Gửi lại email vé cho đơn `PAID` (BR-TIC-02) |

Đơn của người khác trả `404` (BR-ROLE-02). Đơn tạo bởi STAFF tự động có `channel = COUNTER`, `createdBy` là nhân viên đó và `userId` để trống (BR-CTR-02); đơn tạo bởi CUSTOMER có `channel = ONLINE`.

`POST /bookings/preview` và `POST /bookings` dùng chung body:

```json
{
  "showId": 15,
  "holderToken": "q8Zk...",
  "foods": [ { "foodId": 2, "quantity": 2 } ],
  "promoCode": "GIAM10",
  "ageConfirmed": true
}
```

`ageConfirmed` bắt buộc là `true` với phim T16, T18 khi đặt online (BR-MOV-04). Backend tự tính toàn bộ số tiền, không nhận số tiền từ client (BR-PRC-04).

`POST /bookings/preview` → `200`:

```json
{
  "seatsTotal": 180000, "foodsTotal": 90000, "subtotal": 270000,
  "discountAmount": 27000, "totalPrice": 243000,
  "promoValid": true, "promoMessage": null
}
```

`POST /bookings` → `201`:

```json
{
  "bookingId": 101,
  "bookingCode": "AKS7K2M9QX",
  "status": "PENDING",
  "channel": "ONLINE",
  "expiresAt": "2026-10-20T19:40:00",
  "show": { "showId": 15, "movieTitle": "...", "roomName": "Phòng 1", "startTime": "2026-10-20T21:00:00" },
  "seats": [ { "seatId": 1, "label": "A1", "price": 60000 } ],
  "foods": [ { "foodId": 2, "name": "Combo bắp nước", "quantity": 2, "unitPrice": 45000 } ],
  "subtotal": 270000, "discountAmount": 27000, "totalPrice": 243000
}
```

Lỗi thường gặp: `409 HOLD_EXPIRED` (ghế hết hạn hoặc không thuộc người này, BR-BOOK-03), `409 SHOWTIME_CLOSED` (đã đóng bán, BR-BOOK-02), `400 VALIDATION_ERROR` (số ghế vượt `max-seats-per-booking`, mã khuyến mãi không hợp lệ).

---

## 7. Thanh toán (`/api/bookings/{id}/payments`, `/api/payments`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/bookings/{id}/payments` | Chủ đơn, STAFF, ADMIN | Tạo yêu cầu thanh toán chuyển khoản `BANK_TRANSFER` và trả mã QR (BR-PAY-05) |
| POST | `/bookings/{id}/confirm-cash` | STAFF, ADMIN | Xác nhận đã thu tiền mặt, hoàn tất đơn (BR-PAY-12, BR-PAY-13) |
| POST | `/payments/casso-webhook` | Public (xác thực bằng khóa bí mật của Casso) | Nhận thông báo giao dịch từ Casso (BR-PAY-06 đến 11) |
| GET | `/payments/needs-review` | ADMIN | Giao dịch cần đối soát hoàn tiền: sai số tiền hoặc trễ hạn (BR-PAY-11) |

`POST /bookings/{id}/payments` body: `{ "method": "BANK_TRANSFER" }` → `201`:

```json
{
  "paymentId": 55,
  "method": "BANK_TRANSFER",
  "status": "PENDING",
  "amount": 243000,
  "transferContent": "AKS7K2M9QX",
  "qrData": "<chuỗi hoặc đường dẫn ảnh QR>",
  "expiresAt": "2026-10-20T19:40:00"
}
```

- Khách online chỉ dùng `BANK_TRANSFER` (BR-PAY-13). Tiền mặt chỉ qua `confirm-cash`.
- Webhook luôn xử lý idempotent theo `transaction_id` (BR-PAY-08). Cấu trúc dữ liệu Casso gửi và mã phản hồi cần trả: theo tài liệu của Casso, chưa chốt (BR-PAY-06).
- Webhook không dùng JWT. Nó phải được mở công khai trong `SecurityConfig` nhưng chỉ chấp nhận request qua được bước xác thực nguồn gửi.

---

## 8. Rạp, phòng, loại ghế, ghế

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/theaters` | Public | Thông tin rạp (hiện chỉ có một rạp, BR-INF-01) |
| GET | `/seat-types` | Public | Danh sách loại ghế kèm giá gốc, dùng cho chú giải giá |
| POST | `/seat-types` | ADMIN | Thêm loại ghế |
| PUT | `/seat-types/{id}` | ADMIN | Sửa loại ghế, đổi giá gốc |
| GET | `/rooms` | ADMIN | Danh sách phòng chiếu |
| GET | `/rooms/{id}` | ADMIN | Chi tiết phòng |
| POST | `/rooms` | ADMIN | Thêm phòng (BR-INF-02) |
| PUT | `/rooms/{id}` | ADMIN | Sửa tên phòng |
| PATCH | `/rooms/{id}/status` | ADMIN | Bật hoặc ngừng dùng phòng: `{ "isActive": false }` (BR-INF-07) |
| GET | `/rooms/{id}/seats` | ADMIN | Sơ đồ ghế của phòng (ma trận hàng và cột) |
| POST | `/rooms/{id}/seats/generate` | ADMIN | Tạo hoặc tạo lại sơ đồ ghế hàng loạt (BR-INF-06) |
| PATCH | `/seats/{id}` | ADMIN | Đổi loại ghế hoặc bật tắt ghế (BR-INF-07) |

`POST /rooms/{id}/seats/generate` body:

```json
{ "rows": [
  { "rowNum": 1, "cols": 15, "seatTypeId": 1 },
  { "rowNum": 4, "cols": 15, "seatTypeId": 2 },
  { "rowNum": 7, "cols": 6,  "seatTypeId": 3 }
] }
```

Các thao tác sửa ghế hoặc tạo lại sơ đồ trả `409` nếu ghế đang có đơn hoặc hold của suất chiếu chưa chiếu (BR-INF-07).

---

## 9. Đồ ăn (`/api/foods`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/foods` | Public | Danh sách món đang bán, lọc `category`. ADMIN thêm `includeUnavailable=true` |
| POST | `/foods` | ADMIN | Thêm món |
| PUT | `/foods/{id}` | ADMIN | Sửa món, gồm cả giá |
| DELETE | `/foods/{id}` | ADMIN | **Ngừng bán**: đặt `isAvailable = false`, không xóa cứng (BR-FOOD-01) |

---

## 10. Khuyến mãi (`/api/promotions`) – SHOULD

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/promotions` | ADMIN | Danh sách mã khuyến mãi |
| POST | `/promotions` | ADMIN | Thêm mã (BR-PROMO-02) |
| PUT | `/promotions/{id}` | ADMIN | Sửa mã |
| DELETE | `/promotions/{id}` | ADMIN | **Ngừng** mã: đặt `isActive = false` (BR-PROMO-05) |

Khách không gọi trực tiếp nhóm này. Khách kiểm tra mã bằng `POST /bookings/preview`.

---

## 11. Tin tức (`/api/news`) – SHOULD

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/news` | Public | Danh sách tin, phân trang, mới nhất trước |
| GET | `/news/{id}` | Public | Chi tiết tin |
| POST | `/news` | ADMIN | Thêm tin |
| PUT | `/news/{id}` | ADMIN | Sửa tin |
| DELETE | `/news/{id}` | ADMIN | Xóa tin (BR-NEWS-01) |

---

## 12. Tải ảnh (`/api/uploads`)

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/uploads/signature` | ADMIN | Trả tham số đã ký để trình duyệt tải ảnh thẳng lên Cloudinary (poster, ảnh món, ảnh tin). Frontend chỉ gửi lại đường dẫn nhận được vào các trường `posterUrl`, `img`, `imageUrl` |

---

## 13. Thống kê (`/api/reports`) – SHOULD

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/reports/summary` | ADMIN | Tổng doanh thu, số vé, số đơn trong kỳ (`from`, `to`) (BR-RPT-01, 02) |
| GET | `/reports/revenue` | ADMIN | Doanh thu theo ngày hoặc tháng: `groupBy=day|month` |
| GET | `/reports/top-movies` | ADMIN | Phim bán chạy: `from`, `to`, `limit` |

---

## 14. Ma trận quyền tóm tắt

| Nhóm endpoint | Public | CUSTOMER | STAFF | ADMIN |
|---|:-:|:-:|:-:|:-:|
| Xem phim, suất chiếu, sơ đồ ghế, đồ ăn, tin tức, loại ghế | ✔ | ✔ | ✔ | ✔ |
| Đăng ký, đăng nhập, quên mật khẩu | ✔ | | | |
| Giữ ghế, xem trước giá, tạo đơn | | ✔ | ✔ | |
| Thanh toán chuyển khoản cho đơn của mình | | ✔ | ✔ | ✔ |
| Xác nhận tiền mặt, tra cứu mọi đơn | | | ✔ | ✔ |
| Hủy đơn `PENDING` | | chủ đơn | ✔ | ✔ |
| Hủy đơn `PAID` | | | ✔ | ✔ |
| Quản lý phim, suất chiếu, phòng, ghế, đồ ăn, khuyến mãi, tin tức | | | | ✔ |
| Quản lý người dùng, thống kê, đối soát thanh toán | | | | ✔ |

Quy tắc chung: kiểm tra quyền ở backend trên mọi endpoint (BR-ROLE-01). Vai trò hợp lệ chỉ gồm `CUSTOMER`, `STAFF`, `ADMIN`.
