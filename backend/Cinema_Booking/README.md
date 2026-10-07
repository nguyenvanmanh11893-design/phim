# 🎬 CineBooking API

REST API cho hệ thống đặt vé xem phim, xây dựng theo kiến trúc **Domain-Driven Design (DDD)** với Node.js, Express và MySQL.

---

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Tech Stack](#tech-stack)
- [Cài đặt](#cài-đặt)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Chạy dự án](#chạy-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API Reference](#api-reference)
- [Luồng nghiệp vụ chính](#luồng-nghiệp-vụ-chính)
- [Database Schema](#database-schema)
- [Các quyết định thiết kế](#các-quyết-định-thiết-kế)

---

## Tổng quan

CineBooking API cung cấp đầy đủ backend cho ứng dụng đặt vé rạp chiếu phim, bao gồm:

- Quản lý phim, rạp, phòng chiếu, ghế ngồi
- Quản lý lịch chiếu (showtime) với kiểm tra conflict và cập nhật thông tin
- Đặt vé, giữ ghế tạm thời (10 phút), xác nhận thanh toán
- Payment session với mock checkout và chuẩn bị tích hợp VNPay/Momo
- Phát hành vé điện tử (QR Code) tự động sau khi thanh toán thành công
- Gửi email xác nhận đặt vé qua SMTP (Nodemailer)
- Upload ảnh lên Cloudinary
- Xác thực người dùng với JWT + Refresh Token
- Phân quyền admin / user
- Quản lý hồ sơ người dùng (profile, đổi mật khẩu, phân quyền)
- Báo cáo doanh thu (tổng quan, theo thời gian, theo phim, theo rạp)
- Đánh giá phim (ratings & reviews) — chỉ dành cho user đã xem
- Rate limiting toàn cục và cho auth endpoints

---

## Kiến trúc

Dự án theo **Domain-Driven Design** với 3 tầng tách biệt hoàn toàn:

```
Domain → Application → Infrastructure
```

- **Domain**: Entity, Value Object, Repository Interface — không phụ thuộc bất kỳ framework nào
- **Application**: Command/Query handlers (CQRS-style) — chứa toàn bộ logic nghiệp vụ
- **Infrastructure**: MySQL repositories, Express controllers, routes, middlewares

Dependency injection được quản lý tập trung qua `container.js`, theo thứ tự khởi tạo: **Repository → Handler → Controller**.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js |
| Database | MySQL 8+ |
| ORM/Driver | mysql2/promise |
| Auth | JWT + bcrypt |
| File Upload | Cloudinary + multer-storage-cloudinary |
| Email | Nodemailer (SMTP) |
| Rate Limiting | express-rate-limit |
| Validation | Tự implement qua Command/Entity |

---

## Cài đặt

```bash
# Clone repo
git clone <repo-url>
cd cinebooking-api

# Cài dependencies
npm install

# Tạo database
mysql -u root -p < schema.sql
```

---

## Cấu hình môi trường

Tạo file `.env` ở root:

```env
PORT=3000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=cinebooking

JWT_SECRET=your_super_secret_key_here

NODE_ENV=development

# Cloudinary (cần cho upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP (cần cho gửi email xác nhận)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## Chạy dự án

```bash
# Development (với nodemon)
npm run dev

# Production
npm start
```

Server sẽ chạy tại `http://localhost:3000`. Kiểm tra bằng:

```bash
GET /health
# → { "message": "OK" }
```

---

## Cấu trúc thư mục

```
src/
├── app.js
├── server.js
│
├── Domain/                         # Tầng Domain — không phụ thuộc gì
│   ├── Errors/
│   │   └── AppError.js
│   ├── Services/
│   │   └── EmailServiceInterface.js
│   ├── User/
│   │   ├── Entity/
│   │   │   ├── User.js
│   │   │   └── RefreshToken.js
│   │   ├── ValueObject/
│   │   │   └── Email.js
│   │   └── Repository/
│   │       ├── UserRepositoryInterface.js
│   │       └── RefreshTokenRepositoryInterface.js
│   ├── Movie/
│   │   ├── Entity/Movie.js
│   │   └── Repository/MovieRepositoryInterface.js
│   ├── Cinema/                     # Cinema, Room, Seat
│   │   ├── Entity/
│   │   │   ├── Cinema.js
│   │   │   ├── Room.js
│   │   │   └── Seat.js
│   │   └── Repository/
│   │       ├── CinemaRepositoryInterface.js
│   │       ├── RoomRepositoryInterface.js
│   │       └── SeatRepositoryInterface.js
│   ├── Showtime/
│   │   ├── Entity/Showtime.js
│   │   └── Repository/ShowtimeRepositoryInterface.js
│   ├── Booking/
│   │   ├── Entity/
│   │   │   ├── Booking.js
│   │   │   ├── BookingSeat.js
│   │   │   └── BookingCombo.js
│   │   └── Repository/BookingRepositoryInterface.js
│   ├── Payment/
│   │   ├── Entity/Payment.js
│   │   └── Repository/PaymentRepositoryInterface.js
│   ├── Ticket/
│   │   ├── Entity/Ticket.js
│   │   └── Repository/TicketRepositoryInterface.js
│   ├── Rating/
│   │   ├── Entity/Rating.js
│   │   └── Repository/RatingRepositoryInterface.js
│   ├── Combo/
│   │   ├── Entity/Combo.js
│   │   └── Repository/ComboRepositoryInterface.js
│   └── Report/
│       └── Repository/ReportRepositoryInterface.js
│
├── Application/                    # Tầng Application — logic nghiệp vụ
│   ├── Auth/
│   │   ├── Command/                # RegisterCommand, LoginCommand, LogoutCommand, RefreshTokenCommand
│   │   └── Handler/                # RegisterHandler, LoginHandler, LogoutHandler, RefreshTokenHandler
│   ├── Movie/
│   │   ├── Command/                # CreateMovieCommand, UpdateMovieCommand, DeleteMovieCommand
│   │   ├── Query/                  # GetMovieQuery, ListMoviesQuery, ListHotMoviesQuery
│   │   └── Handler/
│   ├── Cinema/
│   │   ├── Command/                # CreateCinemaCommand, UpdateCinemaCommand, DeleteCinemaCommand
│   │   │                           # CreateRoomCommand, UpdateRoomCommand, DeleteRoomCommand
│   │   │                           # UpdateSeatCommand
│   │   ├── Query/                  # GetCinemaQuery, ListCinemasQuery, GetRoomQuery, ListRoomsQuery
│   │   │                           # GetSeatMapQuery
│   │   └── Handler/
│   ├── Showtime/
│   │   ├── Command/                # CreateShowtimeCommand, UpdateShowtimeCommand, CancelShowtimeCommand
│   │   ├── Query/                  # GetShowtimeQuery, ListShowtimesQuery
│   │   └── Handler/                # CreateShowtimeHandler, UpdateShowtimeHandler, CancelShowtimeHandler
│   │                               # GetShowtimeHandler, ListShowtimesHandler
│   ├── Booking/
│   │   ├── Command/                # CreateBookingCommand, ConfirmBookingCommand, CancelBookingCommand
│   │   ├── Query/                  # GetBookingQuery, ListBookingsQuery, ListAllBookingsQuery
│   │   │                           # GetSeatMapForShowtimeQuery
│   │   └── Handler/
│   ├── Payment/
│   │   ├── Command/                # InitiatePaymentCommand, ConfirmPaymentCommand, FailPaymentCommand
│   │   ├── Query/                  # GetPaymentQuery
│   │   └── Handler/                # InitiatePaymentHandler, ConfirmPaymentHandler, FailPaymentHandler
│   │                               # GetPaymentHandler
│   ├── Ticket/
│   │   ├── Command/                # IssueTicketCommand
│   │   ├── Query/                  # GetTicketQuery
│   │   └── Handler/                # IssueTicketHandler, GetTicketHandler
│   ├── Rating/
│   │   ├── Command/                # CreateRatingCommand
│   │   ├── Query/                  # GetMovieRatingsQuery
│   │   └── Handler/                # CreateRatingHandler, GetMovieRatingsHandler
│   ├── Combo/
│   │   ├── Command/                # CreateComboCommand, UpdateComboCommand, DeleteComboCommand
│   │   ├── Query/                  # GetComboQuery, ListCombosQuery
│   │   └── Handler/                # CreateComboHandler, UpdateComboHandler, DeleteComboHandler
│   │                               # GetComboHandler, ListCombosHandler
│   ├── User/
│   │   ├── Command/                # UpdateProfileCommand, ChangePasswordCommand, UpdateUserRoleCommand
│   │   ├── Query/                  # GetProfileQuery, ListUsersQuery
│   │   └── Handler/                # GetProfileHandler, UpdateProfileHandler, ChangePasswordHandler
│   │                               # ListUsersHandler, UpdateUserRoleHandler
│   └── Report/
│       ├── Query/                  # GetDashboardOverviewQuery, GetRevenueByTimeQuery
│       │                           # GetRevenueByMovieQuery, GetRevenueByCinemaQuery
│       └── Handler/                # GetDashboardOverviewHandler, GetRevenueByTimeHandler
│                                   # GetRevenueByMovieHandler, GetRevenueByCinemaHandler
│
└── Infrastructure/                 # Tầng Infrastructure — kết nối ra ngoài
    ├── Config/
    │   ├── database.js
    │   ├── env.js
    │   ├── cloudinary.js
    │   └── container.js            # Dependency injection
    └── Http/
        ├── Controllers/
        │   ├── AuthController.js
        │   ├── MovieController.js
        │   ├── CinemaController.js
        │   ├── RoomController.js
        │   ├── SeatController.js
        │   ├── ShowtimeController.js
        │   ├── BookingController.js
        │   ├── PaymentController.js
        │   ├── TicketController.js
        │   ├── RatingController.js
        │   ├── ComboController.js
        │   ├── UserController.js
        │   ├── ReportController.js
        │   └── UploadController.js
        ├── Middlewares/
        │   ├── authMiddleware.js
        │   ├── roleMiddleware.js
        │   ├── errorMiddleware.js
        │   └── rateLimitMiddleware.js
        ├── Repositories/
        │   ├── MySQLUserRepository.js
        │   ├── MySQLRefreshTokenRepository.js
        │   ├── MySQLMovieRepository.js
        │   ├── MySQLCinemaRepository.js
        │   ├── MySQLRoomRepository.js
        │   ├── MySQLSeatRepository.js
        │   ├── MySQLShowtimeRepository.js
        │   ├── MySQLBookingRepository.js
        │   ├── MySQLPaymentRepository.js
        │   ├── MySQLTicketRepository.js
        │   ├── MySQLRatingRepository.js
        │   ├── MySQLComboRepository.js
        │   └── MySQLReportRepository.js
        ├── Services/
        │   └── NodemailerService.js
        └── Routes/
            ├── authRoutes.js
            ├── movieRoutes.js      # Kèm nested: /movies/:movieId/ratings
            ├── cinemaRoutes.js
            ├── roomRoutes.js
            ├── seatRoutes.js
            ├── showtimeRoutes.js
            ├── bookingRoutes.js
            ├── paymentRoutes.js
            ├── ticketRoutes.js
            ├── ratingRoutes.js
            ├── comboRoutes.js
            ├── userRoutes.js
            ├── reportRoutes.js
            └── uploadRoutes.js
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/auth/signUp` | — | Đăng ký tài khoản |
| POST | `/auth/signIn` | — | Đăng nhập, nhận JWT + refresh token |
| POST | `/auth/signOut` | ✅ | Đăng xuất (xóa refresh token) |
| POST | `/auth/refresh-token` | — | Làm mới access token |

> Các endpoint `/signUp` và `/signIn` được bảo vệ bởi rate limit: tối đa **10 lần / phút**.

**Request body — signIn:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response — signIn:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refreshToken": "abc123...",
    "user": { "id": 1, "name": "Nam", "email": "user@example.com", "role": "user" }
  }
}
```

---

### Movies

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/movies` | — | Danh sách phim (filter: `genre`, `status`, `page`, `limit`) |
| GET | `/movies/hot` | — | Top phim hot (tính theo lượt đặt vé 1–7 ngày gần nhất) |
| GET | `/movies/:id` | — | Chi tiết phim |
| POST | `/movies` | 🔐 Admin | Thêm phim mới |
| PATCH | `/movies/:id` | 🔐 Admin | Cập nhật phim (partial update) |
| DELETE | `/movies/:id` | 🔐 Admin | Xóa phim |

**Filter ví dụ:**
```
GET /movies?status=now_showing&genre=Hành+động&page=1&limit=10
```

**Status phim** (tính động từ `releaseDate`/`endDate`, không lưu DB):
- `coming_soon` — chưa đến ngày chiếu
- `now_showing` — đang chiếu
- `ended` — đã kết thúc

---

### Ratings (Đánh giá phim)

Ratings được mount dưới dạng nested route của movies: `/movies/:movieId/ratings`.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/movies/:movieId/ratings` | — | Danh sách đánh giá của phim (kèm stats) |
| POST | `/movies/:movieId/ratings` | ✅ | Gửi đánh giá (chỉ user đã xem phim) |

**Request body — tạo đánh giá:**
```json
{
  "score": 5,
  "review": "Phim hay, diễn xuất tốt, hiệu ứng hình ảnh đẹp mắt."
}
```

`score` là số nguyên từ **1 đến 5** (tương ứng 1-5 sao theo validation server). `review` là tùy chọn, tối đa 1000 ký tự.

**Response — danh sách đánh giá:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 3,
      "userName": "Nguyễn Văn A",
      "userAvatar": null,
      "movieId": 1,
      "score": 8,
      "review": "Phim hay!",
      "createdAt": "2025-12-25T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "averageScore": 7.8,
    "totalRatings": 42
  }
}
```

**Quy tắc nghiệp vụ quan trọng:**
- Mỗi user chỉ được đánh giá **1 lần** mỗi phim — gửi lần 2 trả về `409 Conflict`
- Chỉ được đánh giá nếu có ít nhất 1 booking **CONFIRMED** cho showtime thuộc phim đó — gửi khi chưa xem trả về `403 Forbidden`
- `averageScore` và `totalRatings` được tính trực tiếp từ DB bằng `AVG()` và `COUNT()`, làm tròn 1 chữ số thập phân

---

### Cinemas & Rooms

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/cinemas` | — | Danh sách rạp (filter: `city`) |
| GET | `/cinemas/:id` | — | Chi tiết rạp |
| POST | `/cinemas` | 🔐 Admin | Thêm rạp |
| PATCH | `/cinemas/:id` | 🔐 Admin | Cập nhật rạp |
| DELETE | `/cinemas/:id` | 🔐 Admin | Xóa rạp |
| GET | `/cinemas/:cinemaId/rooms` | — | Danh sách phòng của rạp |
| POST | `/cinemas/:cinemaId/rooms` | 🔐 Admin | Tạo phòng (tự sinh ghế theo grid) |
| GET | `/rooms/:id` | — | Chi tiết phòng |
| PATCH | `/rooms/:id` | 🔐 Admin | Cập nhật phòng |
| DELETE | `/rooms/:id` | 🔐 Admin | Xóa phòng |
| GET | `/rooms/:roomId/seats` | — | Sơ đồ ghế của phòng |
| PATCH | `/seats/:id` | 🔐 Admin | Cập nhật ghế (type, isActive) |

> Khi tạo phòng với `totalRows` và `seatsPerRow`, hệ thống tự động sinh toàn bộ ghế theo grid A1→ZN. Khi thay đổi kích thước phòng, ghế cũ bị xóa và sinh lại trong transaction.

---

### Showtimes

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/showtimes` | — | Danh sách suất chiếu (filter: `movieId`, `cinemaId`, `date`, `status`) |
| GET | `/showtimes/:id` | — | Chi tiết suất chiếu (kèm movie, room, cinema) |
| POST | `/showtimes` | 🔐 Admin | Tạo suất chiếu mới |
| PATCH | `/showtimes/:id` | 🔐 Admin | Cập nhật suất chiếu (roomId, startTime, giá vé) |
| PATCH | `/showtimes/:id/cancel` | 🔐 Admin | Hủy suất chiếu |

**Request body — tạo suất chiếu:**
```json
{
  "movieId": 1,
  "roomId": 2,
  "startTime": "2025-12-25T19:00:00.000Z",
  "basePrice": 90000,
  "vipPrice": 120000,
  "couplePrice": 200000
}
```

> `endTime` được tính tự động: `startTime + movie.duration + 15 phút buffer`. Client không truyền `endTime`.

**Cập nhật suất chiếu** chỉ được phép khi suất chiếu **chưa có bất kỳ vé nào được đặt** (PENDING hoặc CONFIRMED). Nếu đã có vé, API trả về lỗi `409 Conflict`.

**Status suất chiếu** (tính động):
- `SCHEDULED` — chưa bắt đầu
- `ONGOING` — đang chiếu
- `ENDED` — đã kết thúc
- `CANCELLED` — đã hủy

---

### Combos (Bắp nước)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/combos` | — | Danh sách combo (filter: `isActive`) |
| GET | `/combos/:id` | — | Chi tiết combo |
| POST | `/combos` | 🔐 Admin | Tạo combo mới |
| PATCH | `/combos/:id` | 🔐 Admin | Cập nhật combo (name, description, price, imageUrl, isActive) |
| DELETE | `/combos/:id` | 🔐 Admin | Xóa combo |

Combo có thể được thêm vào booking khi đặt vé bằng cách truyền `comboItems` vào `POST /bookings`.

**Request body — tạo combo:**
```json
{
  "name": "Combo 1 Bắp 2 Nước",
  "description": "1 Bắp ngọt lớn + 2 Nước ngọt cỡ vừa",
  "price": 90000,
  "imageUrl": "https://res.cloudinary.com/..."
}
```

---

### Bookings

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/bookings/showtimes/:showtimeId/seats` | — | Sơ đồ ghế theo suất chiếu (kèm trạng thái + giá) |
| GET | `/bookings` | ✅ | Lịch sử đặt vé của user (filter: `status`) |
| GET | `/bookings/all` | 🔐 Admin | Tất cả booking (filter: `status`, `userId`) |
| GET | `/bookings/:id` | ✅ | Chi tiết booking (kèm showtime, movie, seats, combos) |
| POST | `/bookings` | ✅ | Đặt vé — giữ ghế 10 phút |
| PATCH | `/bookings/:id/confirm` | ✅ | Đã tắt, trả 409; xác nhận qua thanh toán |
| PATCH | `/bookings/:id/cancel` | ✅ | Hủy booking |

**Request body — đặt vé (kèm combo):**
```json
{
  "showtimeId": 5,
  "seatIds": [101, 102],
  "comboItems": [
    { "comboId": 1, "quantity": 2 },
    { "comboId": 3, "quantity": 1 }
  ]
}
```

`comboItems` là tùy chọn — bỏ qua nếu không muốn thêm combo. `totalPrice` tự động cộng thêm giá combo × số lượng.

> Sau khi tạo booking, ghế được giữ trong **10 phút** (trạng thái `PENDING`). Nếu quá thời gian mà chưa confirm, ghế tự động trống lại — không cần cron job, xử lý trong query `findOccupiedSeatIdsByShowtimeId`.

> Mỗi booking tối đa **8 ghế**.

**Seat status trong sơ đồ ghế:**
- `AVAILABLE` — trống, có thể chọn
- `OCCUPIED` — đã đặt hoặc đang được giữ bởi PENDING còn hạn
- `UNAVAILABLE` — ghế bị deactivate (hỏng)

---

### Payments — VNPay Sandbox

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/payments` | Bearer JWT | Tạo hoặc lấy lại phiên thanh toán VNPay |
| GET | `/payments/:id` | Bearer JWT, chủ payment | Đọc trạng thái đã lưu trong database |
| GET | `/payments/vnpay/ipn` | Chữ ký VNPay, không JWT | Nhận kết quả thanh toán và cập nhật booking |
| GET | `/payments/vnpay/return` | Chữ ký VNPay, không JWT | Nhận trình duyệt quay lại, không cập nhật thanh toán |
| GET | `/payments/review-required?page=1&limit=20` | Bearer JWT, admin | Liệt kê giao dịch cần đối soát |
| POST | `/payments/:id/confirm` | Bearer JWT, chỉ MOCK khi được bật | Xác nhận giả lập trong môi trường phát triển |
| POST | `/payments/:id/fail` | Bearer JWT, chỉ MOCK khi được bật | Hủy giả lập trong môi trường phát triển |

**Cấu hình Railway trước khi triển khai:**

1. Đăng ký [VNPay Sandbox](https://sandbox.vnpayment.vn/devreg/) để nhận mã merchant và khóa bí mật.
2. Sao lưu database, chạy `npm run migrate:vnpay` trong thư mục backend với cấu hình MYSQL của database cần nâng cấp. Lệnh có thể chạy lại; thêm bốn cột đối soát và unique index `tickets(booking_id)`. Nếu có vé trùng booking, lệnh dừng trước khi sửa schema để bạn kiểm tra thủ công; không tự xóa vé. Không import lại `schema.sql` vào database đang chạy.
3. Thêm các biến backend sau vào Railway Variables:

```env
NODE_ENV=production
PAYMENT_DEFAULT_PROVIDER=VNPAY
PAYMENT_MOCK_ENABLED=false
VNPAY_TMN_CODE=<merchant-sandbox>
VNPAY_HASH_SECRET=<secret-sandbox>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://<backend-domain>/payments/vnpay/return
FRONTEND_URL=
VNPAY_FRONTEND_RETURN_PATH=/payment-result
```

4. Đăng ký/cấu hình IPN phía VNPay: `https://<backend-domain>/payments/vnpay/ipn`. URL phải có HTTPS và được VNPay truy cập công khai. Đây không phải tham số thêm vào URL thanh toán.
5. Khi frontend có trang kết quả, cấu hình `FRONTEND_URL=https://<frontend-domain>`. Hiện frontend chưa sửa nên có thể để trống: Return trả JSON `PROCESSING` thay vì redirect vào trang chưa tồn tại.
6. Backend và MySQL cần thống nhất cách lưu/đọc DATETIME và đồng bộ đồng hồ. Trên Railway thường dùng UTC; không tự đổi quy ước của database cũ. Service VNPay chuyển các Date sang GMT+7 khi gửi gateway.

Khóa bí mật chỉ ở backend, không commit `.env`, không dùng biến `VITE_*`. Chưa cấu hình VNPay thì tạo payment trả `503`; IPN trả `RspCode: "99"`. Không tự chạy migration khi server khởi động.

**Request — tạo payment:**

```json
{
  "bookingId": 10,
  "provider": "VNPAY"
}
```

`provider` mặc định lấy từ `PAYMENT_DEFAULT_PROVIDER`, mặc định hệ thống là `VNPAY`. `MOMO` chưa được tích hợp và bị từ chối. MOCK mặc định tắt, chỉ bật được khi `NODE_ENV != production` và `PAYMENT_MOCK_ENABLED=true`; production luôn chặn cả tạo MOCK lẫn hai endpoint giả lập.

Backend kiểm tra quyền sở hữu booking, trạng thái PENDING, hạn giữ ghế và suất chiếu. Số tiền lấy từ database, không nhận `amount` từ frontend. Một booking chỉ dùng lại phiên VNPAY PENDING còn hạn của chính nó. Phiên MOCK cũ bị đánh dấu FAILED khi tạo phiên VNPAY; không tái sử dụng nhầm provider.

**Response — HTTP 201:**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "bookingId": 10,
    "userId": 7,
    "amount": 180000,
    "status": "PENDING",
    "provider": "VNPAY",
    "transactionId": null,
    "createdAt": "2026-10-05T03:00:00.000Z",
    "expiredAt": "2026-10-05T03:10:00.000Z",
    "paidAt": null,
    "gatewayResponseCode": null,
    "gatewayTransactionStatus": null,
    "gatewayProcessedAt": null,
    "reviewRequired": false,
    "reviewReason": null,
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_...&vnp_SecureHash=...",
    "instructions": "Chuyển trình duyệt đến paymentUrl để thanh toán VNPay Sandbox"
  }
}
```

Frontend chuyển toàn bộ trình duyệt đến `paymentUrl`, không dùng axios/fetch để tải trang gateway. `vnp_TxnRef` là payment ID duy nhất; retry sau FAILED có ID mới. `vnp_Amount = amount * 100`. URL ký HMAC-SHA512 trên tham số đã sắp xếp và encode theo VNPay. `vnp_ExpireDate` bằng thời điểm hết giữ ghế còn lại, không cộng thêm 15 phút.

**IPN — query string VNPay gửi:** `vnp_TmnCode`, `vnp_TxnRef`, `vnp_Amount`, `vnp_ResponseCode`, `vnp_TransactionStatus`, `vnp_TransactionNo`, `vnp_PayDate`, `vnp_SecureHash` cùng các tham số gateway khác.

IPN kiểm tra chữ ký, merchant, cấu trúc tham số, payment/provider và số tiền. Thành công chỉ khi cả `vnp_ResponseCode` và `vnp_TransactionStatus` bằng `00`. Tham số lặp hoặc chữ ký sai bị từ chối. Thành công cần mã giao dịch và ngày thanh toán hợp lệ.

IPN luôn trả HTTP 200 với JSON riêng theo giao thức VNPay, **không bọc `success/data`**:

```json
{ "RspCode": "00", "Message": "Confirm success" }
```

| RspCode | Ý nghĩa |
|---|---|
| 00 | Kết quả đã được ghi nhận, bao gồm giao dịch thất bại hoặc cần đối soát |
| 02 | IPN giống hệt đã được ghi nhận |
| 01 | Không tìm thấy payment/booking |
| 04 | Số tiền không khớp |
| 97 | Chữ ký, merchant hoặc tham số không hợp lệ |
| 99 | Lỗi xử lý, kết quả mâu thuẫn hoặc phát hành vé cần thử lại |

Payment và booking được khóa và cập nhật trong transaction. IPN lặp/đồng thời không xác nhận lại booking. Tạo booking kiểm tra lại ghế trong transaction; hủy booking cập nhật có điều kiện PENDING để không ghi đè kết quả IPN. `PATCH /bookings/:id/confirm` đã bị chặn với HTTP 409; xác nhận booking phải đi qua thanh toán.

**Thanh toán thành công nhưng không thể cung cấp vé:** lưu payment SUCCESS cùng `reviewRequired: true`, không xác nhận booking và không phát hành vé. Các lý do:

- `HOLD_EXPIRED`: IPN được xử lý sau khi hết hạn giữ ghế, kể cả khách thanh toán trước hạn.
- `BOOKING_CANCELLED`: booking đã hủy.
- `SHOWTIME_UNAVAILABLE`: suất chiếu hủy hoặc đã bắt đầu.
- `DUPLICATE_PAYMENT`: booking đã xác nhận hoặc đã có payment thành công khác.
- `PAYMENT_OUTSIDE_WINDOW`: thời gian thanh toán nằm ngoài phiên.
- `SEAT_CONFLICT`: ghế đã có booking khác chiếm/giữ.

Admin xem `GET /payments/review-required` (page >= 1, limit 1–100), response theo cấu trúc `{ success: true, data: { data: [...], total, page, limit, totalPages } }`. Đây là danh sách đối soát; **chưa triển khai API hoàn tiền tự động**. Giao dịch cần đối soát không được coi là đã có vé chỉ vì payment SUCCESS.

**Vé và email:** kết quả thanh toán được commit trước. Phát hành vé dùng transaction, khóa booking, kiểm tra payment SUCCESS hợp lệ, và unique index trên booking để chống vé trùng. Nếu phát hành lỗi, IPN trả 99; IPN lặp, `GET /tickets/booking/:id` của chủ booking và worker 30 giây sẽ thử lại. Worker chạy khi server khởi động; database lưu bền danh sách booking đã thanh toán nhưng thiếu vé. Email gửi sau khi phát hành vé mới, không chặn IPN; lỗi SMTP được log, chưa có hàng đợi retry email.

**Return URL:** xác minh chữ ký và số tiền, không cập nhật database. Nếu chưa có `FRONTEND_URL`, trả:

```json
{
  "success": true,
  "data": {
    "paymentId": 3,
    "bookingId": 10,
    "status": "PROCESSING",
    "instructions": "Đăng nhập và gọi GET /payments/:id để đọc kết quả đã xác minh qua IPN"
  }
}
```

Nếu đã cấu hình frontend, trả HTTP 303 tới `<FRONTEND_URL>/<VNPAY_FRONTEND_RETURN_PATH>?paymentId=3&bookingId=10`. Không đưa JWT vào URL. Frontend đọc `GET /payments/:id` bằng JWT; Return và IPN có thể đến theo bất kỳ thứ tự nào. Không tự xác nhận thành công từ query của Return.

**Kiểm thử:** `npm test`. Kiểm thử bao gồm chữ ký, encode, GMT+7, số tiền, IPN trùng/đồng thời, đối soát, rollback, phục hồi vé, quyền sở hữu và endpoint MOCK bị chặn. Sau triển khai cần kiểm thử end-to-end bằng tài khoản/thẻ Sandbox từ [tài liệu VNPay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html): thành công, hủy, hết hạn, đóng trình duyệt, callback lặp và lỗi phát hành vé.

---



### Tickets

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/tickets/booking/:bookingId` | ✅ | Lấy vé điện tử theo bookingId |

> Vé điện tử được **tự động phát hành** ngay sau khi payment confirm thành công — không cần gọi endpoint riêng để tạo vé.

> API trả về `qrCode` dạng chuỗi UUID. Frontend tự render thành hình ảnh QR bằng thư viện phù hợp.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bookingId": 10,
    "userId": 3,
    "showtimeId": 5,
    "qrCode": "a1b2c3d4-e5f6-...",
    "isUsed": false,
    "usedAt": null,
    "issuedAt": "2025-12-25T19:05:00.000Z"
  }
}
```

---

### Users

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/users/me` | ✅ | Xem hồ sơ cá nhân |
| PATCH | `/users/me` | ✅ | Cập nhật hồ sơ (name, phone, dateOfBirth, avatarUrl) |
| PATCH | `/users/me/password` | ✅ | Đổi mật khẩu |
| GET | `/users` | 🔐 Admin | Danh sách user (filter: `role`) |
| PATCH | `/users/:id/role` | 🔐 Admin | Cập nhật role (user ↔ admin) |

