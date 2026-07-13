# Kế hoạch Triển khai Nâng cấp (Kiro Spec & Plan V2) - Game "Đường Đua Kinh Tế Việt Nam"

Tài liệu này đặc tả các yêu cầu (SRS), thiết kế kỹ thuật và lộ trình tích hợp các tính năng nâng cấp nhằm tăng độ sâu chiến thuật, tính thực tiễn và liên kết lý thuyết Chương 5 môn Kinh tế chính trị Mác - Lênin (MLN122) cho trò chơi.

---

## 1. Yêu Cầu Chức Năng Bổ Sung (SRS V2 Requirements)

### Requirement 7: Thị Trường Chung Biến Động & Biểu Đồ Giá (USD, Oil, Gold)
*   **User Story**: Là người chơi, tôi muốn giá cả thị trường và giá các mặt hàng thiết yếu biến động theo cung cầu để tôi phân tích và quyết định hành động.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN bắt đầu vòng đấu THEN hệ thống SHALL khởi tạo giá thị trường chung `marketPrice = 100` và giá hàng hóa (USD: 25000, Oil: 80, Gold: 2400) với mức dao động ngẫu nhiên nhỏ (±2%).
    2.  WHEN kết toán mỗi vòng THEN hệ thống SHALL tính toán tổng cung dựa trên số lượng người chọn `PRODUCE` và `INVEST`, điều chỉnh `marketPrice` mới dựa trên công thức chênh lệch cung-cầu, giới hạn trong khoảng `[60, 150]`.
    3.  WHEN `marketPrice` thay đổi THEN lợi nhuận từ hành động `PRODUCE` của các doanh nghiệp SHALL được nhân với tỷ lệ `marketPrice / 100`.
    4.  WHEN vòng chơi diễn ra THEN hệ thống SHALL mô phỏng biến động giá thời gian thực (real-time live update) cho USD, Oil, Gold và hiển thị dưới dạng biểu đồ đường (như sàn Binance) ở góc màn hình.

### Requirement 8: Liên Doanh & Hợp Tác (Partnership)
*   **User Story**: Là người chơi, tôi muốn mời người chơi khác liên doanh góp vốn để cùng chia sẻ lợi nhuận và giảm thiểu rủi ro đầu tư.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN đang trong phase chọn hành động THEN người chơi SHALL có thể gửi lời mời liên doanh (`join_partnership`) tới một người chơi khác trong phòng.
    2.  WHEN người được mời chấp nhận lời mời trong vòng 10 giây THEN hệ thống SHALL khóa cặp liên doanh đó cho vòng hiện tại.
    3.  WHEN kết toán vòng đấu THEN vốn góp và lợi nhuận/thiệt hại của hành động chung của cặp liên doanh SHALL được chia theo tỷ lệ thỏa thuận (VD: 50/50 hoặc 60/40).
    4.  IF một bên rút lui đơn phương trước khi hết vòng THEN bên rút lui SHALL chịu phạt 10% vốn, và bên còn lại chịu toàn bộ rủi ro đầu tư.

### Requirement 9: Sự Kiện Kinh Tế Vĩ Mô Ngẫu Nhiên (Random Events)
*   **User Story**: Là giảng viên hoặc người chơi, tôi muốn các sự kiện kinh tế bất ngờ xảy ra để tăng tính thực tế và minh họa vai trò điều tiết của Nhà nước.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN bắt đầu vòng đấu thứ 3 hoặc mỗi 3-4 vòng sau đó THEN hệ thống SHALL chọn ngẫu nhiên một sự kiện vĩ mô (Khủng hoảng tài chính toàn cầu, Thiên tai/dịch bệnh, Chính sách ưu đãi COOP, Bùng nổ FDI) dựa trên trọng số được thiết lập.
    2.  WHEN sự kiện kích hoạt THEN hệ thống SHALL áp dụng ngay lập tức các hiệu ứng cộng/trừ vốn hoặc thay đổi lợi nhuận lên từng vai trò kinh tế cụ thể (FDI, SOE, POE, COOP, Household, Worker).
    3.  WHEN sự kiện kết thúc hoặc bắt đầu THEN hệ thống SHALL tự động hiển thị popup tóm tắt sự kiện trước đó và giới thiệu sự kiện tiếp theo (tự động đóng sau 10 giây).

