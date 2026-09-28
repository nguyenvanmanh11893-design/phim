import apiClient from './apiClient';

export const cinemaService = {
  /**
   * Lấy danh sách rạp chiếu phim
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.city]
   */
  async getCinemas({ page = 1, limit = 20, city } = {}) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (city) queryParams.append('city', city);

    const queryStr = queryParams.toString();
    const endpoint = `/cinemas${queryStr ? `?${queryStr}` : ''}`;
    const response = await apiClient.get(endpoint);

    return {
      cinemas: response.data || [],
      total: response.total ?? response.meta?.total ?? 0,
      page: response.page ?? response.meta?.page ?? page,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Lấy chi tiết một rạp chiếu
   * @param {number|string} id
   */
  async getCinemaById(id) {
    const response = await apiClient.get(`/cinemas/${id}`);
    return response.data;
  },

  /**
   * Thêm rạp mới (Admin)
   * Endpoint: POST /cinemas
   */
  async createCinema(data) {
    const response = await apiClient.post('/cinemas', data);
    return response.data;
  },

  /**
   * Cập nhật thông tin rạp (Admin)
   * Endpoint: PATCH /cinemas/:id
   */
  async updateCinema(id, data) {
    const response = await apiClient.patch(`/cinemas/${id}`, data);
    return response.data;
  },

  /**
   * Xóa rạp (Admin)
   * Endpoint: DELETE /cinemas/:id
   */
  async deleteCinema(id) {
    const response = await apiClient.delete(`/cinemas/${id}`);
    return response;
  },

  /**
   * Lấy danh sách phòng của một rạp
   * Endpoint: GET /cinemas/:cinemaId/rooms
   */
  async getRoomsByCinema(cinemaId, signal) {
    const response = await apiClient.get(`/cinemas/${cinemaId}/rooms`, { signal });
    return response.data || [];
  },

  /**
   * Lấy chi tiết một phòng chiếu
   * Endpoint: GET /rooms/:id
   */
  async getRoomById(id, signal) {
    const response = await apiClient.get(`/rooms/${id}`, { signal });
    return response.data;
  },

  /**
   * Tạo phòng chiếu mới cho rạp (Tự sinh ghế) (Admin)
   * Endpoint: POST /cinemas/:cinemaId/rooms
   * Body: { name, type, totalRows, seatsPerRow }
   */
  async createRoom(cinemaId, data) {
    const response = await apiClient.post(`/cinemas/${cinemaId}/rooms`, data);
    return response.data;
  },

  /**
   * Cập nhật thông tin/kích thước phòng chiếu (Admin)
   * Endpoint: PATCH /rooms/:id
   * Body: { name, type, totalRows, seatsPerRow }
   */
  async updateRoom(id, data) {
    const response = await apiClient.patch(`/rooms/${id}`, data);
    return response.data;
  },

  /**
   * Xóa phòng chiếu (Admin)
   * Endpoint: DELETE /rooms/:id
   */
  async deleteRoom(id) {
    const response = await apiClient.delete(`/rooms/${id}`);
    return response;
  },

  /**
   * Lấy cấu hình sơ đồ ghế của phòng
   * Endpoint: GET /rooms/:roomId/seats
   * Trả về { room, seatMap, summary }
   */
  async getSeatsByRoom(roomId, signal) {
    const response = await apiClient.get(`/rooms/${roomId}/seats`, { signal });
    return response.data;
  },

  /**
   * Cập nhật loại ghế hoặc trạng thái hoạt động của ghế (Admin)
   * Endpoint: PATCH /seats/:id
   * Body: { type: 'NORMAL'|'VIP'|'COUPLE', isActive: boolean }
   */
  async updateSeat(id, data) {
    const response = await apiClient.patch(`/seats/${id}`, data);
    return response.data;
  },
};

export default cinemaService;
