"# Tài liệu Yêu cầu Hệ thống (SRS Requirements) - Game "Đường Đua Kinh Tế Việt Nam"

## Introduction
Tài liệu này đặc tả các yêu cầu nghiệp vụ và kỹ thuật cho web game "Đường Đua Kinh Tế Việt Nam", một sản phẩm sáng tạo phục vụ cho môn học Kinh tế chính trị Mác - Lênin (MLN122) tại Đại học FPT. Trò chơi mô phỏng các hình thức sở hữu tư liệu sản xuất, các thành phần kinh tế, các hình thức phân phối và vai trò điều tiết vĩ mô của Nhà nước trong nền kinh tế thị trường định hướng xã hội chủ nghĩa tại Việt Nam.

Hệ thống được thiết kế để phục vụ khoảng 40 người chơi đồng thời trong một phòng chơi thời gian thực, với cơ chế tập trung tính toán hoàn toàn ở phía máy chủ (Server-authoritative) để đảm bảo tính minh bạch và chống gian lận.

## Requirements

### Requirement 1: Tham gia phòng chơi và Quản trị
**User Story:** Là người chơi và người quản trị, tôi muốn tham gia phòng chơi và kiểm soát quá trình khởi đầu/chuyển vòng, để trận đấu diễn ra đồng bộ và đúng tiến độ.

#### Acceptance Criteria
1. WHEN người chơi nhập tên và mã phòng hợp lệ AND nhấn nút tham gia THEN hệ thống SHALL thêm người chơi vào phòng chờ và đồng bộ danh sách phòng qua Socket.io.
2. IF mã phòng không tồn tại trên hệ thống THEN hệ thống SHALL hiển thị thông báo lỗi "Mã phòng không hợp lệ".
3. IF tài khoản kết nối là Admin THEN hệ thống SHALL hiển thị các nút điều khiển "Bắt đầu game" và "Kích hoạt vòng tiếp theo".
4. WHEN Admin nhấn nút "Bắt đầu game" THEN hệ thống SHALL đóng phòng chờ, khóa danh sách người chơi và tiến hành phân bổ vai trò ngẫu nhiên.
5. WHEN một tài khoản không phải Admin gửi 
<truncated 7846 bytes>