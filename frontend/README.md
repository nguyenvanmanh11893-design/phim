# 🎬 CineBooking - Frontend Application

Giao diện người dùng và bảng điều khiển quản trị cho **Hệ Thống Đặt Vé Xem Phim Trực Tuyến CineBooking**, được xây dựng trên nền tảng **React 19**, **Vite** và **React Router 7**.

---

## 📌 Mục Lục

- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Tính Năng Chính](#-tính-năng-chính)
  - [Dành Cho Khách Hàng (Customer Portal)](#1-dành-cho-khách-hàng-customer-portal)
  - [Dành Cho Quản Trị Viên (Admin Portal)](#2-dành-cho-quản-trị-viên-admin-portal)
- [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
  - [1. Cài đặt thư viện](#1-cài-đặt-thư-viện)
  - [2. Cấu hình biến môi trường](#2-cấu-hình-biến-môi-trường)
  - [3. Khởi chạy môi trường phát triển (Development)](#3-khởi-chạy-môi-trường-phát-triển-development)
  - [4. Đóng gói cho Production (Build)](#4-đóng-gói-cho-production-build)
- [Các Scripts Có Sẵn](#-các-scripts-có-sẵn)
- [Kiến Trúc & Bảo Mật](#-kiến-trúc--bảo-mật)

---

## 🚀 Công Nghệ Sử Dụng

- **Core Framework:** [React 19](https://react.dev/)
- **Bundler & Build Tool:** [Vite 8](https://vite.dev/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Tiện ích & Thư viện:**
  - `qrcode`: Tạo mã QR động cho vé điện tử (E-Ticket).
- **Linter & Code Quality:** ESLint 10, `@vitejs/plugin-react`
- **Giao tiếp API:** Fetch API kết hợp cơ chế tự động làm mới JWT (Single-flight Refresh Token Mutex).

---

## ✨ Tính Năng Chính

### 1. Dành Cho Khách Hàng (Customer Portal)
- **Trang chủ & Khám phá:** Banner phim nổi bật, danh sách phim đang chiếu và sắp chiếu, bộ lọc theo thể loại/độ tuổi.
- **Chi tiết phim:** Xem thông tin đạo diễn, diễn viên, thời lượng, trailer, mô tả và đánh giá từ cộng đồng.
- **Hệ thống Rạp:** Tra cứu hệ thống cụm rạp, địa chỉ và thông tin liên hệ.
- **Đặt vé trực quan:**
  - Chọn suất chiếu theo rạp, ngày giờ và phòng chiếu.
  - Sơ đồ ghế động với trạng thái thời gian thực (Ghế Thường, VIP, Ghế Đôi).
  - Đặt kèm combo bắp nước tiện lợi.
  - Cơ chế giữ chỗ tạm thời trong 10 phút.
- **Thanh toán & Vé điện tử:**
  - Hỗ trợ các cổng thanh toán (Mock Payment, VNPay, MoMo).
  - Xuất vé điện tử trực tuyến kèm mã QR Code để quét tại rạp.
- **Quản lý cá nhân:**
  - Đăng ký, đăng nhập, đổi mật khẩu và cập nhật thông tin cá nhân.
  - Lịch sử đặt vé và xem lại chi tiết vé đã đặt.
  - Đánh giá và nhận xét phim đã xem.

### 2. Dành Cho Quản Trị Viên (Admin Portal)
- **Bảng điều khiển Tổng quan (Overview):** Theo dõi tổng doanh thu, tổng số đơn đặt vé, số lượng phim đang chiếu và danh sách đơn hàng mới nhất.
- **Quản lý Phim (Movies):** Thêm mới, chỉnh sửa thông tin phim, upload poster, cập nhật ngày chiếu/kết thúc.
- **Quản lý Rạp & Phòng chiếu (Cinemas & Rooms):** Thiết lập thông tin cụm rạp, thêm phòng chiếu tương ứng.
- **Cấu hình Sơ đồ ghế (Seats):** Thiết lập ma trận hàng/cột và loại ghế (Normal, VIP, Couple) cho từng phòng chiếu.
- **Quản lý Suất chiếu (Showtimes):** Lên lịch chiếu phim theo phòng chiếu, định giá vé theo từng khung giờ.
- **Quản lý Combo Bắp Nước (Combos):** Thêm và điều chỉnh giá các gói bắp nước ưu đãi.
- **Quản lý Đơn đặt vé (Bookings):** Theo dõi toàn bộ lịch sử đơn đặt vé, trạng thái thanh toán và thông tin khách hàng.
- **Quản lý Người dùng (Users):** Danh sách người dùng hệ thống, phân quyền vai trò (Admin / Customer).
- **Báo cáo Doanh thu (Reports):**
  - Thống kê doanh thu và lượt đặt vé theo thời gian (ngày / tháng).
  - Thống kê hiệu quả kinh doanh theo từng phim.
  - Thống kê doanh thu theo từng cụm rạp.
  - Bộ lọc khoảng ngày linh hoạt (7 ngày, 30 ngày, 3 tháng, Tất cả).
  - Xuất báo cáo ra định dạng file CSV chuẩn UTF-8 BOM.
- **Quản lý Đánh giá (Ratings):** Kiểm duyệt nhận xét, điểm số đánh giá từ khách hàng.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```plaintext
frontend/
├── public/                     # Static assets công khai
├── src/
│   ├── assets/                 # Hình ảnh, biểu tượng nội bộ
│   ├── components/             # Reusable UI components
│   │   └── common/             # Header, Footer, ProtectedRoute, AdminRoute, ErrorBoundary...
│   ├── context/                # React Context (AuthContext quản lý phiên đăng nhập)
│   ├── layouts/                # Layout chia khu vực (AdminLayout, CustomerLayout)
│   ├── pages/                  # Các trang giao diện chính
│   │   ├── admin/              # Các trang quản trị hệ thống (AdminOverview, AdminReports...)
│   │   ├── HomePage.jsx        # Trang chủ khách hàng
│   │   ├── BookingPage.jsx     # Trang chọn ghế và đặt vé
│   │   ├── CheckoutPage.jsx    # Trang xác nhận thanh toán
│   │   ├── TicketPage.jsx      # Trang hiển thị vé điện tử (QR Code)
│   │   └── ...
│   ├── services/               # Tầng giao tiếp Backend API
│   │   ├── apiClient.js        # HTTP client chính kèm token refresh mutex
│   │   ├── authService.js      # API xác thực, đăng nhập/đăng ký
│   │   ├── bookingService.js   # API đặt vé, giữ ghế, sơ đồ ghế
│   │   ├── reportService.js    # API báo cáo thống kê doanh thu
│   │   └── ...
│   ├── styles/                 # Global styles, variables, typography
│   ├── utils/                  # Hàm tiện ích (format tiền VND, format ngày giờ...)
│   ├── App.jsx                 # Cấu hình Route chính của ứng dụng
│   ├── main.jsx                # Entry point của React App
│   └── index.css               # Base CSS & CSS Reset
├── .env                        # Biến môi trường local
├── index.html                  # HTML template chính của Vite
├── package.json                # Danh sách dependencies & scripts
├── vite.config.js              # Cấu hình Vite bundler
└── README.md                   # Tài liệu hướng dẫn dự án
```

---

## 💻 Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

- **Node.js**: Phiên bản `18.x` trở lên (Khuyến nghị `Node.js 20+ LTS`).
- **Trình quản lý gói**: `npm` (đi kèm Node.js) hoặc `yarn` / `pnpm`.
- **Backend API**: Máy chủ backend Express đang chạy (mặc định tại cổng `3000`).

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện

Mở terminal tại thư mục `frontend` và chạy lệnh:

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo hoặc chỉnh sửa file `.env` tại thư mục gốc của `frontend`:

```env
# Địa chỉ URL máy chủ Backend API
VITE_API_BASE_URL=http://localhost:3000
```

> **Lưu ý:** Nếu backend của bạn chạy ở cổng khác (ví dụ: `http://localhost:5000`), hãy điều chỉnh giá trị `VITE_API_BASE_URL` tương ứng.

### 3. Khởi chạy môi trường phát triển (Development)

Khởi động Vite Dev Server với tính năng Hot Module Replacement (HMR):

```bash
npm run dev
```

Mở trình duyệt và truy cập:
- Mặc định: [http://localhost:5173](http://localhost:5173) (hoặc [http://localhost:5174](http://localhost:5174) nếu cổng 5173 đang bận).

### 4. Đóng gói cho Production (Build)

Để kiểm tra build và đóng gói ứng dụng sẵn sàng triển khai:

```bash
# 1. Biên dịch và tối ưu mã nguồn vào thư mục dist/
npm run build

# 2. Chạy thử bản build production tại local
npm run preview
```

---



## 📜 Các Scripts Có Sẵn

Trong file `package.json`, các câu lệnh hỗ trợ phát triển bao gồm:

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi chạy Vite development server hỗ trợ HMR. |
| `npm run build` | Đóng gói tối ưu hóa mã nguồn cho môi trường Production. |
| `npm run preview` | Khởi chạy máy chủ local xem trước bản build từ thư mục `dist`. |
| `npm run lint` | Chạy ESLint kiểm tra lỗi cú pháp và quy chuẩn code style. |

---

## 🛡️ Kiến Trúc & Bảo Mật

1. **Bảo mật phiên đăng nhập (JWT & Refresh Token):**
   - Tự động đính kèm `Bearer Token` vào header mọi request yêu cầu xác thực qua `apiClient.js`.
   - Cơ chế **Single-flight Mutex**: Khi Access Token hết hạn (401), client tự động đưa các request đồng thời vào hàng đợi, gọi API `/auth/refresh-token` để lấy token mới một lần duy nhất rồi tiếp tục retry các request mà không làm gián đoạn trải nghiệm người dùng.
   - Khi phiên làm việc hoàn toàn hết hạn hoặc refresh token không hợp lệ, hệ thống tự động dọn dẹp bộ nhớ và điều hướng về trang đăng nhập.

2. **Route Guards:**
   - [`ProtectedRoute`](file:///D:/Cinema/phim/frontend/src/components/common/ProtectedRoute.jsx): Ngăn chặn người dùng chưa đăng nhập truy cập các trang cá nhân, lịch sử đặt vé, thanh toán.
   - [`AdminRoute`](file:///D:/Cinema/phim/frontend/src/components/common/AdminRoute.jsx): Chỉ cho phép tài khoản có `role === 'ADMIN'` truy cập các trang trong khu vực `/admin/*`, ngăn chặn truy cập trái phép bằng trang [`ForbiddenPage`](file:///D:/Cinema/phim/frontend/src/pages/ForbiddenPage.jsx) (403).
