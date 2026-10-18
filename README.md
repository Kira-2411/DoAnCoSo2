# Akashi Cinema

Hệ thống đặt vé xem phim trực tuyến: khách hàng chọn phim, suất chiếu, ghế và thanh toán; nhân viên bán vé tại quầy; quản trị viên quản lý phim, lịch chiếu, giá và thống kê. Dự án Đồ án Cơ sở 2.

Kiến trúc tách hai phần: **backend** (REST API, Spring Boot) và **frontend** (React), dùng chung một cơ sở dữ liệu MySQL.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Backend | Java 17+ (dev dùng JDK 21), Spring Boot 3.2, Spring Data JPA, Spring Security, JWT |
| Cơ sở dữ liệu | MySQL 8.0 (chạy bằng Docker), Flyway quản lý cấu trúc bảng |
| Frontend | React, Vite, Tailwind CSS, React Router, axios |

## Yêu cầu môi trường

- JDK 21 (hoặc 17)
- Node.js 18 trở lên
- Docker Desktop
- IntelliJ IDEA (hoặc IDE Java khác) để chạy backend

## Chạy dự án

**1. Tạo file `.env`** ở thư mục gốc từ bản mẫu rồi điền giá trị (không commit file này):

```bash
copy .env.example .env
```

Các biến: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `DB_PORT`, `JWT_SECRET`. Chỉ dùng chữ, số và dấu gạch dưới cho mật khẩu.

**2. Bật MySQL** (Docker Desktop phải đang chạy):

```bash
docker compose up -d mysql
```

MySQL nghe ở `localhost:3307` (đổi bằng `DB_PORT` trong `.env`). Database tên `Akashi_Cinema`, phân biệt hoa thường.

**3. Chạy backend:** mở thư mục `backend` bằng IDE, chạy lớp `AkashiCinemaApplication`. Lần chạy đầu Flyway tự tạo 16 bảng và nạp dữ liệu mẫu. Backend chạy ở `http://localhost:8080`, các endpoint bắt đầu bằng `/api`.

**4. Chạy frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy ở `http://localhost:5173`.

## Tài khoản mẫu (chỉ dùng cho dev)

Cùng mật khẩu `Akashi@2026`:

| Email | Vai trò |
|---|---|
| `admin@example.com` | ADMIN |
| `staff@example.com` | STAFF |
| `customer@example.com` | CUSTOMER |

## Dọn dữ liệu và dựng lại database

Khi muốn xóa sạch database trên máy và để Flyway tạo lại từ đầu (mất toàn bộ dữ liệu đang có trong container):

```bash
docker compose down -v
docker compose up -d mysql
```

Sau đó chạy lại backend.

## Cấu trúc thư mục

```
backend/    # Spring Boot (chia package theo tầng: controller, service, repository, ...)
frontend/   # React + Vite
docs/       # tài liệu dự án
```

Mô tả chi tiết cấu trúc, quy ước code và quy trình làm việc nằm trong [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md).

## Tài liệu

- [Tổng quan dự án](docs/PROJECT_BRIEF.md)
- [Quy tắc nghiệp vụ](docs/BUSINESS_RULES.md)
- [Đặc tả API](docs/API.md)