> Admin không thể tự hạ role của chính mình.

---

### Reports

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/reports/overview` | 🔐 Admin | Tổng quan: tổng doanh thu, tổng vé, phim đang chiếu |
| GET | `/reports/revenue/time` | 🔐 Admin | Doanh thu theo ngày/tháng (`groupBy=day\|month`) |
| GET | `/reports/revenue/movies` | 🔐 Admin | Doanh thu theo từng phim |
| GET | `/reports/revenue/cinemas` | 🔐 Admin | Doanh thu theo từng rạp |

**Query params chung cho revenue endpoints:**
```
?startDate=2025-01-01&endDate=2025-12-31
```

**Response — overview:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000000,
    "totalBookings": 120,
    "activeMovies": 5
  }
}
```

---

### Upload

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/upload/image` | 🔐 Admin | Upload ảnh quản trị lên Cloudinary (poster, rạp...) |
| POST | `/upload/avatar` | ✅ User/Admin | Upload ảnh đại diện cá nhân lên Cloudinary |

**Request cho cả 2 endpoint:** `multipart/form-data`, field name là `image`.

Chấp nhận: `JPG`, `PNG`, `WEBP`. Tối đa **5MB**.

**Response thành công:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/cinema-app/abc123.jpg",
    "publicId": "cinema-app/abc123"
  }
}
```

