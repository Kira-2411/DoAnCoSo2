# Quy tắc nghiệp vụ – Akashi Cinema

Phiên bản 1.0 – 17/10/2026. Tài liệu mô tả quy tắc nghiệp vụ của hệ thống đặt vé xem phim Akashi Cinema.
Dữ liệu tham chiếu: `docs/Thiet_Ke_CSDL_Akashi_Cinema_Web.docx` (16 bảng) và `V1__init_schema.sql`.

## Cách dùng tài liệu

- Mỗi quy tắc có **mã** dạng `BR-<NHÓM>-<số>` để tham chiếu khi giao việc hoặc viết test, ví dụ: “Cài đặt BR-HOLD-01 đến BR-HOLD-08 trong `SeatHoldService`”.
- Phần trong dấu `[...]` là bảng hoặc cột dữ liệu liên quan.
- Nhãn ưu tiên: **MUST** (bắt buộc có), **SHOULD** (làm nếu còn thời gian), **COULD** (để sau).
- Quy tắc đánh dấu **(chưa chốt)** đang dùng giá trị tạm, được gom ở mục 14.
- Mọi logic nghiệp vụ nằm ở tầng `service/`. Controller chỉ nhận request và trả response.
- Mọi thao tác ghi gồm nhiều bước (giữ ghế, tạo đơn, hoàn tất thanh toán, hủy đơn) phải nằm trong **một transaction**.
- Thời gian dùng múi giờ `Asia/Ho_Chi_Minh`; mọi so sánh thời gian dùng giờ của server, không tin giờ do client gửi.

---

## 1. Tham số cấu hình (MUST)

Đặt trong `application.yml` (khóa `akashi.*`), không viết cứng trong code.

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `seat-hold-minutes` | 10 | Thời gian giữ ghế kể từ lúc chọn |
| `max-seats-per-booking` | 8 | Số ghế tối đa trong một đơn (chưa chốt) |
| `max-food-quantity-per-item` | 10 | Số lượng tối đa của mỗi món trong một đơn (chưa chốt) |
| `online-sales-close-minutes` | 15 | Đóng bán online trước giờ chiếu bao nhiêu phút (chưa chốt) |
| `showtime-cleaning-minutes` | 15 | Thời gian dọn phòng cộng vào `end_time` (chưa chốt) |
| `showtime-booking-window-days` | 7 | Chỉ hiển thị suất chiếu trong N ngày tới |
| `paid-cancel-cutoff-minutes` | 60 | Chỉ được hủy đơn đã thanh toán trước giờ chiếu ít nhất N phút |
| `otp-expiry-minutes` | 5 | Thời hạn của mã OTP |
| `otp-max-attempts` | 5 | Số lần nhập sai OTP tối đa |
| `otp-resend-seconds` | 60 | Khoảng cách tối thiểu giữa hai lần gửi OTP |
| `otp-max-per-hour` | 5 | Số OTP tối đa gửi cho một email trong một giờ |
| `jwt-expiry-minutes` | 60 | Thời hạn access token |
| `login-max-failures` | 5 | Số lần đăng nhập sai liên tiếp trước khi tạm khóa |
| `login-lock-minutes` | 15 | Thời gian tạm khóa sau khi vượt ngưỡng |

---

## 2. Vai trò và phân quyền (MUST)

Vai trò lưu ở `[users.role]`. Người chưa đăng nhập gọi là **Khách vãng lai**.

| Chức năng | Khách vãng lai | CUSTOMER | STAFF | ADMIN |
|---|:-:|:-:|:-:|:-:|
| Xem phim, suất chiếu, sơ đồ ghế, tin tức | ✔ | ✔ | ✔ | ✔ |
| Đăng ký, đăng nhập, quên mật khẩu | ✔ | | | |
| Giữ ghế và đặt vé online | | ✔ | | |
| Xem vé và đơn của chính mình | | ✔ | | |
| Tự hủy đơn **chờ thanh toán** của mình | | ✔ | | |
| Bán vé tại quầy, xác nhận tiền mặt | | | ✔ | ✔ |
| Tra cứu đơn theo mã đặt vé | | | ✔ | ✔ |
| Hủy đơn **đã thanh toán** | | | ✔ | ✔ |
| Quản lý phim, phòng, ghế, suất chiếu | | | | ✔ |
| Quản lý đồ ăn, khuyến mãi, tin tức | | | | ✔ |
| Quản lý người dùng, phân vai trò | | | | ✔ |
| Xem thống kê doanh thu | | | | ✔ |

