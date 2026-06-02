class ReportRepositoryInterface {
  /**
   * Lấy dữ liệu tổng quan cho Dashboard
   * @returns {Promise<{totalRevenue: number, totalBookings: number, activeMovies: number}>}
   */
  async getDashboardOverview() {
    throw new Error("Method not implemented.");
  }

  /**
   * Báo cáo doanh thu theo thời gian (Ngày / Tháng)
   * @param {Object} params
   * @param {string} params.startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} params.endDate - Ngày kết thúc (YYYY-MM-DD)
   * @param {string} params.groupBy - 'day' hoặc 'month'
   * @returns {Promise<Array<{date: string, revenue: number}>>}
   */
  async getRevenueByTime({ startDate, endDate, groupBy }) {
    throw new Error("Method not implemented.");
  }

  /**
   * Báo cáo doanh thu theo Phim
   * @param {Object} params
   * @param {string} params.startDate
   * @param {string} params.endDate
   * @returns {Promise<Array<{movieId: number, title: string, revenue: number}>>}
   */
  async getRevenueByMovie({ startDate, endDate }) {
    throw new Error("Method not implemented.");
  }

  /**
   * Báo cáo doanh thu theo Rạp (Cinema)
   * @param {Object} params
   * @param {string} params.startDate
   * @param {string} params.endDate
   * @returns {Promise<Array<{cinemaId: number, cinemaName: string, revenue: number}>>}
   */
  async getRevenueByCinema({ startDate, endDate }) {
    throw new Error("Method not implemented.");
  }
}

export default ReportRepositoryInterface;