**Mã lỗi phổ biến:**
- `400 Bad Request`: `Không tìm thấy file ảnh trong request` (thiếu field image hoặc không đính kèm file)
- `400 Bad Request`: `File quá lớn, tối đa 5MB` (kích thước file vượt quá 5MB)
- `400 Bad Request`: `Chỉ chấp nhận file ảnh JPG, PNG, WEBP` (sai định dạng mime)
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ / hết hạn
- `403 Forbidden`: Truy cập `/upload/image` mà không có quyền Admin

> URL trả về từ `/upload/image` có thể dùng làm `posterUrl` hoặc `imageUrl`. URL trả về từ `/upload/avatar` được gửi tiếp sang `PATCH /users/me` với `{ "avatarUrl": data.url }` để cập nhật hồ sơ cá nhân.

---

## Luồng nghiệp vụ chính

### Luồng đặt vé đầy đủ (với Combo + Payment + Ticket + Email)

```
1. User xem danh sách phim đang chiếu
   GET /movies?status=now_showing

2. Chọn phim → xem lịch chiếu theo ngày
   GET /showtimes?movieId=1&date=2025-12-25

3. Chọn suất chiếu → xem sơ đồ ghế còn trống + giá
   GET /bookings/showtimes/:showtimeId/seats

4. (Tùy chọn) Xem danh sách combo bắp nước
   GET /combos?isActive=true

5. Chọn ghế + combo → đặt vé (cần đăng nhập)
   POST /bookings  { showtimeId, seatIds, comboItems }
   → Ghế được giữ 10 phút, status = PENDING
   → totalPrice = tổng ghế + tổng combo

6. Khởi tạo payment session
   POST /payments  { bookingId, provider: "VNPAY" }
   → Nhận paymentUrl

7. Chuyển trình duyệt đến paymentUrl để thanh toán VNPay Sandbox
   VNPay gọi GET /payments/vnpay/ipn để cập nhật kết quả
   → Payment: SUCCESS
   → Booking: CONFIRMED     (trong 1 transaction)
   → Ticket: tự động phát hành (qrCode sinh tự động)
   → Email: gửi xác nhận tới địa chỉ email của user
```

