"# Tài liệu Thiết kế Kỹ thuật (Technical Design) - Game "Đường Đua Kinh Tế Việt Nam"

## 1. Overview (Tổng quan)
Tài liệu này mô tả thiết kế kỹ thuật cho web game "Đường Đua Kinh Tế Việt Nam". Game được xây dựng theo cấu trúc Monorepo sử dụng npm workspaces, tích hợp Backend (NestJS) và Frontend (ReactJS + Vite) trong cùng một gói triển khai để deploy lên Render.com Free Web Service. 

Trạng thái thời gian thực được đồng bộ qua WebSockets (Socket.io) phục vụ tối đa 50 người chơi đồng thời trên một phòng chơi. Mọi tính toán logic cốt lõi đều được thực hiện ở server-side để chống gian lận.

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
    1.  Vite build dự án frontend thành các file tĩnh nằm trong `/
<truncated 6786 bytes>