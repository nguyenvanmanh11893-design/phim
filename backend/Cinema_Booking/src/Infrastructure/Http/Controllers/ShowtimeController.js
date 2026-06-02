// Infrastructure/Http/Controllers/ShowtimeController.js
import CreateShowtimeCommand from "../../../Application/Showtime/Command/CreateShowtimeCommand.js";
import CancelShowtimeCommand from "../../../Application/Showtime/Command/CancelShowtimeCommand.js";
import GetShowtimeQuery from "../../../Application/Showtime/Query/GetShowtimeQuery.js";
import ListShowtimesQuery from "../../../Application/Showtime/Query/ListShowtimesQuery.js";
import UpdateShowtimeCommand from "../../../Application/Showtime/Command/UpdateShowtimeCommand.js";

class ShowtimeController {
  constructor(
    createShowtimeHandler,
    cancelShowtimeHandler,
    getShowtimeHandler,
    listShowtimesHandler,
    updateShowtimeHandler,
  ) {
    this.createShowtimeHandler = createShowtimeHandler;
    this.cancelShowtimeHandler = cancelShowtimeHandler;
    this.getShowtimeHandler = getShowtimeHandler;
    this.listShowtimesHandler = listShowtimesHandler;
    this.updateShowtimeHandler = updateShowtimeHandler;
  }

  // GET /showtimes
  async list(req, res, next) {
    try {
      const query = new ListShowtimesQuery({
        movieId: req.query.movieId ? Number(req.query.movieId) : undefined,
        cinemaId: req.query.cinemaId ? Number(req.query.cinemaId) : undefined,
        date: req.query.date,
        status: req.query.status,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      const result = await this.listShowtimesHandler.execute(query);

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /showtimes/:id
  async get(req, res, next) {
    try {
      const query = new GetShowtimeQuery({ id: Number(req.params.id) });
      const result = await this.getShowtimeHandler.execute(query);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /showtimes
  async create(req, res, next) {
    try {
      const command = new CreateShowtimeCommand(req.body);
      const result = await this.createShowtimeHandler.execute(command);

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /showtimes/:id/cancel
  async cancel(req, res, next) {
    try {
      const command = new CancelShowtimeCommand({ id: Number(req.params.id) });
      const result = await this.cancelShowtimeHandler.execute(command);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin suất chiếu
   */
  async update(req, res, next) {
    try {
      // Khởi tạo Command với ID từ params và dữ liệu từ body
      const command = new UpdateShowtimeCommand({
        id: req.params.id,
        roomId: req.body.roomId,
        startTime: req.body.startTime,
        basePrice: req.body.basePrice,
        vipPrice: req.body.vipPrice,
        couplePrice: req.body.couplePrice,
      });

      // Chạy Handler và nhận kết quả
      const result = await this.updateShowtimeHandler.execute(command);

      // Trả về JSON cho client
      res.status(200).json(result);
    } catch (error) {
      next(error); // Chuyển lỗi cho Error Middleware xử lý
    }
  }
}

export default ShowtimeController;
