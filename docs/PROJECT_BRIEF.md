# Akashi Cinema – Tổng quan dự án

Hệ thống đặt vé xem phim trực tuyến. Khách hàng xem phim, chọn suất chiếu và ghế, thanh toán và nhận vé điện tử. Nhân viên bán vé tại quầy. Quản trị viên quản lý phim, lịch chiếu, giá, đồ ăn, khuyến mãi và xem thống kê.

Đọc các tài liệu sau **trước khi viết code**:

| Tài liệu | Nội dung |
|---|---|
| `docs/BUSINESS_RULES.md` | Quy tắc nghiệp vụ, mỗi quy tắc có mã `BR-...` |
| `docs/API.md` | Đặc tả endpoint, định dạng request, response và lỗi |
| `docs/Thiet_Ke_CSDL_Akashi_Cinema_Web.docx` | Mô tả 16 bảng và từng cột |
| `backend/src/main/resources/db/migration/` | Cấu trúc bảng thực tế (Flyway) |

Khi các tài liệu mâu thuẫn nhau, **dừng lại và hỏi**, không tự chọn một bên.

---

## 1. Công nghệ đã chốt

| Tầng | Công nghệ |
|---|---|
| Backend | Java (`pom.xml` khai báo 17, môi trường dev dùng JDK 21), Spring Boot 3.2.5 (Web, Data JPA, Security, Validation), Lombok |
| Cơ sở dữ liệu | MySQL 8.0, chạy bằng Docker; cấu trúc bảng do **Flyway** quản lý |
| Xác thực | JWT (thư viện jjwt 0.12.5), mật khẩu băm BCrypt |
| Frontend | React + Vite, Tailwind CSS, axios, React Router, TanStack Query |
| Realtime ghế | SSE (Server-Sent Events) |
| Lưu ảnh | Cloudinary (tải trực tiếp từ trình duyệt) |
| Email | Spring Mail (gửi OTP và vé) |
| Thanh toán | Chuyển khoản QR qua Casso (webhook) và tiền mặt tại quầy |

Không đổi công nghệ hoặc thêm thư viện mới khi chưa được đồng ý.

---

## 2. Cấu trúc thư mục

```
DoAnCoSo2/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/akashi/cinema/
│       │   │   ├── AkashiCinemaApplication.java
│       │   │   ├── config/        # cấu hình: Security, CORS, Cloudinary, ...
│       │   │   ├── security/      # JWT, bộ lọc xác thực, UserDetailsService
│       │   │   ├── controller/    # REST controller (mỏng)
│       │   │   ├── service/       # logic nghiệp vụ, transaction
│       │   │   ├── repository/    # Spring Data JPA
│       │   │   ├── entity/        # ánh xạ bảng
│       │   │   ├── dto/
│       │   │   │   ├── request/
│       │   │   │   └── response/
│       │   │   └── exception/     # lỗi nghiệp vụ và bộ xử lý lỗi chung
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/  # V1__init_schema.sql, V2__seed_dev_data.sql, ...
│       └── test/java/com/akashi/cinema/
├── frontend/
│   └── src/
│       ├── api/                   # axios và các hàm gọi API
│       ├── components/            # thành phần dùng chung
│       ├── pages/                 # mỗi trang một file
│       ├── hooks/
│       ├── styles/
│       ├── App.jsx
│       └── main.jsx
├── docs/
├── docker-compose.yml             # chỉ chứa MySQL cho môi trường dev
├── .env                           # không commit
├── .env.example
└── README.md
```

Cách đọc cây: `├──` là một mục nằm trong thư mục cha, `└──` là mục cuối, tên có `/` ở cuối là thư mục, phần sau `#` là ghi chú.

Thư mục sẽ tạo thêm khi cần, chỉ tạo khi làm đến tính năng tương ứng: `enums/`, `mapper/`, `scheduler/`, `util/` (backend); `contexts/`, `routes/`, `utils/` (frontend). Backend **chia theo tầng**: mọi controller nằm trong `controller/`, mọi service trong `service/`, không tạo thư mục theo tính năng.

---

## 3. Chạy dự án trên máy dev

1. **Tạo `.env`** ở thư mục gốc từ `.env.example`, điền giá trị. Không commit file này.
2. **Bật MySQL:** `docker compose up -d mysql`. MySQL nghe ở `localhost:${DB_PORT}` (mặc định **3307**, tránh đụng MySQL cài sẵn ở 3306). Tên database `Akashi_Cinema` (phân biệt hoa thường).
3. **Chạy backend:** chạy lớp `AkashiCinemaApplication` bằng IDE (JDK 21). Spring đọc `.env` qua `spring.config.import`. Lần chạy đầu Flyway tự tạo bảng và nạp dữ liệu mẫu. Backend nghe ở `http://localhost:8080`.
4. **Chạy frontend:** trong `frontend/` chạy `npm install` rồi `npm run dev` (cổng 5173). Vite chuyển tiếp `/api` sang `http://localhost:8080`.

Tài khoản mẫu (từ `V2__seed_dev_data.sql`, chỉ dùng cho dev, cùng mật khẩu `Akashi@2026`):

| Email | Vai trò |
|---|---|
| `admin@example.com` | ADMIN |
| `staff@example.com` | STAFF |
| `customer@example.com` | CUSTOMER |

