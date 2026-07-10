# Sâm Lốc Scorekeeper 🏆

Ứng dụng ghi điểm, thống kê trận đấu và bảng xếp hạng Cao Thủ cho trò chơi Sâm Lốc. Dự án được phát triển dưới dạng ứng dụng Fullstack (Vite + React ở Frontend, Express + SQLite ở Backend).

---

## 📂 Cấu Trúc Dự Án

- `/src`: Mã nguồn giao diện Frontend (React + Vite + TypeScript + TailwindCSS).
- `/server`: Mã nguồn máy chủ Backend (Node.js Express + SQLite3).
  - `/server/server.cjs`: Tệp khởi chạy máy chủ (sử dụng CommonJS).
  - `/server/samloc.db`: Cơ sở dữ liệu SQLite chính (tự động tạo ra).
- `/sqllite_base64`: Bản sao lưu cơ sở dữ liệu dưới dạng mã hóa Base64 dùng để khôi phục dữ liệu ban đầu khi khởi tạo server mới.

---

## 🛠️ Chạy Ở Chế Độ Phát Triển (Development)

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   yarn install
   ```

2. Khởi chạy đồng thời cả Frontend (cổng `5173`) và Backend API (cổng `3001`):
   ```bash
   yarn dev:all
   ```
   *Vite được cấu hình proxy tự động chuyển tiếp các request `/api/*` về `http://localhost:3001`.*

---

## 🚀 Quy Trình Đẩy Lên Production (Deployment Workflow)

Khi đưa ứng dụng lên máy chủ chạy chính thức (VPS, Server dùng chung), hãy làm theo các bước sau:

### Bước 1: Biên dịch mã nguồn Frontend
Chạy lệnh biên dịch tại máy local của bạn:
```bash
yarn build
```
Lệnh này sẽ tạo ra thư mục `/dist` ở thư mục gốc chứa toàn bộ mã nguồn giao diện HTML/CSS/JS đã được tối ưu hóa.

### Bước 2: Chuẩn bị tệp tin đưa lên Server
Sao chép các tệp tin và thư mục sau lên máy chủ Production:
- Thư mục `/dist` (Chứa giao diện đã build)
- Thư mục `/server` (Chứa code backend & dữ liệu)
- File `package.json`
- File `sqllite_base64` (Seed dữ liệu ban đầu nếu cần)

*Mẹo: Bạn có thể nén các thư mục trên thành một file `.zip` để tải lên server nhanh hơn.*

### Bước 3: Cài đặt thư viện trên Server
Truy cập vào thư mục dự án trên Server qua SSH và cài đặt các thư viện sản xuất (chỉ cài đặt dependencies cần thiết, bỏ qua devDependencies):
```bash
npm install --production
```

### Bước 4: Khởi động máy chủ bằng PM2 (Khuyên dùng)
Để đảm bảo máy chủ Backend luôn chạy ngầm và tự động khởi động lại khi gặp sự cố, bạn nên sử dụng trình quản lý tiến trình **PM2**:

1. Cài đặt PM2 toàn cục trên server (nếu chưa có):
   ```bash
   npm install -g pm2
   ```

2. Khởi chạy server Backend:
   ```bash
   pm2 start server/server.cjs --name "samloc-scorekeeper"
   ```

3. Cấu hình cổng tùy chỉnh (Mặc định là `3001`):
   Nếu bạn muốn chạy server ở cổng khác (ví dụ: cổng `80` hoặc `8080`), hãy truyền biến môi trường `PORT`:
   ```bash
   PORT=8080 pm2 start server/server.cjs --name "samloc-scorekeeper"
   ```

4. Thiết lập tự khởi động cùng hệ điều hành:
   ```bash
   pm2 startup
   pm2 save
   ```

---

## 📝 Lưu ý quan trọng khi triển khai SQLite

- **Quyền ghi tệp tin**: Hãy đảm bảo tiến trình Node/PM2 trên server có đủ quyền đọc và ghi (Read/Write) vào thư mục `/server` để tạo và cập nhật tệp tin cơ sở dữ liệu `samloc.db`.
- **Khởi tạo cơ sở dữ liệu**: Khi máy chủ khởi động lần đầu, nếu chưa có tệp `/server/samloc.db`, máy chủ sẽ tự động giải mã nội dung từ tệp `/sqllite_base64` để phục hồi lại toàn bộ danh sách người chơi và lịch sử xếp hạng ban đầu.