### Requirement 10: Nhà Nước Dân Chủ & Bỏ Phiếu Chính Sách (Democratic Voting)
*   **User Story**: Là công dân trong nền kinh tế, tôi muốn bỏ phiếu quyết định chính sách thuế để tác động đến ngân sách quốc gia và phúc lợi xã hội.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN trò chơi đạt đến các mốc vòng chia hết cho 5 (VD: vòng 5, 10, 15) THEN hệ thống SHALL kích hoạt phase bỏ phiếu kéo dài 15-20 giây.
    2.  WHEN phase bỏ phiếu hoạt động THEN hệ thống SHALL hiển thị giao diện lựa chọn chính sách thuế:
        *   **Chính sách A (Tăng thuế lũy tiến)**: Thuế suất +10% cho các nhóm có lợi nhuận cao để tích lũy đầu tư công nhanh hơn.
        *   **Chính sách B (Giảm thuế kích thích)**: Thuế suất -10% để giữ lại lợi nhuận tái đầu tư cá nhân, trì hoãn đầu tư công.
    3.  WHEN thời gian bỏ phiếu kết thúc THEN hệ thống SHALL áp dụng chính sách chiến thắng dựa trên số đông và duy trì hiệu lực trong 5 vòng tiếp theo.

### Requirement 11: Trade-offs 5 Hành Động & Bài Học Lý Thuyết (Lesson Learned Takeaways)
*   **User Story**: Là người học, tôi muốn nhận được giải thích lý thuyết kinh tế chính trị sau mỗi quyết định hành động để hiểu rõ bản chất học thuật của hành vi đó.
*   **Tiêu chí nghiệm thu (EARS)**:
    1.  WHEN người chơi chọn một hành động THEN hệ thống SHALL áp dụng các trade-off tài chính và xã hội tương ứng (Sản xuất: an toàn/lợi nhuận thấp, Đầu tư: rủi ro cao/lợi nhuận dài hạn, Phúc lợi: chi phí ngắn hạn/tăng điểm xã hội, Tối ưu hóa: lợi nhuận ngắn hạn/trừ điểm xã hội, Đóng góp xã hội: mất vốn ngay/tăng điểm xã hội lớn).
    2.  WHEN kết toán vòng đấu THEN hệ thống SHALL hiển thị một Drawer hoặc Modal "Takeaway lý thuyết" cung cấp tóm tắt bài học kinh tế chính trị (kiến thức đúc kết Chương 5) liên quan trực tiếp đến hành động vừa chọn của người chơi đó.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu Bổ Sung (Design V2 Database Schema)

Dưới đây là các chỉnh sửa và bổ sung cho tệp `backend/prisma/schema.prisma`:

```prisma
// Thêm các trường mới vào Room
model Room {
  id               String          @id
  status           RoomStatus      @default(LOBBY)
  currentRound     Int             @default(1)
  maxRounds        Int             @default(5)
  roundDuration    Int             @default(40)
  warActive        Boolean         @default(false)
  macroBudget      Float           @default(0.0)
  marketPrice      Float           @default(100.0) // Giá thị trường chung hiện tại
  currentTaxPolicy String          @default("PROGRESSIVE") // PROGRESSIVE | STIMULUS
  activeEvent      String?         // Tên sự kiện ngẫu nhiên đang diễn ra
  createdAt        DateTime        @default(now())
  
  players          Player[]
  actions          RoundAction[]
  marketHistories  MarketHistory[]
  partnerships     Partnership[]
  policyVotes      PolicyVote[]
}

// Bảng lưu lịch sử giá thị trường và tài sản (USD, Oil, Gold)
model MarketHistory {
  id        String   @id @default(uuid())
  round     Int
  price     Float
  usd       Float
  oil       Float
  gold      Float
  createdAt DateTime @default(now())
  
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
}

// Bảng liên kết liên doanh giữa các người chơi trong từng vòng
model Partnership {
  id          String   @id @default(uuid())
  round       Int
  ratioA      Float    @default(0.5) // Tỷ lệ góp vốn của Player A
  ratioB      Float    @default(0.5) // Tỷ lệ góp vốn của Player B
  status      String   @default("PENDING") // PENDING | ACCEPTED | REJECTED | EXPIRED
  createdAt   DateTime @default(now())
  
  roomId      String
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  
  playerAId   String
  playerA     Player   @relation("PlayerA", fields: [playerAId], references: [id], onDelete: Cascade)
  playerBId   String
  playerB     Player   @relation("PlayerB", fields: [playerBId], references: [id], onDelete: Cascade)
}

// Bảng lưu phiếu bầu của người chơi cho chính sách vĩ mô
model PolicyVote {
  id        String   @id @default(uuid())
  round     Int
  choice    String   // PROGRESSIVE | STIMULUS
  createdAt DateTime @default(now())
  
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  
  playerId  String
  player    Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  @@unique([playerId, round])
}

// Thêm các quan hệ liên doanh & bầu cử vào Player
model Player {
  // ... các trường cũ giữ nguyên ...
  partnershipsA Partnership[] @relation("PlayerA")
  partnershipsB Partnership[] @relation("PlayerB")
  votes         PolicyVote[]
}
```