- **BR-ROLE-01:** Phân quyền kiểm tra ở **backend** trên mọi API (`@PreAuthorize`). Ẩn nút ở giao diện chỉ để tiện dùng, không được coi là bảo vệ.
- **BR-ROLE-02:** Khách chỉ xem được đơn có `[bookings.user_id]` bằng id của mình. Truy cập đơn của người khác trả 404 (không trả 403 để không lộ sự tồn tại).
- **BR-ROLE-03:** Tài khoản STAFF và ADMIN chỉ do Admin tạo hoặc nâng quyền. Đăng ký công khai luôn tạo CUSTOMER, không nhận trường `role` từ client.
- **BR-ROLE-04:** Admin không được tự hạ quyền hoặc tự khóa chính mình, và không được khóa hoặc hạ quyền Admin cuối cùng của hệ thống.

---

## 3. Tài khoản và xác thực

### 3.1. Đăng ký và OTP (MUST)

- **BR-AUTH-01:** Email là duy nhất, lưu chữ thường và cắt khoảng trắng đầu cuối `[users.email]`.
- **BR-AUTH-02:** Mật khẩu tối thiểu 8 ký tự, có ít nhất một chữ và một số. Lưu dạng băm BCrypt `[users.password_hash]`, tuyệt đối không ghi mật khẩu gốc vào log hay DB.
- **BR-AUTH-03:** Đăng ký tạo user với `role = CUSTOMER`, `email_verified = 0`, rồi gửi OTP mục đích `REGISTER`. Chưa xác thực email thì không đăng nhập được.
- **BR-AUTH-04:** Nếu email đã đăng ký nhưng chưa xác thực, cho phép đăng ký lại (cập nhật tên, mật khẩu) và gửi OTP mới. Nếu email đã xác thực thì báo email đã tồn tại.
- **BR-AUTH-05:** OTP gồm 6 chữ số ngẫu nhiên, lưu **dạng băm** `[email_otps.code_hash]`, hết hạn sau `otp-expiry-minutes`, chỉ dùng một lần `[used]`.
- **BR-AUTH-06:** Mỗi lần nhập sai tăng `[attempts]`. Đạt `otp-max-attempts` thì mã bị vô hiệu, người dùng phải xin mã mới.
- **BR-AUTH-07:** Gửi lại OTP cách nhau ít nhất `otp-resend-seconds`; tối đa `otp-max-per-hour` mã mỗi giờ cho một email. Khi tạo mã mới, các mã cũ cùng email và cùng mục đích bị coi là đã dùng.
- **BR-AUTH-08:** Xác thực đúng OTP `REGISTER` thì đặt `[users.email_verified] = 1`.

### 3.2. Đăng nhập (MUST)

- **BR-AUTH-09:** Sai email hoặc sai mật khẩu đều trả cùng một thông báo: “Email hoặc mật khẩu không đúng”, để người ngoài không dò được email nào đã tồn tại.
- **BR-AUTH-10:** Chỉ khi mật khẩu **đúng** mới thông báo riêng các trường hợp: chưa xác thực email, hoặc tài khoản bị khóa `[users.is_active] = 0`.
- **BR-AUTH-11:** Đăng nhập thành công trả JWT access token có thời hạn `jwt-expiry-minutes`, chứa `userId` và `role`. Khóa bí mật ký token đọc từ biến môi trường, dài tối thiểu 32 ký tự.
- **BR-AUTH-12 (SHOULD):** Sai liên tiếp `login-max-failures` lần với cùng một email thì tạm khóa `login-lock-minutes` (đếm trong bộ nhớ backend, không cần thêm cột DB).
- **BR-AUTH-13:** Token là stateless nên không thu hồi được trước hạn. Hạn chế đã biết; giữ `jwt-expiry-minutes` ngắn để giảm rủi ro.

### 3.3. Quên mật khẩu (MUST)

