# Kế hoạch Triển khai (Implementation Plan) - Game "Đường Đua Kinh Tế Việt Nam"

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

- [x] 4. Thiết lập Socket.io Gateway trên Backend
  - [x] 4.1 Khởi tạo SocketGateway và tích hợp Socket.io vào NestJS
    - Cấu hình CORS và đăng ký các socket namespace/event listeners
    - _Requirements: 1.1, 6.1_
  - [x] 4.2 Viết logic xử lý kết nối, ngắt kết nối và tự động khôi phục trạng thái (Reconnection)
    - Cập nhật trạng thái `isOnline` và ánh xạ `socketId` mới khi người chơi reconnect
    - _Requirements: 1.1, 6.1_

- [x] 5. Phát triển Game Logic Service ở Backend
  - [x] 5.1 Viết logic khởi tạo game và gán vai trò kinh tế ngẫu nhiên
    - Gán vai trò FDI, SOE, POE, COOP, HOUSEHOLD, WORKER kèm vốn ban đầu tương ứng
    - _Requirements: 2.1, 2.2_
  - [x] 5.2 Triển khai logic tính toán kết quả hành động vòng chơi
    - Tính toán vốn, năng suất, điểm lao động, điểm xã hội cho 5 hành động
    - _Requirements: 3.1, 3.2_
  - [x] 5.3 Triển khai cơ chế điều tiết vĩ mô (Thuế lũy tiến, Trợ cấp và Đầu tư công)
    - Khấu trừ thuế, kích hoạt cứu trợ người yếu thế và sự kiện đầu tư công toàn dân
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 5.4 Viết các ca kiểm thử (Unit Tests) để xác thực các công thức tính toán
    - Kiểm thử progressive tax, welfare assistance trong game.service.spec.ts
    - _Requirements: 6.2_

- [x] 6. Tích hợp và Xử lý Lệnh trên Socket Gateway
  - [x] 6.1 Lắng nghe và xử lý sự kiện nộp quyết định `submit_action`
    - Lưu RoundAction và tự động kết toán vòng đấu khi tất cả người chơi sẵn sàng
    - _Requirements: 3.3_
  - [x] 6.2 Lắng nghe và xử lý sự kiện quản trị của Admin
    - Xử lý các sự kiện `admin_start_game` và `admin_next_round` từ admin được xác thực
    - _Requirements: 1.3, 1.4_
  - [x] 6.3 Đảm bảo đồng bộ thông tin vòng kết toán (`round_ended`) và kết thúc game (`game_ended`)
    - Đồng bộ kết quả biến động vốn, thuế và bảng xếp hạng chung cuộc khi kết thúc 5 vòng đấu
    - _Requirements: 5.1, 5.2_

- [x] 7. Thiết kế các Giao diện chính trên Frontend
  - [x] 7.1 Xây dựng màn hình Đăng nhập / Vào phòng (Welcome View)
    - Form nhập tên, mã phòng, hiển thị thông báo lỗi nếu có
    - _Requirements: 1.1, 1.2_
  - [x] 7.2 Xây dựng màn hình Phòng chờ (Lobby View)
    - Hiển thị danh sách người chơi thời gian thực và giao diện Admin điều khiển
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 7.3 Xây dựng màn hình Bàn chơi chính (Game Board View)
    - Hiển thị vai trò kinh tế, số vốn, 5 nút hành động, đếm ngược thời gian và bảng tin vĩ mô
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.3, 4.5_
  - [x] 7.4 Xây dựng màn hình Tổng kết và Lý thuyết MLN122 (Leaderboard & Review)
    - Hiển thị bảng xếp hạng, các danh hiệu và nội dung tổng kết lý thuyết Chương 5
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Cấu hình Build và Đóng gói phục vụ file tĩnh (Serving Assets)
  - [x] 8.1 Cấu hình ServeStaticModule ở backend trỏ vào frontend build folder
    - Cho phép NestJS serve trực tiếp file index.html và static assets từ frontend/dist
    - _Requirements: 6.4_
  - [x] 8.2 Định nghĩa các script khởi chạy đồng thời ở root package.json
    - Viết các command `dev`, `build`, `start` cho môi trường production của Render.com
    - _Requirements: 6.4_