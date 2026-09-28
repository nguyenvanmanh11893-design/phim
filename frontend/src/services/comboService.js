import apiClient from './apiClient';

export const comboService = {
  /**
   * Lấy danh sách combo đang hoạt động
   * Endpoint: GET /combos?isActive=true
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {AbortSignal} [params.signal]
   * @returns {Promise<{ combos: Array, total: number, page: number, totalPages: number }>}
   */
  async getActiveCombos({ page = 1, limit = 50, signal } = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('isActive', 'true');
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    const endpoint = `/combos?${queryParams.toString()}`;
    const response = await apiClient.get(endpoint, { signal });

    return {
      combos: response.data || [],
      total: response.total ?? response.meta?.total ?? 0,
      page: response.page ?? response.meta?.page ?? page,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Lấy toàn bộ combo đang hoạt động (tự động phân trang nếu có nhiều trang)
   * @param {Object} [options]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<Array>}
   */
  async getAllActiveCombos({ signal } = {}) {
    const firstPage = await this.getActiveCombos({ page: 1, limit: 50, signal });
    let allCombos = [...(firstPage.combos || [])];
    const totalPages = firstPage.totalPages || 1;

    if (totalPages > 1) {
      const promises = [];
      for (let p = 2; p <= totalPages; p++) {
        promises.push(this.getActiveCombos({ page: p, limit: 50, signal }));
      }
      const rest = await Promise.all(promises);
      rest.forEach((res) => {
        if (res.combos && res.combos.length > 0) {
          allCombos = allCombos.concat(res.combos);
        }
      });
    }

    return allCombos;
  },

  /**
   * Lấy chi tiết combo theo ID
   * Endpoint: GET /combos/:id
   * @param {number|string} id
   * @param {AbortSignal} [signal]
   */
  async getComboById(id, signal) {
    const response = await apiClient.get(`/combos/${id}`, { signal });
    return response.data;
  },

  /**
   * Lấy danh sách combo (hỗ trợ lọc isActive = true/false hoặc không truyền để lấy tất cả)
   * Endpoint: GET /combos
   */
  async getCombos(options = {}) {
    let page = 1;
    let limit = 50;
    let isActive;
    let signal;

    if (typeof options === 'boolean') {
      isActive = options;
    } else if (options && typeof options === 'object') {
      page = options.page ?? 1;
      limit = options.limit ?? 50;
      isActive = options.isActive;
      signal = options.signal;
    }

    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (isActive !== undefined && isActive !== '') {
      queryParams.append('isActive', isActive.toString());
    }

    const endpoint = `/combos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });

    return {
      combos: response.data || [],
      total: response.total ?? response.meta?.total ?? 0,
      page: response.page ?? response.meta?.page ?? page,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Tạo combo mới (Admin)
   * Endpoint: POST /combos
   * Body: { name, description, price, imageUrl }
   */
  async createCombo(data) {
    const response = await apiClient.post('/combos', data);
    return response.data;
  },

  /**
   * Cập nhật combo (Admin)
   * Endpoint: PATCH /combos/:id
   * Body: { name, description, price, imageUrl, isActive }
   */
  async updateCombo(id, data) {
    const response = await apiClient.patch(`/combos/${id}`, data);
    return response.data;
  },

  /**
   * Xóa combo (Admin)
   * Endpoint: DELETE /combos/:id
   */
  async deleteCombo(id) {
    const response = await apiClient.delete(`/combos/${id}`);
    return response;
  },
};

export default comboService;