### Luồng đánh giá phim

```
1. User xem chi tiết phim
   GET /movies/:id

2. Xem đánh giá của người khác
   GET /movies/:movieId/ratings?page=1&limit=10
   → Kèm averageScore và totalRatings trong meta

3. Sau khi đã xem phim (booking CONFIRMED), gửi đánh giá
   POST /movies/:movieId/ratings
   { "score": 9, "review": "Phim rất hay!" }
   → 403 nếu chưa có booking CONFIRMED cho phim này
   → 409 nếu đã rate phim này rồi
```

### Luồng thanh toán thất bại / thử lại

```
1. Khách hủy/thất bại ở VNPay; gateway gọi IPN
   → Payment: FAILED, Booking vẫn PENDING (nếu còn trong hold)

2. Tạo lại payment session
   POST /payments  { bookingId }
   → Session VNPAY mới, expiredAt vẫn không vượt hạn giữ ghế ban đầu

3. Chuyển trình duyệt đến paymentUrl mới
   → VNPay gọi IPN, frontend đọc GET /payments/:id
```

### Luồng xác thực

```
1. Đăng nhập → nhận accessToken (15 phút) + refreshToken (30 ngày)
2. Mỗi request gửi kèm: Authorization: Bearer <accessToken>
3. Khi accessToken hết hạn → dùng refreshToken để lấy accessToken mới
   POST /auth/refresh-token  { refreshToken }
4. Đăng xuất → xóa refreshToken khỏi DB
   POST /auth/signOut  { refreshToken }
   # Hoặc đăng xuất tất cả thiết bị:
   POST /auth/signOut  { logoutAll: true }
```

