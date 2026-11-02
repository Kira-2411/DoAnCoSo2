# QUY TẮC LÀM VIỆC CHO AI AGENT VÀ LẬP TRÌNH VIÊN

> **Dự án:** Hệ thống đặt vé xem phim trực tuyến – Akashi Cinema  
> **Áp dụng cho:** Mọi công cụ AI (Cursor, Antigravity, GitHub Copilot, Claude...) và mọi lập trình viên trong nhóm.  
> **Vị trí file:** File này đặt ở thư mục gốc repo và tên đúng là `AGENTS.md` để các công cụ AI (kể cả Antigravity) tự nạp.  
> **Bắt buộc:** Đầu mỗi phiên làm việc mới, AI phải đọc lại file này.

---

## 0. PHÂN CÔNG VÀ HỢP ĐỒNG API

- **Phân công trách nhiệm:** Giao diện (`frontend/`) do người phụ trách giao diện (chủ dự án) làm. Các lập trình viên khác chủ yếu làm backend.
- **Ranh giới công việc:** Lập trình viên backend (và AI của họ) **chỉ sửa trong `backend/`**. Tuyệt đối **không sửa `frontend/`**. Phát hiện lỗi hoặc thiếu sót ở giao diện thì ghi lại và báo người phụ trách giao diện.
- **Hợp đồng API:** `docs/API.md` là hợp đồng giữa hai phía. Giao diện được làm theo tài liệu này, nên khi viết endpoint phải đúng đường dẫn, phương thức, tên trường (`camelCase`), mã HTTP và mã lỗi đã ghi.
- **Không tự thay đổi hợp đồng:** Đổi tên hoặc xóa trường, thêm trường bắt buộc, đổi mã lỗi hoặc mã HTTP đều có thể làm hỏng giao diện. Cần thay đổi thì đề xuất trước, được người phụ trách giao diện đồng ý, và sửa `docs/API.md` trong cùng Pull Request. Thêm một trường tùy chọn vào response thì an toàn.
- **Bàn giao API:** Khi xong một endpoint mới, báo người phụ trách giao diện để chuyển phần dữ liệu giả sang gọi API thật.

---

## 1. NGUYÊN TẮC CỐT LÕI

### 1.1. Đọc tài liệu trước khi code
Luôn đối chiếu với các tài liệu trong `docs/`:
- `docs/PROJECT_BRIEF.md`: Tổng quan, công nghệ, cấu trúc thư mục, quy ước.
- `docs/BUSINESS_RULES.md`: Quy tắc nghiệp vụ, mỗi quy tắc có mã `BR-...`.
- `docs/API.md`: Đặc tả endpoint, request, response, mã lỗi.
- `backend/src/main/resources/db/migration/`: Cấu trúc bảng thực tế (Flyway).
- `docs/UI/`: Ảnh mẫu giao diện, **chỉ để tham khảo bố cục, màu sắc, câu chữ**. Dữ liệu và hành vi luôn theo `API.md` và `BUSINESS_RULES.md`, **không thêm tính năng hay trường dữ liệu chỉ vì có trong ảnh**.
- **Khi tài liệu mâu thuẫn nhau:** **DỪNG LẠI VÀ HỎI**, không tự chọn một bên.

### 1.2. Kế hoạch trước khi code (Plan Before Code)
Trước khi tạo hoặc sửa bất kỳ file nào, AI bắt buộc phải liệt kê:
1. Việc sẽ làm.
2. Danh sách file sẽ tạo hoặc sửa.
- **Dừng lại chờ lập trình viên đồng ý rồi mới viết code.**

### 1.3. Mỗi lần một việc nhỏ
- Chỉ làm đúng phạm vi được yêu cầu. Đang làm frontend thì không sửa backend, và ngược lại.
- Không refactor hay sửa file không liên quan.
- Không thêm thư viện mới, không đổi công nghệ, không đổi cấu trúc thư mục đã chốt khi chưa được đồng ý. Không sửa `pom.xml` hoặc `package.json` trừ khi kế hoạch đã duyệt nêu rõ.

### 1.4. Báo cáo trung thực
- Nêu rõ việc đã làm, lệnh thật đã chạy và kết quả.
- Liệt kê test nào từng đỏ trong quá trình làm và đã sửa thế nào.
- Nêu rõ phần chưa kiểm tra được (ví dụ: chưa thử trên trình duyệt, chưa gửi thư thật).
- Không báo "hoàn thành" khi chưa chạy kiểm tra. Test dùng mock không chứng minh được hành vi giao dịch hoặc dữ liệu thật trong database.

---

