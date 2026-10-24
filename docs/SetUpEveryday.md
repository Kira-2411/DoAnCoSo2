Trước khi tắt máy hôm nay:
Tắt Frontend & Backend: Nhấn Ctrl + C ở các cửa sổ Terminal đang chạy Frontend/Backend (hoặc bấm nút Stop đỏ trong IntelliJ/IDE).
Tắt MySQL an toàn: Mở terminal tại thư mục dự án và chạy:
bash
docker compose stop
⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG: Tuyệt đối KHÔNG dùng lệnh docker compose down -v khi chuẩn bị tắt máy. Cờ -v sẽ xóa sạch toàn bộ dữ liệu (phim, suất chiếu, tài khoản, vé...) bạn đã tạo trong Database.

☀️ Ngày mai mở máy lên: Quy trình 4 bước khởi động lại
Bước 1: Mở ứng dụng Docker Desktop
Bật Docker Desktop và đợi 10 – 30 giây cho đến khi biểu tượng Docker ở góc dưới màn hình chuyển sang màu xanh lá (Engine running).
Bước 2: Khởi động Database (MySQL)
Mở Terminal (PowerShell / Command Prompt) tại thư mục gốc dự án:
bash
docker compose up -d mysql
Lệnh này sẽ đánh thức lại container MySQL và giữ nguyên toàn bộ dữ liệu từ hôm trước.
Bước 3: Khởi động Backend (Spring Boot)
Mở thư mục backend bằng IDE (IntelliJ IDEA / VS Code / Eclipse).
Mở file: src/main/java/.../AkashiCinemaApplication.java
Bấm nút Run (biểu tượng tam giác xanh) để chạy.
Backend sẽ tự động kết nối vào MySQL (cổng 3307), nạp cấu hình từ 

.env
, chạy Flyway và mở ở cổng 8080.
Bước 4: Khởi động Frontend (React + Vite)
Mở một tab Terminal mới và di chuyển vào thư mục frontend:
bash
cd frontend 
npm run dev
Mở trình duyệt web truy cập vào: http://localhost:5173.
💡 Mẹo nhỏ cho lần này (Vì bạn vừa mới sửa 

docker-compose.yml
): MySQL chỉ đọc các biến ${DB_USER}, ${DB_PASSWORD} từ .env để tạo tài khoản ở lần đầu tiên volume được tạo. Nếu bạn vừa sửa docker-compose.yml mà chưa reset volume thì user akashi vẫn chưa được tạo.

Chỉ duy nhất một lần này (trước khi bắt đầu làm tiếp), bạn hãy chạy:
bash
docker compose down -v
docker compose up -d mysql
Sau lần này, tài khoản akashi với mật khẩu trong .env sẽ chính thức được tạo, và từ đó về sau bạn chỉ cần dùng docker compose up -d mysql mỗi ngày là xong!