### Luồng upload và gán ảnh

```
1. Admin upload ảnh
   POST /upload/image  (multipart/form-data, field: image)
   → Nhận url + publicId từ Cloudinary

2. Dùng url vào khi tạo/cập nhật phim
   POST /movies  { ..., posterUrl: "https://res.cloudinary.com/..." }

3. Hoặc dùng vào khi tạo/cập nhật rạp
   PATCH /cinemas/:id  { imageUrl: "https://res.cloudinary.com/..." }
```

### Luồng cập nhật suất chiếu

```
1. Kiểm tra suất chiếu chưa có vé nào
2. Admin cập nhật thông tin
   PATCH /showtimes/:id  { roomId?, startTime?, basePrice?, vipPrice?, couplePrice? }
   → Tự động tính lại endTime nếu startTime thay đổi
   → Kiểm tra conflict lịch phòng (bỏ qua chính suất chiếu đang update)
   → Validate giá: vipPrice >= basePrice, couplePrice >= basePrice
```

### Luồng báo cáo (Admin)

```
1. Xem tổng quan dashboard
   GET /reports/overview

2. Xem doanh thu theo tháng trong Q4 2025
   GET /reports/revenue/time?groupBy=month&startDate=2025-10-01&endDate=2025-12-31

3. Xem phim nào đang dẫn đầu doanh thu
   GET /reports/revenue/movies?startDate=2025-01-01

4. Xem rạp nào có doanh thu cao nhất
   GET /reports/revenue/cinemas
```