## 2. AN TOÀN VÀ BẢO MẬT (TUYỆT ĐỐI TUÂN THỦ)

- **File `.env`:** Không đọc, không in, không đưa vào commit hay log. Mọi bí mật (mật khẩu DB, khóa JWT, mật khẩu ứng dụng Gmail...) chỉ đọc qua biến môi trường. Nếu công cụ AI có cơ chế bỏ qua file (ignore), thêm `.env` vào đó.
- **Biến môi trường mới:** Thêm vào `.env.example` với giá trị giả, không bao giờ ghi giá trị thật.
- **Dữ liệu xác thực:** Không in mã OTP, mật khẩu, token ra console, log hay test output. Không trả `password_hash` ra API. Khi ghi log có email thì che bớt (ví dụ `a***@gmail.com`).
- **Lệnh phá hủy:** Cấm khi chưa được lập trình viên đồng ý rõ ràng: `docker compose down -v`, `docker volume rm`, `docker system prune`, `DROP DATABASE`, `git reset --hard`, `git push --force`, xóa file hoặc thư mục ngoài phạm vi.
- **Git:** AI không tự chạy `git add`, `commit`, `push`, `merge`, `rebase`, `reset`, `checkout`. Việc này do lập trình viên làm. Được dùng lệnh chỉ đọc như `git status`, `git diff`.
- **Tài liệu:** Không sửa `docs/` khi không được yêu cầu. Phát hiện tài liệu sai hoặc thiếu thì báo lại.
- **Dịch vụ bên ngoài:** (Gmail, Casso, Cloudinary): test tự động không gọi dịch vụ thật, dùng mock.

---

## 3. QUY CHUẨN BACKEND (Spring Boot 3, Java 17 trong pom.xml, chạy bằng JDK 21, MySQL 8)

### 3.1. Kiến trúc phân tầng
- Package chia theo tầng: `controller`, `service`, `repository`, `entity`, `dto/request`, `dto/response`, `enums`, `exception`, `security`, `config`. Không tạo thư mục theo tính năng.
- **Controller mỏng:** Chỉ nhận request, `@Valid`, gọi Service, trả response.
- **Service chứa toàn bộ logic:** Thao tác ghi nhiều bước nằm trong một transaction.
- **Service gọi Service của tính năng khác:** Không gọi trực tiếp Repository của tính năng khác.
- **Ranh giới API:** Luôn dùng DTO ở ranh giới API, không trả Entity.

### 3.2. Bảo mật & Xác thực dữ liệu
- Không tin dữ liệu từ client.
- Kiểm tra quyền ở backend (`SecurityConfig`, `@PreAuthorize`), không dựa vào việc giao diện ẩn nút (`BR-ROLE-01`).
- Backend tự tính giá và tổng tiền, không nhận số tiền hay vai trò từ client (`BR-PRC-04`, `BR-ROLE-03`).
- Thông báo lỗi không tiết lộ email hay tài khoản nào có thật (`BR-AUTH-09`, `BR-AUTH-14`).
- Kiểm tra đầu vào bằng `@Valid` với giới hạn độ dài khớp cột DB. Dữ liệu sai phải trả `400 VALIDATION_ERROR`, không để rơi thành lỗi 500.

### 3.3. Giao dịch (@Transactional)
- Khi một phương thức ném `AppException` mà vẫn cần lưu dữ liệu (ví dụ đếm số lần nhập sai OTP), phải khai báo `noRollbackFor = AppException.class` ở mọi phương thức `@Transactional` trong chuỗi gọi. Nếu không, giao dịch bị đánh dấu rollback-only và client nhận lỗi 500.
- Không dùng `REQUIRES_NEW` khi chưa được đồng ý.
- Phương thức bắt `AppException` để trả kết quả thay thế thì không đặt `@Transactional`.
- Logic giữ ghế, tạo đơn, thanh toán, đồng thời: bắt buộc có test tích hợp trên database thật (`@SpringBootTest`, không đặt `@Transactional` trên lớp test).

### 3.4. Cơ sở dữ liệu và Flyway
- Không sửa file migration đã commit (`V1`, `V2`...). Mọi thay đổi bảng là một file mới `V<số>__<mô_tả>.sql`.
- Không xóa cứng dữ liệu lịch sử (người dùng, phim, suất chiếu, đơn). Chỉ ẩn bằng `is_active = 0`.
- Hibernate chạy `ddl-auto: validate`: Entity phải khớp từng cột. Nếu validate báo sai kiểu cột, sửa Entity, không tắt validate, không sửa migration.

