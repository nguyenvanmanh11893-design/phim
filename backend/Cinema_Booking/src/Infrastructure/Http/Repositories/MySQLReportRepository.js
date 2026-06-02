import ReportRepositoryInterface from "../../../Domain/Report/Repository/ReportRepositoryInterface.js";

class MySQLReportRepository extends ReportRepositoryInterface {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async getDashboardOverview() {
    // 1. Tổng doanh thu (từ các payment SUCCESS)
    const [[{ totalRevenue }]] = await this.pool.execute(
      `SELECT SUM(amount) AS totalRevenue 
       FROM payments 
       WHERE status = 'SUCCESS'`,
    );

    // 2. Tổng số vé đã đặt (bookings CONFIRMED)
    const [[{ totalBookings }]] = await this.pool.execute(
      `SELECT COUNT(*) AS totalBookings 
       FROM bookings 
       WHERE status = 'CONFIRMED'`,
    );

    // 3. Số phim đang chiếu (hiện tại nằm giữa release_date và end_date)
    const [[{ activeMovies }]] = await this.pool.execute(
      `SELECT COUNT(*) AS activeMovies 
       FROM movies 
       WHERE NOW() BETWEEN release_date AND end_date`,
    );

    return {
      totalRevenue: Number(totalRevenue || 0),
      totalBookings: Number(totalBookings || 0),
      activeMovies: Number(activeMovies || 0),
    };
  }

  async getRevenueByTime({ startDate, endDate, groupBy }) {
    // Xác định format group by: theo ngày (YYYY-MM-DD) hoặc theo tháng (YYYY-MM)
    const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

    let query = `
      SELECT DATE_FORMAT(paid_at, ?) AS date, SUM(amount) AS revenue
      FROM payments
      WHERE status = 'SUCCESS'
    `;
    const params = [dateFormat];

    if (startDate) {
      query += ` AND paid_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ` AND paid_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` GROUP BY date ORDER BY date ASC`;

    const [rows] = await this.pool.execute(query, params);

    return rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue || 0),
    }));
  }

  async getRevenueByMovie({ startDate, endDate }) {
    let query = `
      SELECT m.id AS movieId, m.title, SUM(p.amount) AS revenue
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE p.status = 'SUCCESS'
    `;
    const params = [];

    if (startDate) {
      query += ` AND p.paid_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ` AND p.paid_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` GROUP BY m.id, m.title ORDER BY revenue DESC`;

    const [rows] = await this.pool.execute(query, params);

    return rows.map((row) => ({
      movieId: row.movieId,
      title: row.title,
      revenue: Number(row.revenue || 0),
    }));
  }

  async getRevenueByCinema({ startDate, endDate }) {
    let query = `
      SELECT c.id AS cinemaId, c.name AS cinemaName, SUM(p.amount) AS revenue
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN rooms r ON s.room_id = r.id
      JOIN cinemas c ON r.cinema_id = c.id
      WHERE p.status = 'SUCCESS'
    `;
    const params = [];

    if (startDate) {
      query += ` AND p.paid_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ` AND p.paid_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` GROUP BY c.id, c.name ORDER BY revenue DESC`;

    const [rows] = await this.pool.execute(query, params);

    return rows.map((row) => ({
      cinemaId: row.cinemaId,
      cinemaName: row.cinemaName,
      revenue: Number(row.revenue || 0),
    }));
  }
}

export default MySQLReportRepository;
