# Tài liệu Thiết kế Kỹ thuật (Technical Design) - Game "Đường Đua Kinh Tế Việt Nam"

## 1. Overview (Tổng quan)
Tài liệu này mô tả thiết kế kỹ thuật cho web game "Đường Đua Kinh Tế Việt Nam". Game được xây dựng theo cấu trúc Monorepo sử dụng npm workspaces, tích hợp Backend (NestJS) và Frontend (ReactJS + Vite) trong cùng một gói triển khai để deploy lên Render.com Free Web Service. 

Trạng thái thời gian thực được đồng bộ qua WebSockets (Socket.io) phục vụ tối đa 50 người chơi đồng thời trên một phòng chơi. Mọi tính toán logic cốt lõi đều được thực hiện ở server-side để chống gian lận.

---

## 2. Architecture (Kiến trúc hệ thống)

### 2.1 Sơ đồ khối tổng thể (System Architecture)
```mermaid
graph TD
    subgraph Client-Side (ReactJS SPA)
        Vite[Vite Dev/Build tool]
        React[React UI Components]
        SocketClient[Socket.io-client]
    end

    subgraph Server-Side (NestJS Application)
        ServeStatic[Serve Static Module]
        SocketGateway[Socket.io Gateway]
        GameService[Game Logic Service]
        AdminGuard[JWT Admin Guard]
        PrismaORM[Prisma ORM]
    end

    subgraph Persistence Layer
        PostgreSQL[(PostgreSQL DB)]
    end

    React -->|UI Interactions| SocketClient
    SocketClient <-->|Socket.io events| SocketGateway
    ServeStatic -->|Serves static files| React
    SocketGateway -->|Invokes| GameService
    GameService -->|JWT Verification| AdminGuard
    GameService -->|Reads/Writes| PrismaORM
    PrismaORM -->|SQL Queries| PostgreSQL
```

### 2.2 Kiến trúc Monorepo & Quy trình phục vụ file tĩnh (Serving Assets)
*   **Monorepo**: Cấu hình `npm workspaces` phân tách code thành 3 module chính: `/frontend`, `/backend`, và `/shared`.
*   **Static Serving**: Khi build trên Render.com:
    1.  Vite build dự án frontend thành các file tĩnh nằm trong `/frontend/dist`.
    2.  NestJS build compile mã TypeScript thành JavaScript trong `/backend/dist`.
    3.  `ServeStaticModule` trong NestJS được cấu hình trỏ thẳng vào thư mục `/frontend/dist` để phục vụ trực tiếp các file tĩnh (`index.html`, JavaScript, CSS) từ cổng chạy backend chính.

---

## 3. Database Schema Design (Prisma PostgreSQL)

Dưới đây là schema thiết kế cơ sở dữ liệu định nghĩa trong tệp `schema.prisma`:

```prisma
enum RoomStatus {
  LOBBY
  PLAYING
  FINISHED
}

enum EconomicRole {
  FDI
  SOE
  POE
  COOP
  HOUSEHOLD
  WORKER
}

enum ActionType {
  PRODUCE
  INVEST
  WELFARE
  OPTIMIZE
  SOCIAL
}

model Room {
  id           String        @id @db.VarChar(6) // Mã phòng 6 ký tự viết hoa
  status       RoomStatus    @default(LOBBY)
  currentRound Int           @default(1)
  maxRounds    Int           @default(5)
  macroBudget  Float         @default(0.0)
  createdAt    DateTime      @default(now())
  players      Player[]
  actions      RoundAction[]
}

model Player {
  id                  String        @id @default(uuid())
  username            String        @db.VarChar(50)
  socketId            String        @unique @db.VarChar(100)
  isAdmin             Boolean       @default(false)
  role                EconomicRole?
  capital             Float         @default(50.0)
  capitalMultiplier   Float         @default(1.0)
  laborScore          Float         @default(0.0)
  socialScore         Float         @default(0.0)
  welfareScore        Float         @default(0.0)
  sustainabilityScore Float         @default(0.0)
  totalScore          Float         @default(0.0)
  isOnline            Boolean       @default(true)
  roomId              String
  room                Room          @relation(fields: [roomId], references: [id], onDelete: Cascade)
  actions             RoundAction[]

  @@unique([username, roomId]) // Đảm bảo tên người chơi là duy nhất trong cùng một phòng
}

model RoundAction {
  id         String     @id @default(uuid())
  round      Int
  actionType ActionType
  playerId   String
  player     Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)
  roomId     String
  room       Room       @relation(fields: [roomId], references: [id], onDelete: Cascade)
  createdAt  DateTime   @default(now())

  @@unique([playerId, round]) // Mỗi người chơi chỉ được chọn một hành động duy nhất trong mỗi vòng
}
```

