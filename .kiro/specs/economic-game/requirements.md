# Tài liệu Yêu cầu Hệ thống (SRS Requirements) - Game "Đường Đua Kinh Tế Việt Nam"

## Introduction
Tài liệu này đặc tả các yêu cầu nghiệp vụ và kỹ thuật cho web game "Đường Đua Kinh Tế Việt Nam", một sản phẩm sáng tạo phục vụ cho môn học Kinh tế chính trị Mác - Lênin (MLN122) tại Đại học FPT. Trò chơi mô phỏng các hình thức sở hữu tư liệu sản xuất, các thành phần kinh tế, các hình thức phân phối và vai trò điều tiết vĩ mô của Nhà nước trong nền kinh tế thị trường định hướng xã hội chủ nghĩa tại Việt Nam.

Hệ thống được thiết kế để phục vụ khoảng 40 người chơi đồng thời trong một phòng chơi thời gian thực, với cơ chế tập trung tính toán hoàn toàn ở phía máy chủ (Server-authoritative) để đảm bảo tính minh bạch và chống gian lận.

---

## Yêu Cầu Chức Năng (Functional Requirements)

### Requirement 1: Tham gia phòng chơi và Quản trị
*   **User Story**: Là giảng viên hoặc người điều phối, tôi muốn tạo phòng chơi và kiểm soát tiến độ trò chơi để hướng dẫn học sinh tham gia học tập thực tế.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN người chơi nhập tên và mã phòng hợp lệ AND nhấn nút tham gia THEN hệ thống SHALL thêm người chơi vào phòng chờ và đồng bộ danh sách phòng qua Socket.io.
    2.  IF mã phòng không tồn tại trên hệ thống THEN hệ thống SHALL hiển thị thông báo lỗi "Mã phòng không hợp lệ".
    3.  IF tài khoản kết nối là Admin (Giảng viên) THEN hệ thống SHALL hiển thị các nút điều khiển "Bắt đầu game" và "Kích hoạt vòng tiếp theo".
    4.  WHEN Admin nhấn nút "Bắt đầu game" THEN hệ thống SHALL đóng phòng chờ, khóa danh sách người chơi và phân bổ vai trò ngẫu nhiên.
    5.  WHEN người chơi bị mất kết nối đột ngột THEN hệ thống SHALL lưu trạng thái và cho phép tự động kết nối lại (Reconnection) qua LocalStorage.

### Requirement 2: Phân bổ Vai trò Kinh tế
*   **User Story**: Là người chơi, tôi muốn nhận một vai trò kinh tế ngẫu nhiên phản ánh các thành phần kinh tế ở Việt Nam để trải nghiệm hành vi của thành phần đó.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN game bắt đầu THEN hệ thống SHALL phân bổ ngẫu nhiên các vai trò: Doanh nghiệp FDI, Doanh nghiệp Nhà nước (SOE), Doanh nghiệp Tư nhân (POE), Hợp tác xã (COOP), Hộ kinh doanh cá thể, và Người lao động (WORKER).
    2.  WHEN vai trò được gán THEN hệ thống SHALL phân bổ mức vốn ban đầu tương ứng: FDI (120 vốn), SOE (100 vốn), POE (90 vốn), COOP (80 vốn), Hộ cá thể (70 vốn), và Người lao động (50 vốn).

