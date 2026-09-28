import apiClient, { ApiError } from './apiClient';

export const paymentService = {
  /**
   * Khởi tạo hoặc lấy phiên thanh toán PENDING còn hạn cho booking
   * Endpoint: POST /payments
   * @param {Object} params
   * @param {number|string} params.bookingId
   * @param {string} [params.provider='MOCK']
   * @returns {Promise<Object>} Đối tượng payment trong response.data
   */
  async createPayment({ bookingId, provider = 'MOCK' }) {
    if (!bookingId) {
      throw new ApiError('bookingId là bắt buộc', 400);
    }
    const response = await apiClient.post('/payments', {
      bookingId: Number(bookingId),
      provider,
    });
    return response.data;
  },

  /**
   * Lấy chi tiết phiên thanh toán theo ID
   * Endpoint: GET /payments/:id
   * @param {number|string} id
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object>} Đối tượng payment trong response.data
   */
  async getPaymentById(id, signal) {
    if (!id) {
      throw new ApiError('id phiên thanh toán là bắt buộc', 400);
    }
    const response = await apiClient.get(`/payments/${id}`, { signal });
    return response.data;
  },

  /**
   * Giả lập thanh toán thành công (chỉ hỗ trợ MOCK)
   * Endpoint: POST /payments/:id/confirm
   * @param {number|string} id
   * @returns {Promise<{ message: string, payment: Object, booking: Object, ticket: Object|null }>} response.data
   */
  async confirmPayment(id) {
    if (!id) {
      throw new ApiError('id phiên thanh toán là bắt buộc', 400);
    }
    const response = await apiClient.post(`/payments/${id}/confirm`);
    return response.data;
  },

  /**
   * Giả lập thanh toán thất bại / hủy (chỉ hỗ trợ MOCK)
   * Endpoint: POST /payments/:id/fail
   * @param {number|string} id
   * @returns {Promise<{ message: string, payment: Object }>} response.data
   */
  async failPayment(id) {
    if (!id) {
      throw new ApiError('id phiên thanh toán là bắt buộc', 400);
    }
    const response = await apiClient.post(`/payments/${id}/fail`);
    return response.data;
  },
};

export default paymentService;