- **BR-AUTH-14:** Yêu cầu quên mật khẩu luôn trả cùng một thông báo “Nếu email tồn tại, mã OTP đã được gửi”, dù email có tồn tại hay không.
- **BR-AUTH-15:** OTP mục đích `RESET_PASSWORD` tuân theo BR-AUTH-05 đến BR-AUTH-07. Đặt lại mật khẩu thành công thì cập nhật `[password_hash]` theo BR-AUTH-02.

### 3.4. Quản lý tài khoản

- **BR-USER-01 (MUST):** Khách xem và sửa tên, số điện thoại của mình; đổi mật khẩu cần nhập đúng mật khẩu cũ.
- **BR-USER-02 (MUST):** Không bao giờ xóa cứng user. Khóa tài khoản bằng `[users.is_active] = 0`.
- **BR-USER-03:** API trả về user không bao giờ chứa `password_hash`.

---

## 4. Phim, phòng, ghế, suất chiếu

### 4.1. Phim (MUST)

- **BR-MOV-01:** `[movies.duration]` > 0 (phút). `[age_limit]` thuộc `P, T13, T16, T18`. Trạng thái `[movie_status]`: `COMING_SOON`, `NOW_SHOWING`, `ENDED`, do Admin đặt thủ công.
- **BR-MOV-02:** Trang chủ chỉ hiển thị phim `[is_active] = 1`, chia mục theo `[movie_status]`. Phim `ENDED` không hiện ở danh sách chính và không tạo thêm suất chiếu mới.
- **BR-MOV-03:** Không xóa cứng phim. Ẩn phim bằng `[is_active] = 0`, lịch sử suất chiếu và đơn đặt vé được giữ nguyên.
- **BR-MOV-04:** Phim T16 và T18: khi đặt vé online, khách phải tích xác nhận đủ tuổi. Hệ thống **không** xác minh tuổi (không lưu ngày sinh); nhân viên quầy kiểm tra giấy tờ khi cần.
- **BR-MOV-05:** Poster tải lên Cloudinary, chỉ lưu đường dẫn vào `[poster_url]`.

### 4.2. Rạp, phòng, loại ghế, ghế (MUST)

- **BR-INF-01:** Hiện chỉ có một rạp. Bảng `theaters` được giữ để có thể mở rộng nhiều rạp, nhưng giao diện chưa cần chọn rạp.
- **BR-INF-02:** Tên phòng duy nhất trong cùng một rạp. Phòng ngừng dùng thì đặt `[rooms.is_active] = 0`, không xóa.
- **BR-INF-03:** Mỗi loại ghế có `[seat_types.code]` duy nhất (`STANDARD`, `VIP`, `COUPLE`) và giá gốc `[base_price]`.
- **BR-INF-04:** Ghế `COUPLE` có `[people_count] = 2`: **một dòng trong `seats` là một ghế đôi, bán một lần với giá `base_price` cho cả đôi** (chưa chốt).
- **BR-INF-05:** Vị trí ghế duy nhất trong phòng `(room_id, row_num, col_num)`. Hàng 1 hiển thị là A, hàng 2 là B…, tên ghế = chữ hàng + số cột (A1, B7).
- **BR-INF-06:** Admin tạo sơ đồ ghế hàng loạt cho phòng (số hàng, số cột, loại ghế theo hàng). Ghế hỏng đặt `[seats.is_active] = 0` và không hiển thị để chọn.
- **BR-INF-07:** Không được đổi loại ghế, tắt ghế hoặc tắt phòng nếu ghế đó đang có `booking_seats` hoặc `seat_holds` của một suất chiếu **chưa chiếu**.

### 4.3. Suất chiếu (MUST)

