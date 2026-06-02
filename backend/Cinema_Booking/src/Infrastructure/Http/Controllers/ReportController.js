import GetDashboardOverviewQuery from "../../../Application/Report/Query/GetDashboardOverviewQuery.js";
import GetRevenueByTimeQuery from "../../../Application/Report/Query/GetRevenueByTimeQuery.js";
import GetRevenueByMovieQuery from "../../../Application/Report/Query/GetRevenueByMovieQuery.js";
import GetRevenueByCinemaQuery from "../../../Application/Report/Query/GetRevenueByCinemaQuery.js";

class ReportController {
  constructor(
    getDashboardOverviewHandler,
    getRevenueByTimeHandler,
    getRevenueByMovieHandler,
    getRevenueByCinemaHandler,
  ) {
    this.getDashboardOverviewHandler = getDashboardOverviewHandler;
    this.getRevenueByTimeHandler = getRevenueByTimeHandler;
    this.getRevenueByMovieHandler = getRevenueByMovieHandler;
    this.getRevenueByCinemaHandler = getRevenueByCinemaHandler;
  }

  // GET /reports/overview
  async getOverview(req, res, next) {
    try {
      const query = new GetDashboardOverviewQuery({ userId: req.user.userId });
      const result = await this.getDashboardOverviewHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /reports/revenue/time
  async getRevenueByTime(req, res, next) {
    try {
      const query = new GetRevenueByTimeQuery({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        groupBy: req.query.groupBy || "day",
      });
      const result = await this.getRevenueByTimeHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /reports/revenue/movies
  async getRevenueByMovie(req, res, next) {
    try {
      const query = new GetRevenueByMovieQuery({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });
      const result = await this.getRevenueByMovieHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /reports/revenue/cinemas
  async getRevenueByCinema(req, res, next) {
    try {
      const query = new GetRevenueByCinemaQuery({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });
      const result = await this.getRevenueByCinemaHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default ReportController;
