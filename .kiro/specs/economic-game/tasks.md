"# Kế hoạch Triển khai (Implementation Plan) - Game "Đường Đua Kinh Tế Việt Nam"

- [x] 1. Khởi tạo cấu trúc dự án và Shared Library
  - [x] 1.1 Khởi tạo root package.json cấu hình `npm workspaces` và base tsconfig
    - Định nghĩa các workspaces: `backend`, `frontend`, `shared`
    - _Requirements: 6.4_
  - [x] 1.2 Định nghĩa các Enums, Interfaces và Socket Events trong workspace `shared`
    - Viết các kiểu dữ liệu cho Player, Room, ActionType, SocketEvents
    - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [x] 2. Cấu hình Database và Prisma ORM ở Backend
  - [x] 2.1 Cài đặt Prisma trong project `backend` và định nghĩa cơ sở dữ liệu
    - Tạo file schema.prisma chứa các models Room, Player, RoundAction
    - _Requirements: 6.2_
  - [x] 2.2 Viết script khởi tạo cơ sở dữ liệu (migration và seed data)
    - Tạo các script để tự động chạy migrate và seed phòng chơi test
    - _Requirements: 6.2_

- [x] 3. Xây dựng dịch vụ quản lý Phòng chơi và Xác thực
  - [x] 3.1 Triển khai RoomService và RoomController trong NestJS
    - Viết logic tạo phòng (sinh mã ngẫu nhiên), tham gia phòng và xác thực mã phòng
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Triển khai Admin JWT authentication và guards
    - Viết middleware/guard kiểm tra token admin đối với các yêu cầu nhạy cảm
    - _Requirements: 1.3, 1.5, 6.3_

- [/] 4. Thiết lập Socket.io Gateway trên Backend
  - [/] 4.1 Khởi tạo SocketGateway và tích hợp Socket.io vào NestJS
    - Cấu hình CORS và đăng ký các socket namespace/event listeners
    - _Requirements: 1.1, 6.1_
  - [ ] 4.2 Viết logic xử lý kết nối, ngắt kết nối và tự động khôi phục trạng thái (Reconnection)
    - Cập nhật trạng thái `isOnline` và ánh xạ `socketId` mới khi người chơi reconnect
    - _Requirements: 1.1, 6.1_

- [ ] 5. Phát triển Game Logic
<truncated 3183 bytes>