---

## 4. Socket.io Event Specification (Real-time Sync)

Các sự kiện Socket.io trao đổi giữa Client và Server được định nghĩa rõ ràng:

### 4.1 Client-to-Server (Emit Events)
*   `join_room(data: { roomId: string, username: string, playerId?: string }, callback: (res: SocketResponse) => void)`
    *   Yêu cầu tham gia phòng chơi hoặc thực hiện reconnect khôi phục trạng thái.
*   `admin_start_game(data: { roomId: string }, callback: (res: SocketResponse) => void)`
    *   Admin yêu cầu khởi chạy trò chơi, gán vai trò ngẫu nhiên và phân bổ vốn ban đầu.
*   `submit_action(data: { roomId: string, actionType: ActionType }, callback: (res: SocketResponse) => void)`
    *   Người chơi gửi quyết định hành động trong vòng chơi hiện tại.
*   `admin_next_round(data: { roomId: string }, callback: (res: SocketResponse) => void)`
    *   Admin yêu cầu bỏ qua đếm ngược và kết toán vòng chơi lập tức.

### 4.2 Server-to-Client (Broadcast Events)
*   `room_updated(data: { roomId: string, players: Player[] })`
    *   Đồng bộ danh sách người chơi trong phòng chờ khi có người chơi mới vào hoặc ngắt kết nối.
*   `game_started(data: { roomId: string, players: Player[], duration: number })`
    *   Thông báo trò chơi đã bắt đầu và đồng bộ danh sách người chơi kèm vai trò được gán.
*   `round_started(data: { round: number, duration: number, macroBudget: number })`
    *   Thông báo bắt đầu vòng mới, đồng bộ số vòng chơi hiện tại và ngân sách quốc gia.
*   `action_submitted(data: { playerId: string })`
    *   Thông báo có người chơi vừa nộp lệnh để cập nhật trạng thái hiển thị của các người chơi khác.
*   `round_ended(data: { round: number, results: Record<string, RoundCalculationResult>, players: Player[], macroBudget: number, macroEventTriggered?: string })`
    *   Broadcast kết quả tính toán chi tiết của vòng đấu (vốn thay đổi, tiền thuế nộp, trợ cấp nhận được, sự kiện đầu tư công).
*   `game_ended(data: { leaderboard: Player[] })`
    *   Thông báo kết thúc game và đồng bộ bảng điểm xếp hạng bền vững chung cuộc.

---

## 5. REST API Endpoints

*   `POST /api/room/create`
    *   **Body**: `{ adminUsername: string }`
    *   **Response**: `{ room: Room, token: string, adminPlayer: Player }`
    *   **Mô tả**: Tạo một phòng chơi mới với mã phòng ngẫu nhiên và trả về token quản trị (Admin JWT).
*   `GET /api/room/validate/:roomId`
    *   **Response**: `{ exists: boolean, status?: RoomStatus }`
    *   **Mô tả**: Kiểm tra mã phòng chơi có tồn tại và hợp lệ để cho phép người chơi kết nối qua socket.