### 3.5. Quy chuẩn dữ liệu
- **Tiền:** Số nguyên VNĐ, kiểu `Long` hoặc `BigDecimal`, không dùng `double`.
- **Thời gian:** `LocalDateTime`, múi giờ `Asia/Ho_Chi_Minh`, lấy từ JVM.
- **Cột ENUM:** `@Enumerated(EnumType.STRING)`.
- **Lỗi:** Đúng cấu trúc `status`, `code`, `message`, `timestamp` theo `docs/API.md` mục 0, xử lý tập trung ở `GlobalExceptionHandler`.

---

## 4. QUY CHUẨN FRONTEND (React, Vite, Tailwind CSS)
*(Mục này chỉ áp dụng khi được giao sửa `frontend/`. Lập trình viên backend bỏ qua mục này).*

### 4.1. Cấu trúc thư mục
- `src/pages/`: Mỗi màn hình một file (có thư mục con theo nhóm, ví dụ `pages/auth/`).
- `src/components/`: Thành phần dùng chung.
- `src/api/`: Các hàm gọi API, luôn đi qua `axiosClient.js` dùng chung.
- `src/contexts/`: State toàn cục (`AuthContext.jsx`...).
- `src/routes/`: Định tuyến và chặn theo vai trò (`ProtectedRoute.jsx`).
- `src/utils/`: Hàm tiện ích (`validators.js`...).
- `src/hooks/`, `src/styles/`, `src/assets/`.
- **Dùng lại, không tạo bản sao:** `axiosClient`, `AuthContext`, `ProtectedRoute`, `validators.js`.

### 4.2. Thành phần giao diện dùng chung
- `Header`, `BottomNav` (thanh điều hướng nổi dạng viên thuốc, mờ kính), `MessengerButton` (nút Messenger nổi góc dưới bên phải).
- Nếu đã tồn tại thì dùng lại; nếu chưa có thì hỏi lập trình viên trước khi tạo, không tự đoán.

### 4.3. Màu sắc và chế độ giao diện
- Dùng các biến CSS trong `src/styles/index.css` (ví dụ `--primary`), không viết cứng mã màu trong component.
- Giao diện tối là mặc định. Chế độ sáng chỉ làm khi nhóm đã có `ThemeContext`; trước đó vẫn dùng biến CSS để sau này chuyển đổi dễ.

### 4.4. Biểu mẫu (Forms)
- Kiểm tra dữ liệu bằng `utils/validators.js`, thông báo tiếng Việt dưới từng ô, viền ô đỏ khi lỗi, `noValidate`, `aria-invalid`, `aria-describedby`, `role="alert"`, đưa focus về ô lỗi đầu tiên, nút gửi có trạng thái đang xử lý.
- Mật khẩu không `trim()`.
- Hiển thị đúng thông báo từ server theo mã lỗi.
- Không in dữ liệu nhạy cảm (mật khẩu, mã OTP, token) ra console. Không đặt mã OTP, mật khẩu hoặc token lên URL.

### 4.5. Mock Data khi Backend chưa có API
- Dùng dữ liệu giả đặt ở một chỗ (`src/mocks/` hoặc trong component/api), cấu trúc khớp response trong `docs/API.md` (`camelCase`), có chú thích `TODO` thay bằng API thật.
- **Phải báo rõ cho lập trình viên phần nào đang dùng dữ liệu giả.**

---

## 5. NGHIỆM THU TRƯỚC KHI BÁO HOÀN THÀNH

- **Backend:** Chạy `mvn test` trong thư mục `backend` (JDK 21), toàn bộ phải xanh (`BUILD SUCCESS`). Test đỏ thì sửa mã nguồn, không sửa test cho lọt.
- **Frontend:** Chạy `npm run build` trong thư mục `frontend`, build phải thành công.
- **Báo cáo:** Theo mục 1.4. Với frontend, ghi rõ các bước lập trình viên tự thử trên trình duyệt (vì build thành công chưa chứng minh giao diện chạy đúng).

---

## 6. QUY TRÌNH GIT

- Mỗi tính năng làm trên một nhánh riêng `feature/<tên-tính-năng>`; sửa lỗi dùng `fix/<tên>`.
- Commit nhỏ, mỗi commit một việc, thông điệp rõ ràng.
- Lập trình viên (không phải AI) chạy lệnh Git. Trước khi commit, chạy `git status` và kiểm tra không có `.env`, `node_modules`, `dist`, `target` hay file nháp.
- Ảnh mẫu giao diện trong `docs/UI/` chỉ được đưa vào Git khi nhóm đã quyết định (cân nhắc dung lượng). AI không tự `git add` các ảnh này.
- Trước khi tạo migration mới, chạy `git pull` để biết số phiên bản đang dùng, tránh hai người trùng số.

