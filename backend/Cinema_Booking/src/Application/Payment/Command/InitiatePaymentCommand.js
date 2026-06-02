// Application/Payment/Command/InitiatePaymentCommand.js
import AppError from "../../../Domain/Errors/AppError.js";

const ALLOWED_PROVIDERS = ["MOCK", "VNPAY", "MOMO"];

class InitiatePaymentCommand {
  constructor({ bookingId, userId, provider }) {
    // ── bookingId ─────────────────────────────────────────────────────
    if (
      !bookingId ||
      !Number.isInteger(Number(bookingId)) ||
      Number(bookingId) <= 0
    ) {
      throw new AppError(
        "bookingId is required and must be a positive integer",
        400,
      );
    }

    // ── userId — lấy từ req.user, không lấy từ body ───────────────────
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw new AppError(
        "userId is required and must be a positive integer",
        400,
      );
    }

    // ── provider — optional, mặc định MOCK ────────────────────────────
    if (provider !== undefined && !ALLOWED_PROVIDERS.includes(provider)) {
      throw new AppError(
        `provider must be one of: ${ALLOWED_PROVIDERS.join(", ")}`,
        400,
      );
    }

    this.bookingId = Number(bookingId);
    this.userId = Number(userId);
    this.provider = provider ?? "MOCK";
  }
}

export default InitiatePaymentCommand;
