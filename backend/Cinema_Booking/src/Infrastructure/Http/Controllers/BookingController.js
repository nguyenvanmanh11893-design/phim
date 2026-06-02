// src/Infrastructure/Http/Controllers/BookingController.js
import CreateBookingCommand from "../../../Application/Booking/Command/CreateBookingCommand.js";
import CancelBookingCommand from "../../../Application/Booking/Command/CancelBookingCommand.js";
import ConfirmBookingCommand from "../../../Application/Booking/Command/ConfirmBookingCommand.js";
import GetBookingQuery from "../../../Application/Booking/Query/GetBookingQuery.js";
import ListBookingsQuery from "../../../Application/Booking/Query/ListBookingsQuery.js";
import GetSeatMapForShowtimeQuery from "../../../Application/Booking/Query/GetSeatMapForShowtimeQuery.js";
import ListAllBookingsQuery from "../../../Application/Booking/Query/ListAllBookingsQuery.js";

class BookingController {
  constructor(
    createBookingHandler,
    cancelBookingHandler,
    confirmBookingHandler,
    getBookingHandler,
    listBookingsHandler,
    getSeatMapForShowtimeHandler,
    listAllBookingsHandler,
  ) {
    this.createBookingHandler = createBookingHandler;
    this.cancelBookingHandler = cancelBookingHandler;
    this.confirmBookingHandler = confirmBookingHandler;
    this.getBookingHandler = getBookingHandler;
    this.listBookingsHandler = listBookingsHandler;
    this.getSeatMapForShowtimeHandler = getSeatMapForShowtimeHandler;
    this.listAllBookingsHandler = listAllBookingsHandler;
  }

  // GET /showtimes/:showtimeId/seats
  async getSeatMap(req, res, next) {
    try {
      const query = new GetSeatMapForShowtimeQuery({
        showtimeId: Number(req.params.showtimeId),
      });
      const result = await this.getSeatMapForShowtimeHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /bookings
  async list(req, res, next) {
    try {
      const query = new ListBookingsQuery({
        userId: req.user.userId,
        status: req.query.status,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      const result = await this.listBookingsHandler.execute(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async listAll(req, res, next) {
    try {
      const query = new ListAllBookingsQuery({
        status: req.query.status,
        userId: req.query.userId,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      const result = await this.listAllBookingsHandler.execute(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /bookings/:id
  async get(req, res, next) {
    try {
      const query = new GetBookingQuery({
        id: Number(req.params.id),
        userId: req.user.userId,
      });
      const result = await this.getBookingHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /bookings
  async create(req, res, next) {
    try {
      const command = new CreateBookingCommand({
        ...req.body,
        userId: req.user.userId, // không lấy từ body, lấy từ JWT
      });
      const result = await this.createBookingHandler.execute(command);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /bookings/:id/confirm
  async confirm(req, res, next) {
    try {
      const command = new ConfirmBookingCommand({
        id: Number(req.params.id),
        userId: req.user.userId,
      });
      const result = await this.confirmBookingHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /bookings/:id/cancel
  async cancel(req, res, next) {
    try {
      const command = new CancelBookingCommand({
        id: Number(req.params.id),
        userId: req.user.userId,
      });
      const result = await this.cancelBookingHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default BookingController;