---

## Database Schema

```sql
users         (id, name, email, password_hash, role, avatar_url, phone, date_of_birth, updated_at, created_at)
refresh_tokens(id, user_id, token, expires_at, created_at)

movies  (id, title, duration, genres, directors, release_date, end_date,
         poster_url, description, age_rating, language, created_at)

cinemas (id, name, address, city, phone, image_url, created_at)
rooms   (id, cinema_id, name, type, total_rows, seats_per_row, created_at)
seats   (id, room_id, row, number, type, is_active, created_at)

showtimes (id, movie_id, room_id, start_time, end_time,
           base_price, vip_price, couple_price, cancelled_at, created_at)

combos        (id, name, description, price, image_url, is_active, created_at)

bookings      (id, user_id, showtime_id, total_price, status,
               held_until, confirmed_at, cancelled_at, created_at)
booking_seats (id, booking_id, seat_id, seat_label, seat_type, price)
booking_combos(id, booking_id, combo_id, combo_name, quantity, price)

payments (id, booking_id, user_id, amount, status, provider,
          transaction_id, expired_at, paid_at, created_at,
          gateway_response_code, gateway_transaction_status,
          review_reason, gateway_processed_at)

tickets (id, booking_id, user_id, showtime_id, qr_code,
         is_used, used_at, issued_at)

ratings (id, user_id, movie_id, score, review, created_at)
        -- UNIQUE KEY (user_id, movie_id)
```

