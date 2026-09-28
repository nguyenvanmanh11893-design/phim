import apiClient from './apiClient';

export const showtimeService = {
  /**
   * Lấy danh sách suất chiếu theo bộ lọc (1 trang)
   * @param {Object} params
   * @param {number} [params.movieId]
   * @param {number} [params.cinemaId]
   * @param {string} [params.date] - Định dạng YYYY-MM-DD
   * @param {string} [params.status] - 'SCHEDULED' | 'ONGOING' | 'ENDED' | 'CANCELLED'
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {AbortSignal} [params.signal]
   */
  async getShowtimes({ movieId, cinemaId, date, status, page = 1, limit = 20, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (movieId) queryParams.append('movieId', movieId);
    if (cinemaId) queryParams.append('cinemaId', cinemaId);
    if (date) queryParams.append('date', date);
    if (status) queryParams.append('status', status);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);

    const queryStr = queryParams.toString();
    const endpoint = `/showtimes${queryStr ? `?${queryStr}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });

    return {
      showtimes: response.data || [],
      total: response.total ?? response.meta?.total ?? 0,
      page: response.page ?? response.meta?.page ?? page,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Lấy toàn bộ danh sách suất chiếu theo bộ lọc bằng cách tự động duyệt các trang theo meta
   * Đảm bảo không giới hạn 50 suất và xử lý đúng meta phân trang từ backend.
   * @param {Object} params
   * @param {number} [params.movieId]
   * @param {number} [params.cinemaId]
   * @param {string} [params.date]
   * @param {string} [params.status]
   * @param {AbortSignal} [params.signal]
   */
  async getAllShowtimes({ movieId, cinemaId, date, status, signal } = {}) {
    // Backend max limit is 100 per ListShowtimesQuery
    const firstPage = await this.getShowtimes({
      movieId,
      cinemaId,
      date,
      status,
      page: 1,
      limit: 100,
      signal,
    });

    let allShowtimes = [...(firstPage.showtimes || [])];
    const totalPages = firstPage.totalPages || 1;

    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(
          this.getShowtimes({
            movieId,
            cinemaId,
            date,
            status,
            page: p,
            limit: 100,
            signal,
          })
        );
      }
      const restPages = await Promise.all(pagePromises);
      restPages.forEach((res) => {
        if (res.showtimes && res.showtimes.length > 0) {
          allShowtimes = allShowtimes.concat(res.showtimes);
        }
      });
    }

    return {
      showtimes: allShowtimes,
      total: firstPage.total,
    };
  },

  /**
   * Lấy chi tiết suất chiếu (kèm thông tin movie, room, cinema)
   * @param {number|string} id
   * @param {AbortSignal} [signal]
   */
  async getShowtimeById(id, signal) {
    const response = await apiClient.get(`/showtimes/${id}`, { signal });
    return response.data;
  },

  /**
   * Lấy sơ đồ ghế và tình trạng đặt ghế của một suất chiếu
   * Endpoint theo đúng backend: GET /bookings/showtimes/:showtimeId/seats
   * @param {number|string} showtimeId
   * @param {AbortSignal} [signal]
   */
  async getSeatMap(showtimeId, signal) {
    const response = await apiClient.get(`/bookings/showtimes/${showtimeId}/seats`, { signal });
    return response.data;
  },

  /**
   * Tạo suất chiếu mới (Admin)
   * Endpoint: POST /showtimes
   * Body: { movieId, roomId, startTime, basePrice, vipPrice, couplePrice }
   */
  async createShowtime(data) {
    const response = await apiClient.post('/showtimes', data);
    return response.data;
  },

  /**
   * Cập nhật thông tin suất chiếu (Admin)
   * Endpoint: PATCH /showtimes/:id
   * Lưu ý: Response có thể trả về { message, showtime } thay vì envelope { data }
   */
  async updateShowtime(id, data) {
    const response = await apiClient.patch(`/showtimes/${id}`, data);
    return response.data || response.showtime || response;
  },

  /**
   * Hủy suất chiếu (Admin)
   * Endpoint: PATCH /showtimes/:id/cancel
   */
  async cancelShowtime(id) {
    const response = await apiClient.patch(`/showtimes/${id}/cancel`);
    return response.data;
  },
};

export default showtimeService;
