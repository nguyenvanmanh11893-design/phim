import apiClient from './apiClient';

export const reportService = {
  /**
   * Lấy số liệu tổng quan hệ thống (Admin)
   * Endpoint: GET /reports/overview
   * Lưu ý: Không nhận query lọc ngày
   * Trả về { totalRevenue, totalBookings, activeMovies }
   */
  async getOverview(signal) {
    const response = await apiClient.get('/reports/overview', { signal });
    return response.data;
  },

  /**
   * Lấy báo cáo doanh thu theo thời gian (ngày/tháng) (Admin)
   * Endpoint: GET /reports/revenue/time
   * @param {Object} [params]
   * @param {string} [params.startDate] - Format YYYY-MM-DD
   * @param {string} [params.endDate] - Format YYYY-MM-DD
   * @param {'day'|'month'} [params.groupBy='day']
   * @param {AbortSignal} [params.signal]
   */
  async getRevenueByTime({ startDate, endDate, groupBy = 'day', signal } = {}) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (groupBy) queryParams.append('groupBy', groupBy);

    const endpoint = `/reports/revenue/time${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });
    return response.data || [];
  },

  /**
   * Lấy báo cáo doanh thu theo từng phim (Admin)
   * Endpoint: GET /reports/revenue/movies
   * @param {Object} [params]
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {AbortSignal} [params.signal]
   */
  async getRevenueByMovies({ startDate, endDate, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const endpoint = `/reports/revenue/movies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });
    return response.data || [];
  },

  /**
   * Lấy báo cáo doanh thu theo từng rạp (Admin)
   * Endpoint: GET /reports/revenue/cinemas
   * @param {Object} [params]
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {AbortSignal} [params.signal]
   */
  async getRevenueByCinemas({ startDate, endDate, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const endpoint = `/reports/revenue/cinemas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });
    return response.data || [];
  },
};

export default reportService;