Kiểm tra nhanh: `SHOW TABLES;` trong database `Akashi_Cinema` phải có 17 bảng (16 bảng nghiệp vụ và `flyway_schema_history`).

---

## 4. Quy ước code

### Backend

- **Controller mỏng:** chỉ nhận request, kiểm tra dữ liệu đầu vào (`@Valid`), gọi Service, trả response. Không viết logic nghiệp vụ trong controller.
- **Logic nghiệp vụ nằm ở `service/`.** Mọi thao tác ghi gồm nhiều bước phải nằm trong **một transaction** (`@Transactional` trên Service).
- **Dùng DTO ở ranh giới API.** Không trả Entity ra ngoài. Không bao giờ trả `password_hash`.
- **Service gọi Service của tính năng khác,** không gọi thẳng Repository của tính năng khác.
- **Đặt tên:** class `PascalCase`, trường và biến `camelCase`, bảng và cột trong DB `snake_case`. Khai báo `@Table` và `@Column` tường minh, không dựa vào quy tắc tự đặt tên.
- **Tiền:** số nguyên VNĐ, kiểu `Long` hoặc `BigDecimal`, không dùng `double`. **Thời gian:** `LocalDateTime`, múi giờ `Asia/Ho_Chi_Minh`.
- **Lỗi:** trả đúng định dạng ở `docs/API.md` mục 0 (`status`, `code`, `message`, `timestamp`), xử lý tập trung ở `GlobalExceptionHandler`.
- **Cấu hình và bí mật** (mật khẩu DB, khóa JWT, khóa dịch vụ ngoài) đọc từ biến môi trường qua `.env`. Không viết cứng trong code hay `application.yml`.
- **Test:** viết test cho logic quan trọng (đăng nhập, tính giá, giữ ghế, thanh toán).
- **Ánh xạ Entity:** cột ENUM của MySQL dùng `@Enumerated(EnumType.STRING)`. Hibernate chạy ở chế độ `ddl-auto: validate` nên Entity phải khớp bảng. Các chỗ hay lệch: cột `TINYINT` (ví dụ `seat_types.people_count`) cần kiểu `byte`/`Byte` hoặc `@JdbcTypeCode(SqlTypes.TINYINT)`; cột ENUM và `TEXT` có thể cần chỉnh kiểu ánh xạ. Nếu validate báo sai kiểu cột, **sửa Entity** hoặc hỏi lại. Không tắt `validate`, không đổi sang `update` hay `create`.

### Cơ sở dữ liệu và Flyway

- Cấu trúc bảng chỉ thay đổi bằng **file migration mới** `V<số>__<mô_tả>.sql` trong `db/migration/`.
- **Không sửa file migration đã có** (V1, V2…) sau khi đã commit. Tên file đúng dạng: chữ `V` hoa, hai dấu gạch dưới.
- Không xóa cứng dữ liệu lịch sử (phim, người dùng, suất chiếu, đơn). Ẩn bằng cột `is_active`.

### Frontend

- Mỗi trang là một file trong `pages/`, thành phần dùng lại nằm trong `components/`.
- Mọi lời gọi API đi qua `api/`, dùng chung một `axios` đã cấu hình (gắn header `Authorization`, xử lý 401).
- Kiểm tra quyền ở giao diện chỉ để tiện dùng. Việc bảo vệ thật nằm ở backend.

---

## 5. Quy tắc làm việc cho AI và lập trình viên

1. Đọc các tài liệu ở đầu file này trước khi code.
2. Mỗi lần chỉ làm **một tính năng nhỏ**. **Liệt kê các file sẽ tạo hoặc sửa trước khi viết.**
3. Không đọc, in ra hoặc commit nội dung `.env`. Không đưa bí mật vào mã nguồn, log hay tài liệu.
4. Không sửa file migration đã có. Muốn đổi cấu trúc bảng, tạo file migration mới.
5. Không chạy lệnh phá hủy khi chưa được hỏi: `docker compose down -v`, `DROP DATABASE`, `git reset --hard`, xóa file hoặc thư mục.
6. Không tự ý thay đổi `docs/`. Phát hiện tài liệu sai hoặc mâu thuẫn thì báo lại.
7. Không đổi cấu trúc thư mục đã chốt ở mục 2.
8. Code phải chạy được và có kiểm tra (build, test hoặc thử gọi API) trước khi báo hoàn thành.

---

## 6. Quy trình Git

- Nhánh `main` luôn chạy được. Mỗi tính năng làm trên nhánh riêng (`feature/<tên>`) rồi gộp qua Pull Request.
- Commit nhỏ, mỗi commit một việc, thông điệp rõ ràng.
- Migration mới được commit **cùng lúc** với code Entity dùng nó.
- Trước khi tạo migration mới, chạy `git pull` để biết số phiên bản đang dùng, tránh hai người trùng số.

---

## 7. Trạng thái hiện tại

- **Đã xong:** MySQL chạy bằng Docker; Flyway tạo 16 bảng (`V1`) và nạp dữ liệu mẫu (`V2`); backend khởi động và kết nối được database.
- **Tiếp theo:** đăng nhập (`POST /api/auth/login`, `GET /api/auth/me`) theo `docs/API.md` mục 1 và `docs/BUSINESS_RULES.md` mục 3.