---

## 3. Danh Sách Nhiệm Vụ Chi Tiết (Implementation Roadmap)

### Phase 1: Database Migration & Shared Types Update
*   [ ] **Task 1.1**: Cập nhật file `backend/prisma/schema.prisma` với các model và fields mới.
*   [ ] **Task 1.2**: Chạy lệnh `npx prisma db push` hoặc tạo migration để cập nhật database PostgreSQL.
*   [ ] **Task 1.3**: Cập nhật `shared/src/index.ts` để xuất các Interfaces, Types và Enums mới phục vụ cho Partnership, PolicyVote, MarketHistory và EventType. Rebuild shared package.

### Phase 2: Backend Logic Core Updates
*   [ ] **Task 2.1**: Nâng cấp hàm `calculateRoundResult()` trong `backend/src/game/game.service.ts` để áp dụng trade-off mới cho 5 hành động và ảnh hưởng của `marketPrice`.
*   [ ] **Task 2.2**: Viết thuật toán cập nhật `marketPrice` dựa trên chênh lệch cung-cầu mỗi vòng và lưu trữ lịch sử vào bảng `MarketHistory`.
*   [ ] **Task 2.3**: Triển khai hệ thống Sự kiện ngẫu nhiên (Random Events): định nghĩa danh sách sự kiện và hàm áp dụng hiệu ứng lên vốn/thu nhập của từng vai trò.
*   [ ] **Task 2.4**: Triển khai logic xử lý Liên doanh (Partnership): tạo/chấp nhận lời mời và phân chia lợi nhuận vòng chơi theo tỷ lệ đóng góp vốn.
*   [ ] **Task 2.5**: Triển khai logic Bỏ phiếu chính sách vĩ mô (Policy Voting): mở/kết thúc phase bỏ phiếu và áp dụng thuế suất mới cho các vòng tiếp theo.

### Phase 3: Gateway & Socket.io Event Handling
*   [ ] **Task 3.1**: Đăng ký các Socket listeners mới trong `backend/src/game/game.gateway.ts`:
    *   `send_partnership_invite`, `respond_partnership_invite`
    *   `submit_policy_vote`
*   [ ] **Task 3.2**: Thêm các Socket emitters đồng bộ dữ liệu thời gian thực:
    *   `market_price_updated` (đồng bộ USD, Oil, Gold và MarketPrice)
    *   `macro_event_triggered` (hiển thị popup thông tin sự kiện)
    *   `voting_phase_started`, `voting_phase_ended`

### Phase 4: Frontend UI Components Development
*   [ ] **Task 4.1**: Phát triển widget Biểu đồ Live Market (USD, Oil, Gold) góc màn hình sử dụng thư viện biểu đồ nhẹ (như `recharts` hoặc SVG thuần) mô phỏng Binance.
*   [ ] **Task 4.2**: Xây dựng Modal popup sự kiện ngẫu nhiên, tự động hiển thị mô tả, lịch sử và đếm ngược tự đóng sau 10 giây.
*   [ ] **Task 4.3**: Thiết kế Giao diện liên kết Liên doanh trong action panel (cho phép chọn đối tác, điền tỷ lệ và gửi/nhận lời mời).
*   [ ] **Task 4.4**: Tạo Overlay đếm ngược Bỏ phiếu Chính sách vĩ mô xuất hiện mỗi 5 vòng chơi.
*   [ ] **Task 4.5**: Thêm Drawer/Modal "Takeaway bài học kinh tế" hiển thị đúc kết lý thuyết Chương 5 tương ứng với hành động người chơi đã chọn ngay sau khi kết thúc vòng đấu.

### Phase 5: Verification & Integration Testing
*   [ ] **Task 5.1**: Viết các ca kiểm thử tự động (Unit Tests) cho các công thức tính toán cung-cầu, phân chia lợi nhuận liên doanh và áp dụng sự kiện ngẫu nhiên.
*   [ ] **Task 5.2**: Test luồng chơi giả lập trên localhost để đảm bảo đồng bộ socket hoạt động ổn định trước khi deploy lên Render.com.