- **BR-SHOW-01:** `[showtimes.end_time] = start_time + movies.duration + showtime-cleaning-minutes`, do hệ thống tính, Admin không nhập tay.
- **BR-SHOW-02:** Hai suất `is_active = 1` trong cùng một phòng **không được chồng giờ**: suất mới vi phạm nếu `new.start_time < old.end_time` **và** `new.end_time > old.start_time`. Kiểm tra ở `ShowtimeService` khi thêm và khi sửa.
- **BR-SHOW-03:** Không tạo suất chiếu có `start_time` trong quá khứ; phim phải `is_active = 1` và không `ENDED`; phòng phải `is_active = 1`.
- **BR-SHOW-04:** `[price_multiplier]` nằm trong khoảng 0.50 đến 3.00, mặc định 1.00. Ngày lễ hoặc giờ cao điểm do Admin đặt hệ số cho **từng suất chiếu** (ví dụ 1.20). Không có phụ thu tự động theo giờ.
- **BR-SHOW-05:** Suất chiếu đã có đơn `PAID` không được đổi phòng, giờ bắt đầu hoặc phim. Muốn thay đổi phải hủy các đơn đó trước theo BR-CAN-03.
- **BR-SHOW-06:** Hủy suất chiếu đặt `[is_active] = 0`, chỉ làm được khi không còn đơn `PAID` của suất đó. Các `seat_holds` và đơn `PENDING` của suất bị hủy cũng được hủy theo.
- **BR-SHOW-07:** Khách chỉ thấy suất `is_active = 1`, bắt đầu trong vòng `showtime-booking-window-days` ngày tới và còn mở bán theo BR-BOOK-02.

---

## 5. Giá và khuyến mãi

### 5.1. Cách tính giá (MUST)

- **BR-PRC-01:** Giá một ghế = `seat_types.base_price × showtimes.price_multiplier`, làm tròn đến đồng (HALF_UP). Toàn bộ tiền là số nguyên VNĐ, dùng `Long`/`BigDecimal`, không dùng `double`.
- **BR-PRC-02:** Giá ghế được **chốt** vào `[seat_holds.price]` lúc giữ ghế, rồi sao sang `[booking_seats.price]` khi thanh toán xong. Đổi giá sau đó không ảnh hưởng đơn đã tạo.
- **BR-PRC-03:** Giá đồ ăn chốt vào `[booking_foods.unit_price]` lúc tạo đơn (lấy từ `foods.price` hiện tại).
- **BR-PRC-04:** `tạm tính = tổng giá ghế + Σ(unit_price × quantity)`; `total_price = tạm tính − discount_amount`, không âm. Mọi phép tính giá chỉ nằm ở `PricingService`, backend tự tính, **không tin số tiền client gửi lên**.
- **BR-PRC-05:** Chỉ bán món có `[foods.is_available] = 1`. Mỗi món `1 ≤ quantity ≤ max-food-quantity-per-item`.

### 5.2. Khuyến mãi (SHOULD)

- **BR-PROMO-01:** Mã khuyến mãi hợp lệ khi: `[is_active] = 1`, chưa quá `[expiry_date]` và `tạm tính ≥ [min_order_value]`.
- **BR-PROMO-02:** `PERCENT`: `discount_amount = floor(tạm tính × discount_value / 100)`, với `discount_value` từ 1 đến 100. `FIXED`: `discount_amount = min(discount_value, tạm tính)`.
- **BR-PROMO-03:** Mỗi đơn dùng tối đa **một** mã. Mã được áp dụng lúc tạo đơn và chốt vào `[bookings.promo_id]`, `[bookings.discount_amount]`; sau đó không đổi.
- **BR-PROMO-04:** Phiên bản 1.0 **không** có giới hạn số lần dùng và mức giảm tối đa. Giới hạn đã biết.
- **BR-PROMO-05:** Không xóa cứng mã đã dùng. Ngừng mã bằng `[is_active] = 0`.

---

## 6. Giữ ghế (MUST)

Dữ liệu ở bảng `seat_holds`. Ràng buộc `UNIQUE (show_id, seat_id)` là chốt chặn cuối cùng ở mức cơ sở dữ liệu.

