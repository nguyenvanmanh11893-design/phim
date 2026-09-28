import apiClient, { ApiError } from './apiClient';

export const ticketService = {
  /**
   * Lấy vé điện tử theo bookingId
   * Endpoint: GET /tickets/booking/:bookingId
   * @param {number|string} bookingId
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object>} Đối tượng ticket trong response.data
   */
  async getTicketByBookingId(bookingId, signal) {
    if (!bookingId) {
      throw new ApiError('bookingId là bắt buộc', 400);
    }
    const response = await apiClient.get(`/tickets/booking/${bookingId}`, { signal });
    return response.data;
  },
};

export default ticketService;