Cascade deletes: `cinemas → rooms → seats`, `bookings → booking_seats → booking_combos`, `movies → ratings`, `users → ratings`.

---

## Các quyết định thiết kế

**`endTime` không để client truyền vào** — tính server-side từ `movie.duration + 15 phút` để đảm bảo không có suất chiếu nào bị nhập sai thời lượng, và đảm bảo kiểm tra conflict lịch chính xác.

**`status` không lưu vào DB** — cả `Movie.status`, `Showtime.status`, `Payment.isExpired()` đều là computed getter tính từ timestamp. Không bao giờ bị stale, không cần cron job cập nhật.

**Giá vé snapshot tại thời điểm đặt** — `booking_seats.price` lưu giá tại lúc tạo booking, không reference ngược về `showtimes`. Admin đổi giá sau không ảnh hưởng booking cũ. Tương tự, `booking_combos.price` và `combo_name` cũng là snapshot tại thời điểm đặt.

**Hold ghế không cần Redis hay cron** — `held_until` là timestamp trong DB. Query `findOccupiedSeatIdsByShowtimeId` chỉ tính ghế là "đang bị giữ" khi `status = 'PENDING' AND held_until > NOW()`. PENDING hết hạn tự động bị bỏ qua.

**Payment tách khỏi Booking** — 1 booking có thể có nhiều lần thử thanh toán (FAILED rồi thử lại). Payment lưu `transactionId` từ cổng TT để đối soát. VNPay Sandbox đã được tích hợp qua service gateway, repository và ProcessVnpayHandler; MOMO chưa hỗ trợ.