- **BR-HOLD-01:** Chỉ khách đã đăng nhập (hoặc nhân viên khi bán tại quầy) mới giữ được ghế. Mỗi lần giữ có `[holder_token]` ngẫu nhiên gắn với phiên của người giữ.
- **BR-HOLD-02:** Điều kiện giữ một ghế: suất chiếu còn mở bán (BR-BOOK-02); ghế `is_active = 1` và thuộc phòng của suất chiếu; ghế **chưa bán** (không có trong `booking_seats` của suất đó); ghế chưa bị người khác giữ còn hạn.
- **BR-HOLD-03:** Giữ nhiều ghế trong một yêu cầu là **tất cả hoặc không gì cả**: một ghế không giữ được thì không ghế nào được giữ, trả lỗi 409 kèm danh sách ghế bị trùng.
- **BR-HOLD-04:** `[expires_at] = now + seat-hold-minutes`. **Không gia hạn** khi tạo đơn: hạn thanh toán của đơn (`[bookings.expires_at]`) bằng thời điểm hết hạn sớm nhất của các ghế trong đơn (chưa chốt). Mỗi người giữ tối đa `max-seats-per-booking` ghế cho một suất chiếu.
- **BR-HOLD-05:** Một dòng `seat_holds` có `expires_at ≤ now` coi như **không tồn tại**, kể cả khi tác vụ dọn chưa chạy. Khi giữ ghế, trong cùng transaction: xóa các dòng hết hạn của đúng các cặp (suất, ghế) đang giữ, rồi INSERT. Vi phạm UNIQUE nghĩa là có người giữ trước, trả lỗi 409.
- **BR-HOLD-06:** Người giữ có thể nhả ghế bất cứ lúc nào bằng đúng `holder_token`; chỉ chủ của lần giữ mới được nhả. Đổi suất chiếu hoặc rời trang thanh toán thì nhả ghế của suất cũ.
- **BR-HOLD-07:** Trạng thái ghế trong sơ đồ **tính ra**, không lưu thành cột: `SOLD` nếu có trong `booking_seats`; `HELD` nếu có hold còn hạn; còn lại là `AVAILABLE`. Với người đang giữ, giao diện hiển thị ghế của chính họ khác ghế người khác giữ.
- **BR-HOLD-08:** Giá ghế (BR-PRC-02) được tính và lưu ngay khi giữ ghế.

---

## 7. Đặt vé

### 7.1. Điều kiện và tạo đơn (MUST)

- **BR-BOOK-01:** Mỗi đơn gồm **đúng một suất chiếu**, có ít nhất 1 ghế và tối đa `max-seats-per-booking` ghế. Đồ ăn là tùy chọn. Phim và phòng của đơn suy ra từ `[bookings.show_id]`.
- **BR-BOOK-02:** Suất chiếu **mở bán online** khi `is_active = 1` và `now < start_time − online-sales-close-minutes`. Bán tại quầy mở đến `start_time` (chưa chốt).
- **BR-BOOK-03:** Tạo đơn chỉ chấp nhận các ghế mà **chính người đó đang giữ còn hạn** (đúng `holder_token`). Nếu có ghế hết hạn hoặc không thuộc người đó thì từ chối với lỗi 409.
- **BR-BOOK-04:** Tạo đơn trong một transaction: tạo `bookings` trạng thái `PENDING`, tạo các `booking_foods`, gán `[seat_holds.booking_id]` cho các ghế, đặt `[bookings.expires_at]` (BR-HOLD-04), tính giá và giảm giá (mục 5).
- **BR-BOOK-05:** Mã đơn `[bookings.booking_code]`: 10 ký tự, tiền tố `AKS` + 7 ký tự chọn từ `A-H J-N P-Z 2-9` (bỏ chữ dễ nhầm), **không có dấu cách hay dấu gạch**, để nội dung chuyển khoản không bị ngân hàng làm sai lệch. Duy nhất; trùng thì sinh lại.
- **BR-BOOK-06:** `[channel]` = `ONLINE` với đơn khách tự đặt, `COUNTER` với đơn quầy. Đơn `ONLINE` luôn có `user_id`.

### 7.2. Vòng đời trạng thái đơn `[bookings.booking_status]`

| Từ | Sang | Điều kiện | Ai thực hiện |
|---|---|---|---|
| (mới) | `PENDING` | Tạo đơn hợp lệ (BR-BOOK-04) | CUSTOMER hoặc STAFF |
| `PENDING` | `PAID` | Thanh toán thành công **trong hạn** (mục 8) | Hệ thống (webhook) hoặc STAFF/ADMIN (tiền mặt) |
| `PENDING` | `CANCELLED` | Hủy trước khi thanh toán (BR-CAN-01) | Chủ đơn, STAFF, ADMIN |
| `PENDING` | `EXPIRED` | Quá `[expires_at]` mà chưa thanh toán | Tác vụ định kỳ |
| `PAID` | `CANCELLED` | Hủy theo BR-CAN-03 | STAFF, ADMIN |

