# 🎬 Akashi Cinema - Hệ Thống Quản Lý & Đặt Vé Xem Phim

Dự án Đồ Án Cơ Sở 2: Xây dựng hệ thống rạp chiếu phim trực tuyến hiện đại với kiến trúc tách biệt Frontend & Backend (Client-Server).

---

## 📁 Cấu trúc thư mục dự án

```text
DoAnCoSo2/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/akashi/cinema/
│       │   │   ├── AkashiCinemaApplication.java
│       │   │   ├── config/             # Cấu hình hệ thống (CORS, Swagger, JPA, ...)
│       │   │   ├── security/           # Cấu hình bảo mật, JWT filter & providers
│       │   │   ├── entity/             # Các JPA entities (Movie, Showtime, Booking, ...)
│       │   │   ├── repository/         # Spring Data JPA repositories
│       │   │   ├── dto/                # Data Transfer Objects (Request/Response)
│       │   │   ├── service/            # Business logic & services
│       │   │   ├── controller/         # REST Controllers
│       │   │   └── exception/          # Custom exceptions & GlobalExceptionHandler
│       │   └── resources/
│       │       ├── application.yml     # Cấu hình Spring Boot
│       │       └── db/migration/       # Các file migration Flyway
│       └── test/                       # Unit & Integration tests
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx                    # Điểm khởi chạy React
│       ├── App.jsx                     # Component gốc
│       ├── api/                        # Cấu hình Axios & gọi API
│       ├── components/                 # Các component tái sử dụng (Navbar, Button, Card, ...)
│       ├── pages/                      # Các trang giao diện (Home, Movies, Booking, ...)
│       ├── hooks/                      # Custom React hooks
│       └── styles/                     # CSS & stylesheets
├── docs/
│   ├── PROJECT_BRIEF.md                # Bản mô tả tổng quan dự án & yêu cầu
│   ├── BUSINESS_RULES.md               # Quy tắc nghiệp vụ chi tiết
│   └── API.md                          # Tài liệu đặc tả API RESTful
├── docker-compose.yml                  # Khởi chạy toàn bộ hệ thống bằng Docker
├── .env.example                        # Mẫu biến môi trường
├── .gitignore                          # Cấu hình loại trừ file của Git
└── README.md                           # Hướng dẫn dự án
```

---

## 🛠️ Công nghệ sử dụng

- **Backend**: Java 17, Spring Boot 3.2.x, Spring Data JPA, Spring Security, JWT, Flyway, MySQL.
- **Frontend**: React 18, Vite, React Router DOM, Axios, Lucide Icons, CSS3.
- **DevOps**: Docker, Docker Compose.

---

## 🚀 Hướng dẫn khởi chạy

### 1. Chuẩn bị môi trường
- JDK 17+
- Maven 3.8+
- Node.js 18+ & npm
- MySQL 8.0+ (hoặc dùng Docker)

### 2. Thiết lập biến môi trường
Tạo file `.env` từ file `.env.example`:
```bash
cp .env.example .env
```

### 3. Chạy bằng Docker Compose (Khuyên dùng)
```bash
docker-compose up -d
```

### 4. Chạy thủ công từng phần

#### Chạy Backend:
```bash
cd backend
mvn clean spring-boot:run
```
Backend sẽ khởi chạy tại: `http://localhost:8080/api`

#### Chạy Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:5173`

---

## 📚 Tài liệu tham khảo
- [Mô tả dự án (Project Brief)](file:///d:/Project_Java/DoAnCoSo2/docs/PROJECT_BRIEF.md)
- [Quy tắc nghiệp vụ (Business Rules)](file:///d:/Project_Java/DoAnCoSo2/docs/BUSINESS_RULES.md)
- [Đặc tả API (API Documentation)](file:///d:/Project_Java/DoAnCoSo2/docs/API.md)
