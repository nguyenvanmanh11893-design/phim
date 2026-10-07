import { randomUUID } from "node:crypto";
import Ticket from "../../../Domain/Ticket/Entity/Ticket.js";

class IssueTicketHandler {
  constructor(bookingRepository, ticketRepository, showtimeRepository, userRepository, emailService) {
    this.bookingRepository = bookingRepository;
    this.ticketRepository = ticketRepository;
    Object.assign(this, { showtimeRepository, userRepository, emailService });
  }
  async execute({ bookingId, userId }) {
    const { ticket, created, provider } = await this.ticketRepository.issueForConfirmedBooking(bookingId, userId, (booking) =>
      Ticket.create({ bookingId: Number(booking.id), userId: Number(booking.user_id),
        showtimeId: Number(booking.showtime_id), qrCode: randomUUID() }));
    // Notify only the caller that actually created the VNPay ticket.
    // Email failure must never roll back a received payment or issued ticket.
    if (created && provider === "VNPAY" && this.emailService) {
      void this.notify(bookingId, userId, ticket);
    }

    return { message: "Vé điện tử đã được phát hành", ticket: ticket.toJSON() };
  }
  async notify(bookingId, userId, ticket) {
    try {
      const booking = await this.bookingRepository.findByIdAndUserId(bookingId, userId);
      const showtime = await this.showtimeRepository.findById(booking.showtimeId);
      const user = await this.userRepository.findById(userId);
      if (user?.email && showtime) await this.emailService.sendBookingConfirmation(
        user.email.value, booking.toJSON(), showtime.toJSON(), ticket.toJSON());
    } catch (error) { console.error("[Ticket email]", error.message); }
  }
}
export default IssueTicketHandler;