- **BR-BOOK-07:** `EXPIRED` và `CANCELLED` là trạng thái cuối, không chuyển tiếp nữa. Không có chuyển từ `PAID` sang trạng thái nào khác ngoài `CANCELLED`.
- **BR-BOOK-08:** Mọi thay đổi trạng thái đơn khóa dòng đơn (`SELECT ... FOR UPDATE`) để hai thao tác song song (webhook và tác vụ hết hạn) không xung đột.

### 7.3. Hoàn tất đơn khi thanh toán thành công (MUST)

Thực hiện trong **một transaction** khi thanh toán thành công:

1. Khóa dòng đơn; kiểm tra đang `PENDING` và `now ≤ expires_at`.
2. Kiểm tra mọi ghế của đơn vẫn còn trong `seat_holds` gắn với đơn, chưa hết hạn.
3. Sao các ghế sang `booking_seats` (kèm `show_id`, `price` từ hold); vi phạm `UNIQUE (show_id, seat_id)` thì rollback toàn bộ.
4. Xóa các dòng `seat_holds` của đơn; đặt đơn thành `PAID`; đặt thanh toán thành `SUCCESS`.
5. **Sau khi commit:** gửi email vé (BR-TIC-02) và đẩy sự kiện ghế đã bán qua SSE (mục 12). Gửi email lỗi **không** làm hỏng đơn.

---

## 8. Thanh toán

### 8.1. Quy tắc chung (MUST)

- **BR-PAY-01:** Một đơn có thể có nhiều dòng `payments` (thanh toán lại khi lần đầu thất bại). Tại một thời điểm, một đơn chỉ có tối đa một dòng `PENDING`.
- **BR-PAY-02:** Số tiền thanh toán hợp lệ phải **đúng bằng** `[bookings.total_price]`.
- **BR-PAY-03:** `payment_status` chỉ đi một chiều: `PENDING → SUCCESS` hoặc `PENDING → FAILED`. Trạng thái cuối không sửa lại.
- **BR-PAY-04:** Hai phương thức: `BANK_TRANSFER` (chuyển khoản QR, tự động qua Casso) và `CASH` (tiền mặt tại quầy, do nhân viên xác nhận).

### 8.2. Chuyển khoản qua Casso (MUST)

- **BR-PAY-05:** Khi khách chọn chuyển khoản, hệ thống tạo `payments` `PENDING` (`amount = total_price`) và trả mã QR chứa số tiền cùng nội dung chuyển khoản là `booking_code`. Trang thanh toán hiển thị đồng hồ đếm ngược theo `expires_at`.
- **BR-PAY-06:** Endpoint webhook phải **xác thực nguồn gửi** theo cơ chế Casso cung cấp (khóa bí mật/chữ ký), khóa này lấy từ biến môi trường. Không xác thực được thì từ chối và không xử lý. *Chi tiết xác thực và mã phản hồi cần trả: xem tài liệu Casso, chưa chốt.*
- **BR-PAY-07:** Khớp giao dịch với đơn bằng cách tìm `booking_code` trong nội dung chuyển khoản, **không phân biệt hoa thường** và bỏ khoảng trắng/ký tự phân cách. Không tìm thấy mã thì chỉ ghi log, không làm gì với đơn.
- **BR-PAY-08 (idempotent):** `[payments.transaction_id]` là duy nhất. Webhook gửi lại cùng giao dịch thì **không xử lý lần hai**, vẫn trả phản hồi thành công theo yêu cầu của Casso.
- **BR-PAY-09:** Nguyên văn dữ liệu webhook lưu vào `[payments.raw_payload]` để đối soát.
- **BR-PAY-10:** Số tiền chuyển **đúng** và đơn đang `PENDING` còn hạn thì hoàn tất đơn theo mục 7.3; ghi `[paid_at]` bằng thời điểm giao dịch.
- **BR-PAY-11 (trường hợp ngoại lệ):** Chuyển **sai số tiền** (thiếu hoặc thừa), hoặc chuyển **sau khi đơn đã `EXPIRED`/`CANCELLED`**: hệ thống ghi nhận giao dịch nhưng **không** đổi trạng thái đơn và không tạo `booking_seats` (vì ghế đã được nhả). Giao dịch này hiện trong danh sách “cần đối soát hoàn tiền” của Admin. Hoàn tiền thực hiện thủ công ngoài hệ thống. Đây là giới hạn của phiên bản 1.0.

### 8.3. Tiền mặt tại quầy (MUST)

