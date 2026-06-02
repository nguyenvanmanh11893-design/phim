// src/Infrastructure/Http/Controllers/TicketController.js
import GetTicketQuery from "../../../Application/Ticket/Query/GetTicketQuery.js";

class TicketController {
  constructor(getTicketHandler) {
    // Không cần issueTicketHandler ở đây nữa vì đã được chuyển sang Payment
    this.getTicketHandler = getTicketHandler;
  }

  // GET /tickets/booking/:bookingId
  async getByBooking(req, res, next) {
    try {
      const query = new GetTicketQuery({
        bookingId: Number(req.params.bookingId),
        userId: req.user.userId, // Lấy từ authMiddleware
      });

      // Handler trả về entity đã gọi .toJSON(), chứa sẵn qrCode dạng chuỗi thô
      const ticket = await this.getTicketHandler.execute(query);

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default TicketController;
