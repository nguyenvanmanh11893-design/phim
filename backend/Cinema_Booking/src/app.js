import express from "express";
import cors from "cors";
import { errorMiddleware } from "./Infrastructure/Http/Middlewares/errorMiddleware.js";
import authRoutes from "./Infrastructure/Http/Routes/authRoutes.js";
import movieRoutes from "./Infrastructure/Http/Routes/movieRoutes.js";
import cinemaRoutes from "./Infrastructure/Http/Routes/cinemaRoutes.js";
import roomRoutes from "./Infrastructure/Http/Routes/roomRoutes.js";
import seatRoutes from "./Infrastructure/Http/Routes/seatRoutes.js";
import showtimeRoutes from "./Infrastructure/Http/Routes/showtimeRoutes.js";
import bookingRoutes from "./Infrastructure/Http/Routes/bookingRoutes.js";
import paymentRoutes from "./Infrastructure/Http/Routes/paymentRoutes.js";
import uploadRoutes from "./Infrastructure/Http/Routes/uploadRoutes.js";
import ticketRoutes from "./Infrastructure/Http/Routes/ticketRoutes.js";
import userRoutes from "./Infrastructure/Http/Routes/userRoutes.js";
import reportRoutes from "./Infrastructure/Http/Routes/reportRoutes.js";
import comboRoutes from "./Infrastructure/Http/Routes/comboRoutes.js";
import { globalLimiter } from "./Infrastructure/Http/Middlewares/rateLimitMiddleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Thay bằng URL chạy React của bạn (Vite mặc định là 5173)
    credentials: true, // RẤT QUAN TRỌNG: Cho phép đính kèm token/cookie từ frontend gửi xuống
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Các method HTTP được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Chấp nhận các header này
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);
app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/cinemas", cinemaRoutes);
app.use("/rooms", roomRoutes);
app.use("/seats", seatRoutes);
app.use("/showtimes", showtimeRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/tickets", ticketRoutes);
app.use("/users", userRoutes);
app.use("/upload", uploadRoutes);
app.use("/reports", reportRoutes);
app.use("/combos", comboRoutes);

// Health check — test nhanh server có chạy không
app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

// Error handler — PHẢI để cuối cùng, sau tất cả routes
app.use(errorMiddleware);

export default app;