- **BR-PAY-12:** Nhân viên bấm xác nhận đã thu tiền thì tạo `payments` `CASH` (`amount = total_price`, `transaction_id` để trống, `paid_at = now`) và hoàn tất đơn theo mục 7.3.
- **BR-PAY-13:** Chỉ STAFF và ADMIN xác nhận được tiền mặt. Khách online không có lựa chọn tiền mặt.

---

## 9. Bán vé tại quầy (MUST)

- **BR-CTR-01:** Nhân viên chọn suất, ghế, đồ ăn như khách và dùng chung quy tắc giữ ghế (mục 6) và tính giá (mục 5), với `holder_token` của phiên nhân viên.
- **BR-CTR-02:** Đơn quầy có `[channel] = COUNTER`, `[created_by]` = id nhân viên, `[user_id]` để trống (khách vãng lai). Không bắt buộc nhập thông tin khách.
- **BR-CTR-03:** Nhân viên thu tiền mặt (BR-PAY-12) hoặc cho khách quét QR chuyển khoản (mục 8.2), sau đó vé hiển thị để in hoặc đưa cho khách. Đơn quầy không gửi email (chưa lưu email khách).
- **BR-CTR-04:** Nhân viên tra cứu đơn theo `booking_code` để kiểm tra vé (SHOULD). Hệ thống **chưa** đánh dấu vé đã dùng khi soát vé, vì chưa có cột lưu việc này.

---

## 10. Hủy đơn và hoàn tiền

- **BR-CAN-01 (MUST):** Đơn `PENDING` được hủy bởi chủ đơn, STAFF hoặc ADMIN. Hủy thì đặt `CANCELLED` và **xóa các `seat_holds` của đơn** để nhả ghế ngay; đẩy sự kiện nhả ghế qua SSE.
- **BR-CAN-02 (MUST):** Đơn hết hạn do tác vụ định kỳ chuyển sang `EXPIRED` (mục 11), ghế được nhả theo BR-HOLD-05.
- **BR-CAN-03 (SHOULD):** Đơn `PAID` chỉ **STAFF/ADMIN** hủy được, và chỉ khi `now ≤ start_time − paid-cancel-cutoff-minutes`. Hủy thì đặt `CANCELLED` và **xóa các `booking_seats` của đơn** để ghế bán lại được. Các dòng `payments` giữ nguyên để đối soát.
- **BR-CAN-04:** Hoàn tiền thực hiện **thủ công ngoài hệ thống** (chuyển khoản lại hoặc trả tiền mặt). Hệ thống không gọi API hoàn tiền (chưa chốt cách ghi nhận việc đã hoàn, phiên bản 1.0 chỉ ghi vào trạng thái `CANCELLED`).
- **BR-CAN-05:** Khách **không** tự hủy đơn đã thanh toán trên web, cần liên hệ rạp. Chức năng đổi vé không có trong phiên bản 1.0.

---

## 11. Tác vụ định kỳ (MUST)

Chạy bằng `@Scheduled`, mỗi tác vụ idempotent (chạy lại nhiều lần vẫn đúng).

| Tác vụ | Chu kỳ gợi ý | Việc làm |
|---|---|---|
| `ExpiredHoldCleanupJob` | 30 giây | Xóa `seat_holds` có `expires_at ≤ now`; đẩy sự kiện nhả ghế qua SSE |
| `ExpiredBookingJob` | 1 phút | Đơn `PENDING` có `expires_at ≤ now` thành `EXPIRED`; xóa các hold còn sót của đơn |
| `OtpCleanupJob` | 1 giờ | Xóa OTP đã hết hạn hoặc đã dùng quá 1 ngày |

- **BR-JOB-01:** Tác vụ không được dựa vào việc “đã chạy” để bảo đảm đúng nghiệp vụ; các quy tắc như BR-HOLD-05 phải đúng ngay cả khi tác vụ chậm.

---

## 12. Cập nhật ghế thời gian thực (MUST)