### Requirement 3: Quyết định Hành động Vòng chơi
*   **User Story**: Là người chơi, tôi muốn lựa chọn hành động kinh tế phù hợp với vai trò của mình trong từng vòng để tối ưu hóa vốn và đóng góp xã hội.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN bắt đầu vòng đấu THEN hệ thống SHALL kích hoạt đếm ngược 40 giây để người chơi chọn hành động.
    2.  WHEN người chơi chọn hành động THEN hệ thống SHALL khóa lựa chọn và gửi lệnh về server qua Socket.io.
    3.  WHEN tất cả người chơi online đã chọn hành động OR thời gian đếm ngược kết thúc THEN hệ thống SHALL tự động kết toán kết quả vòng đấu.
    4.  Hành động khả dụng gồm:
        *   *Sản xuất / Làm việc*: Tăng vốn trực tiếp (Người lao động nhận lương cố định, doanh nghiệp nhận doanh thu theo hiệu suất).
        *   *Đầu tư mở rộng*: Chi vốn để tăng vĩnh viễn hiệu suất sản xuất ở các vòng sau.
        *   *Tăng lương / Trợ cấp*: Chi vốn của chủ doanh nghiệp để cải thiện đời sống người lao động, nhận điểm đóng góp xã hội.
        *   *Tối ưu chi phí*: Cắt giảm phúc lợi hoặc môi trường để lấy lợi nhuận ngắn hạn tối đa, bị trừ điểm xã hội.
        *   *Đóng góp Quỹ xã hội*: Tự nguyện đóng góp vốn vào quỹ công ích để tăng điểm đóng góp xã hội.

### Requirement 4: Điều tiết Vĩ mô của Nhà nước
*   **User Story**: Là người chơi, tôi muốn hệ thống vận hành cơ chế thuế và ngân sách quốc gia để trải nghiệm sự điều tiết vĩ mô định hướng XHCN.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN kết toán vòng chơi THEN hệ thống SHALL tính thuế lũy tiến dựa trên lợi nhuận dương của người chơi:
        *   Người lao động: 2% nếu lợi nhuận > 15, ngược lại 0%.
        *   Hợp tác xã / Hộ cá thể: 5%.
        *   Doanh nghiệp tư nhân, Nhà nước, FDI: 20% nếu lợi nhuận > 20, ngược lại 10%.
    2.  WHEN người chơi nộp thuế THEN số tiền thuế SHALL được cộng vào Ngân sách Quốc gia (`macroBudget`), đồng thời người chơi nhận được điểm đóng góp xã hội.
    3.  IF một người chơi có số vốn sau vòng chơi dưới 50.0 AND Ngân sách Quốc gia còn đủ 20.0 THEN hệ thống SHALL tự động trích 20.0 từ ngân sách cứu trợ người chơi đó và cộng điểm phúc lợi.
    4.  WHEN Ngân sách Quốc gia đạt từ 500.0 trở lên THEN hệ thống SHALL trích 300.0 để thực hiện đầu tư công cơ sở hạ tầng, giúp tăng 10% năng suất sản xuất cho toàn dân.

### Requirement 5: Bảng xếp hạng và Tổng kết Lý thuyết
*   **User Story**: Là người học, tôi muốn xem bảng xếp hạng phát triển bền vững và lý thuyết Chương 5 để củng cố kiến thức chính trị kinh tế.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN trò chơi kết thúc THEN hệ thống SHALL tính điểm tổng kết (`totalScore`) bằng công thức kết hợp điểm vốn quy đổi, điểm lao động, điểm xã hội, điểm phúc lợi, điểm khuyến khích và điểm thưởng bền vững.
    2.  WHEN xếp hạng được đồng bộ THEN hệ thống SHALL hiển thị bảng điểm chi tiết và các danh hiệu đặc biệt (Vua Tài Chính, Nhà Đóng Góp Xã Hội, Nhà Phát Triển Bền Vững).
    3.  WHEN ở màn hình tổng kết THEN hệ thống SHALL hiển thị khối kiến thức đúc kết Chương 5 lý thuyết chính trị kinh tế MLN122.

---

## Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

### Requirement 6: Kỹ thuật và Vận hành
1.  **Hiệu năng**: Hệ thống phải duy trì độ trễ truyền tin qua WebSockets dưới 200ms khi phục vụ tối đa 50 người chơi đồng thời trong phòng.
2.  **Bảo mật**: Dữ liệu tài chính và điểm số phải được tính toán và kiểm soát hoàn toàn ở phía Server-side để ngăn chặn các thay đổi dữ liệu trái phép từ client-side. Các API admin phải được bảo vệ bằng JWT token.
3.  **Triển khai**: Toàn bộ dự án phải được đóng gói gọn gàng để triển khai chung trên 1 Web Service của Render.com chạy bằng môi trường Node.js.