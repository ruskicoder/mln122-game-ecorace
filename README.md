# Đường Đua Kinh Tế Việt Nam (MLN122)

Web game mô phỏng thời gian thực các thành phần kinh tế, cơ chế thuế vĩ mô, phúc lợi xã hội và phân phối lại định hướng Xã hội chủ nghĩa (XHCN) tại Việt Nam. Đây là dự án sáng tạo phục vụ cho môn học **Kinh tế chính trị Mác - Lênin (MLN122)** tại Đại học FPT.

Trò chơi hỗ trợ hơn 40 người chơi đồng thời trong cùng một phòng chơi real-time, được thiết kế theo mô hình tập trung tính toán ở server (Server-authoritative) để chống gian lận và nâng cao hiệu năng.

---

## 🚀 Các Tính Năng Cốt Lõi

1.  **Quản lý Phòng chơi thời gian thực (Socket.io)**: 
    *   Giảng viên / Admin tạo phòng chơi và nhận mã phòng 6 ký tự.
    *   Học sinh nhập tên và mã phòng để tham gia nhanh mà không cần đăng ký tài khoản.
    *   Hỗ trợ cơ chế tự động kết nối lại (Reconnection) để khôi phục trạng thái chơi khi gặp sự cố mạng.
2.  **Cơ chế Phân vai Kinh tế đa dạng**:
    *   Tự động phân bổ ngẫu nhiên 6 vai trò khi bắt đầu game: Doanh nghiệp Nhà nước (SOE), Doanh nghiệp Tư nhân (POE), Hợp tác xã (COOP), Hộ kinh doanh cá thể, Doanh nghiệp FDI và Người lao động (WORKER).
    *   Thiết lập số vốn ban đầu khác biệt phản ánh sự phân bố tư liệu sản xuất thực tế.
3.  **Lựa chọn Quyết định Kinh tế**:
    *   Mỗi vòng đấu (40 giây đếm ngược), người chơi chọn 1 trong 5 hành động: *Sản xuất/Làm việc*, *Đầu tư mở rộng*, *Tăng lương/Trợ cấp*, *Tối ưu chi phí* và *Đóng góp xã hội*.
    *   Hệ thống khóa lệnh và tự động tính toán kết quả ngay khi tất cả người chơi sẵn sàng.
4.  **Điều tiết Vĩ mô định hướng XHCN**:
    *   **Thuế lũy tiến**: Khấu trừ thuế trực tiếp từ lợi nhuận dương của doanh nghiệp đóng góp vào Quỹ ngân sách quốc gia.
    *   **Trợ cấp phúc lợi**: Tự động cứu vớt người chơi yếu thế (vốn < 50) bằng cách trích ngân sách hỗ trợ phục hồi sản xuất.
    *   **Đầu tư công**: Khi ngân sách quốc gia tích lũy đủ lớn (500+), hệ thống kích hoạt sự kiện đầu tư cơ sở hạ tầng, đem lại lợi ích chung (tăng hiệu suất sản xuất và điểm xã hội) cho toàn dân.
5.  **Bảng xếp hạng Phát triển Bền vững & Bài học Lý thuyết**:
    *   Tính tổng điểm cuối game dựa trên sự cân bằng giữa tiền tài chính và các điểm đóng góp (Lao động, Xã hội, Phúc lợi, Bền vững).
    *   Tổng kết mối liên hệ sâu sắc giữa các cơ chế trong game với nội dung kiến thức Chương 5 của học phần MLN122.

---

## 🛠️ Cấu Trúc Công Nghệ (Tech Stack)

*   **Repository**: NPM Workspaces Monorepo.
*   **Frontend**: ReactJS (React 18) + Vite + TypeScript + TailwindCSS + Lucide Icons.
*   **Backend**: NestJS (TypeScript) + `@nestjs/websockets` + Socket.io.
*   **Database**: PostgreSQL kết hợp Prisma ORM.
*   **Hosting**: Đóng gói chạy chung trên 1 Web Service của Render.com (hoặc Railway, Fly.io).

---

## 📁 Cấu Trúc Dự Án (Monorepo Directory)

```text
/
├── shared/              # Thư mục dùng chung (types, enums, events)
│   ├── src/index.ts     # Khai báo TypeScript types & Socket events dùng chung
│   └── package.json
├── backend/             # Dự án NestJS (API & WebSockets)
│   ├── src/             # Source code backend
│   ├── prisma/          # Cấu hình Prisma và Database migrations
│   └── package.json
├── frontend/            # Dự án React (Vite + TailwindCSS)
│   ├── src/             # Source code frontend
│   └── package.json
├── package.json         # Root package.json chứa npm workspaces
└── tsconfig.json        # Base tsconfig
```

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dưới Local

### 1. Cài đặt Dependencies
Từ thư mục gốc của dự án, chạy lệnh sau để tự động cài đặt tất cả dependencies cho các workspaces và liên kết gói shared:
```bash
npm install
```

### 2. Thiết lập Biến môi trường (Environment Variables)
Tạo file `.env` bên trong thư mục `/backend` dựa theo [backend/.env.example](file:///mnt/DATA/DATA/Github/mln122-game-ecorace/backend/.env.example):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecorace?schema=public"
JWT_SECRET="super-secret-key-change-in-production"
```

### 3. Cấu hình Database & Seed dữ liệu mẫu
Chạy lệnh sau để đồng bộ Prisma schema vào database và khởi tạo phòng chơi thử nghiệm `TEST01`:
```bash
npm run db:setup -w backend
```

### 4. Khởi chạy Chế độ Development
Để chạy đồng thời cả Frontend (Vite) và Backend (NestJS) ở local:
```bash
npm run dev
```
*   **Frontend Dev Server**: Mở trình duyệt tại `http://localhost:5173`. Các yêu cầu API và Socket.io sẽ tự động được proxy sang backend.
*   **Backend Server**: Chạy tại `http://localhost:3000`.

### 5. Kiểm thử (Unit Tests)
Chạy bộ unit test để kiểm tra tính chính xác của các công thức tính thuế lũy tiến, điểm số và phúc lợi:
```bash
npm run test -w backend
```

---

## 🌐 Hướng Dẫn Triển Khai lên Render.com (Miễn Phí)

Để đóng gói chạy chung trên **Render.com Free Web Service** mà không tốn chi phí và không cần nhập thẻ tín dụng:

1.  **Chuẩn bị Database**: Tạo một PostgreSQL database trên Neon.tech (Free Tier) để lấy kết nối `DATABASE_URL`.
2.  **Tạo Web Service trên Render**:
    *   Liên kết tài khoản Render với kho chứa GitHub này.
    *   **Runtime**: Chọn `Node`.
    *   **Build Command**: Cấu hình là `npm run build` (Lệnh này sẽ tự động build cả 3 package shared, frontend và backend, copy file frontend tĩnh vào `backend/dist`).
    *   **Start Command**: Cấu hình là `npm run start` (NestJS sẽ chạy bằng file build và phục vụ song song API, WebSockets và React App tĩnh).
    *   **Environment Variables**: Khai báo 2 biến `DATABASE_URL` và `JWT_SECRET` trên dashboard của Render.
