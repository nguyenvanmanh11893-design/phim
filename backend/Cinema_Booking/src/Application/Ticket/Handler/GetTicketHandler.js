import AppError from "../../../Domain/Errors/AppError.js";

class GetTicketHandler {
  constructor(ticketRepository, issueTicketHandler) {
    this.ticketRepository = ticketRepository;
    this.issueTicketHandler = issueTicketHandler;
  }
  async execute({ bookingId, userId }) {
    let ticket = await this.ticketRepository.findByBookingId(bookingId);
    if (ticket && ticket.userId !== userId) throw new AppError("Không tìm thấy vé", 404);
    if (!ticket) {
      // Ownership and successful payment are checked under a booking lock.
      const issued = await this.issueTicketHandler.execute({ bookingId, userId });
      return issued.ticket;
    }
    return ticket.toJSON();
  }
}
export default GetTicketHandler;
