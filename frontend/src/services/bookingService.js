import apiClient from './apiClient';
import { ApiError } from './apiClient';

export const bookingService = {
  /**
   * Lấy sơ đồ ghế và trạng thái các ghế theo suất chiếu
   * Endpoint: GET /bookings/showtimes/:showtimeId/seats
   * @param {number|string} showtimeId
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object>} Data gồm showtime, seatMap (A, B...), summary
   */
  async getSeatMap(showtimeId, signal) {
    if (!showtimeId) {
      throw new ApiError('showtimeId là bắt buộc', 400);
    }
    const response = await apiClient.get(`/bookings/showtimes/${showtimeId}/seats`, { signal });
    return response.data;
  },

  /**
   * Tạo booking giữ ghế trong 10 phút
   * Endpoint: POST /bookings
   * Request body:
   * {
   *   "showtimeId": number,
   *   "seatIds": number[],
   *   "comboItems": [{ "comboId": number, "quantity": number }]
   * }
   * @param {Object} params
   * @param {number|string} params.showtimeId
   * @param {Array<number|string>} params.seatIds
   * @param {Array<{ comboId: number|string, quantity: number }>} [params.comboItems]
   * @returns {Promise<Object>} Booking data từ backend (kèm id, totalPrice, heldUntil, status...)
   */
  async createBooking({ showtimeId, seatIds, comboItems = [] }) {
    if (!showtimeId) {
      throw new ApiError('Vui lòng chọn suất chiếu hợp lệ', 400);
    }
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new ApiError('Vui lòng chọn ít nhất 1 ghế', 400);
    }
    if (seatIds.length > 8) {
      throw new ApiError('Mỗi lần đặt tối đa 8 ghế theo quy định', 400);
    }

    const payload = {
      showtimeId: Number(showtimeId),
      seatIds: seatIds.map((id) => Number(id)),
      comboItems: (comboItems || [])
        .filter((item) => item && Number(item.quantity) > 0)
        .map((item) => ({
          comboId: Number(item.comboId),
          quantity: Number(item.quantity),
        })),
    };

    const response = await apiClient.post('/bookings', payload);
    return response.data;
  },

  /**
   * Lấy chi tiết một booking theo ID
   * Endpoint: GET /bookings/:id
   * Yêu cầu đăng nhập (user sở hữu booking hoặc admin)
   * @param {number|string} id
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object>}
   */
  async getBookingById(id, signal) {
    if (!id) {
      throw new ApiError('ID booking không hợp lệ', 400);
    }
    const response = await apiClient.get(`/bookings/${id}`, { signal });
    return response.data;
  },

  /**
   * Hủy một booking (nếu đang PENDING)
   * Endpoint: PATCH /bookings/:id/cancel
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async cancelBooking(id) {
    if (!id) {
      throw new ApiError('ID booking không hợp lệ', 400);
    }
    const response = await apiClient.patch(`/bookings/${id}/cancel`);
    return response;
  },

  /**
   * Lấy danh sách booking của user hiện tại
   * Endpoint: GET /bookings
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.status] - 'PENDING' | 'CONFIRMED' | 'CANCELLED'
   * @param {AbortSignal} [params.signal]
   * @returns {Promise<{ bookings: Array, total: number, page: number, totalPages: number }>}
   */
  async getMyBookings({ page = 1, limit = 20, status, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (status) queryParams.append('status', status);

    const endpoint = `/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });

    return {
      bookings: response.data || [],
      total: response.total ?? response.meta?.total ?? 0,
      page: response.page ?? response.meta?.page ?? page,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Lấy toàn bộ danh sách đặt vé trong hệ thống (Admin)
   * Endpoint: GET /bookings/all
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.status] - 'PENDING' | 'CONFIRMED' | 'CANCELLED'
   * @param {number|string} [params.userId]
   * @param {AbortSignal} [params.signal]
   */
  async getAllBookings({ page = 1, limit = 20, status, userId, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (status) queryParams.append('status', status);
    if (userId) queryParams.append('userId', userId.toString());

    const endpoint = `/bookings/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });

    const list = response.data || [];
    return {
      bookings: list,
      data: list,
      total: response.total ?? response.meta?.total ?? 0,
      page: response.page ?? response.meta?.page ?? page,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },
};

export default bookingService;