**Payment + Booking update trong transaction** — IPN hợp lệ cập nhật payment và booking cùng transaction. Nếu tiền thành công nhưng booking không còn khả dụng, giữ payment SUCCESS cùng reviewRequired, không phát hành vé; admin đối soát.

**Vé điện tử phát hành và phục hồi tự động** — sau khi lưu kết quả thanh toán, IssueTicketHandler phát hành vé có khóa và unique index. Vé thiếu được phục hồi qua IPN retry, API lấy vé của chủ booking và worker định kỳ 30 giây; không làm mất kết quả thanh toán đã nhận.

**Email gửi bất đồng bộ trong try-catch** — lỗi SMTP không làm hỏng luồng thanh toán. Email failure được log ra console và bỏ qua.

**Cập nhật suất chiếu chặn khi có vé** — `UpdateShowtimeHandler` kiểm tra `hasBookings()` trước khi cho phép sửa. Nếu đã có vé PENDING hoặc CONFIRMED, trả về lỗi `409` để bảo vệ tính toàn vẹn dữ liệu.

**`PATCH /:id/cancel` thay vì `DELETE`** — soft delete để giữ audit trail. Booking và showtime đã hủy vẫn cần tham chiếu được từ lịch sử.

**Conflict lịch chiếu** — dùng overlap condition chuẩn: `startTime_mới < end_time_cũ AND endTime_mới > start_time_cũ`, chỉ kiểm tra suất chưa hủy (`cancelled_at IS NULL`). Khi update showtime, bỏ qua chính suất chiếu đang được sửa (`excludeId`).

**Rating chỉ dành cho người đã xem** — `CreateRatingHandler` gọi `bookingRepository.existsConfirmedByUserIdAndMovieId()` để xác minh user thực sự đã xem phim trước khi cho phép đánh giá. Tránh fake review từ người chưa mua vé. UNIQUE KEY `(user_id, movie_id)` ở tầng DB là lớp bảo vệ cuối cùng.

**Rating response kèm thông tin user** — `findByMovieId` JOIN thêm bảng `users` để lấy `name` và `avatar_url`, tránh client phải gọi thêm API. Dùng monkey-patch `toJSON()` ở tầng repository thay vì tạo thêm DTO class riêng — đơn giản hơn cho use case chỉ dùng ở 1 chỗ.

**Rate limiting 2 tầng** — `globalLimiter` (100 req / 15 phút) áp dụng toàn API; `authLimiter` (10 req / phút) chỉ áp dụng cho `/signUp` và `/signIn` để chống brute-force.
