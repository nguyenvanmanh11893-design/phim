import AppError from "../Errors/AppError.js";

class EmailServiceInterface {
  async sendBookingConfirmation(
    emailAddress,
    bookingDetails,
    showtimeDetails,
    ticketDetails,
  ) {
    throw new AppError("Not implemented", 500);
  }
}

export default EmailServiceInterface;