- **BR-RT-01:** Dùng SSE theo từng suất chiếu: client mở một kết nối tới endpoint của `show_id` đang xem sơ đồ ghế. Xem sơ đồ không cần đăng nhập.
- **BR-RT-02:** Backend đẩy sự kiện **sau khi transaction commit**, không đẩy khi chưa commit. Các loại sự kiện: ghế bị giữ (`HELD`), ghế được nhả (`AVAILABLE`), ghế đã bán (`SOLD`); nội dung gồm `show_id` và danh sách `seat_id`.
- **BR-RT-03:** Khi kết nối SSE bị mất rồi nối lại, client **tải lại toàn bộ sơ đồ ghế** từ API thay vì tin vào sự kiện đã bỏ lỡ.
- **BR-RT-04:** SSE chỉ để hiển thị. Quyết định giữ ghế và bán ghế luôn dựa trên cơ sở dữ liệu (mục 6, 7), không dựa vào dữ liệu client đang thấy.

---

## 13. Vé điện tử, thống kê và nội dung

### 13.1. Vé điện tử

- **BR-TIC-01 (MUST):** Đơn `PAID` hiển thị vé trong mục “Vé của tôi”: mã đơn, mã QR (mã hóa `booking_code`), tên phim, suất chiếu, phòng, danh sách ghế, đồ ăn, tổng tiền.
- **BR-TIC-02 (MUST):** Gửi email vé cho khách khi đơn thành `PAID`. Gửi lỗi chỉ ghi log và cho phép gửi lại từ trang vé.

### 13.2. Thống kê (SHOULD, chỉ ADMIN)

- **BR-RPT-01:** Chỉ tính đơn `PAID`. Doanh thu theo kỳ tính từ `[payments.paid_at]` của các thanh toán `SUCCESS`; đơn đã `CANCELLED` sau khi thanh toán không tính vào doanh thu của hệ thống.
- **BR-RPT-02:** Số vé bán = số dòng `booking_seats` của đơn `PAID`. Có thể thống kê theo phim, theo ngày, theo kênh `[channel]`.

### 13.3. Đồ ăn và tin tức

- **BR-FOOD-01 (MUST):** Admin thêm, sửa món. Không xóa cứng món đã từng bán; ngừng bán bằng `[foods.is_available] = 0`.
- **BR-NEWS-01 (SHOULD):** Admin thêm, sửa, xóa tin tức. Khách xem danh sách và chi tiết, không cần đăng nhập. Ảnh tải lên Cloudinary.

---

## 14. Các điểm chưa chốt

Các quy tắc dưới đây đang dùng giá trị tạm. Đổi thì sửa tham số ở mục 1 hoặc quy tắc tương ứng.

| # | Nội dung | Giá trị hiện tại |
|---|---|---|
| 1 | Thời gian giữ ghế | 10 phút, không gia hạn khi tạo đơn (BR-HOLD-04) |
| 2 | Số ghế tối đa mỗi đơn | 8 |
| 3 | Đóng bán online trước giờ chiếu | 15 phút; quầy bán đến giờ bắt đầu |
| 4 | Thời gian dọn phòng giữa hai suất | 15 phút |
| 5 | Ghế Couple | Một dòng là một ghế đôi, giá cho cả đôi |
| 6 | Hủy đơn đã thanh toán | Chỉ STAFF/ADMIN, trước giờ chiếu 60 phút, hoàn tiền thủ công |
| 7 | Thanh toán sai số tiền hoặc trễ hạn | Chỉ ghi nhận, đối soát thủ công |
| 8 | Xác thực webhook Casso và mã phản hồi | Cần đọc tài liệu Casso |
| 9 | Giữ ghế cần đăng nhập | Có, khách vãng lai không giữ được ghế |
| 10 | Nơi lưu token đăng nhập ở frontend | `localStorage` (đơn giản; có rủi ro XSS) |

---

## 15. Ngoài phạm vi phiên bản 1.0

Các chức năng sau **không** làm trong phiên bản 1.0:

- Bảng giá riêng theo định dạng chiếu (2D, 3D, IMAX): chưa có cột lưu định dạng chiếu.
- Thẻ thành viên, điểm tích lũy.
- Đổi vé.
- Quy tắc “không để trống một ghế đơn lẻ giữa hai ghế đã chọn”.
- Giới hạn số lần dùng mã và mức giảm tối đa của khuyến mãi.
- Hoàn tiền tự động qua API.
- Soát vé có đánh dấu đã dùng.
- Nhiều rạp (dữ liệu đã hỗ trợ nhưng giao diện chưa có).
- Gợi ý phim, email thông báo hàng loạt.
