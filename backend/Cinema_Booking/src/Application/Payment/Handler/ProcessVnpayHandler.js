export function reviewVnpayPayment(payment, booking, showtime, result, otherSuccess) {
  if (otherSuccess || booking.status === "CONFIRMED") return "DUPLICATE_PAYMENT";
  if (booking.status !== "PENDING") return "BOOKING_CANCELLED";
  if (!showtime || showtime.status !== "SCHEDULED") return "SHOWTIME_UNAVAILABLE";
  if (!booking.hold_valid) return "HOLD_EXPIRED";
  if (result.paidAt < new Date(payment.created_at) || result.paidAt > new Date(payment.expired_at) ||
      result.paidAt > new Date(booking.held_until) || result.paidAt > new Date()) return "PAYMENT_OUTSIDE_WINDOW";
  return null;
}
const reply = (RspCode, Message) => ({ RspCode, Message });

class ProcessVnpayHandler {
  constructor(vnpayService, repository, issueTicketHandler) {
    this.vnpayService = vnpayService;
    this.repository = repository;
    this.issueTicketHandler = issueTicketHandler;
  }
  async execute(query) {
    const result = this.vnpayService.verify(query);
    if (!result) return reply("97", "Invalid signature or parameters");
    const initial = await this.repository.findPayment(result.paymentId);
    if (!initial) return reply("01", "Order not found");
    const outcome = await this.repository.transaction(async (conn) => {
      // Consistent lock order: booking -> payment -> showtime.
      const booking = await this.repository.lockBooking(conn, initial.booking_id);
      const payment = await this.repository.lockPayment(conn, result.paymentId);
      if (!booking || !payment || payment.provider !== "VNPAY") return { response: reply("01", "Order not found") };
      if (result.amount !== Number(payment.amount) * 100) return { response: reply("04", "Invalid amount") };
      if (payment.gateway_processed_at) {
        if (payment.transaction_id !== result.transactionId || payment.gateway_response_code !== result.responseCode ||
            payment.gateway_transaction_status !== result.transactionStatus) return { response: reply("99", "Conflicting transaction result") };
        return { response: reply("02", "Order already confirmed"),
          issue: payment.status === "SUCCESS" && !payment.review_reason && booking.status === "CONFIRMED", booking };
      }
      const showtime = await this.repository.lockShowtime(conn, booking.showtime_id);
      let reviewReason = null;
      if (result.success) {
        const otherSuccess = await this.repository.hasOtherSuccess(conn, booking.id, payment.id);
        reviewReason = reviewVnpayPayment(payment, booking, showtime, result, otherSuccess);
        if (!reviewReason && await this.repository.hasSeatConflict(conn, booking.id, booking.showtime_id)) reviewReason = "SEAT_CONFLICT";
        if (!reviewReason && !await this.repository.confirmBooking(conn, booking.id)) reviewReason = "HOLD_EXPIRED";
      }
      // Preserve the financial result even when a booking can no longer be fulfilled.
      await this.repository.recordResult(conn, payment.id, result, reviewReason);
      return { response: reply("00", "Confirm success"), issue: result.success && !reviewReason, booking };
    });
    if (outcome.issue) {
      try {
        await this.issueTicketHandler.execute({ bookingId: Number(outcome.booking.id), userId: Number(outcome.booking.user_id) });
      } catch (error) {
        console.error("[VNPay] Ticket issuance pending:", error.message);
        return reply("99", "Payment recorded; ticket issuance pending");
      }
    }
    return outcome.response;
  }
}
export default ProcessVnpayHandler;
